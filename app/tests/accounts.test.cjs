const test = require('node:test');
const assert = require('node:assert/strict');
require('./register-typescript.cjs');
const { validateEmail, validateName, validatePassword } = require('../src/auth/validation.ts');
const { profileStats } = require('../src/utils/profile-stats.ts');
const { createLocalWorkoutRepository } = require('../src/repositories/local-workout-repository.ts');
const { callbackDestination } = require('../src/auth/callback-destination.ts');
const { loadWorkoutPage } = require('../src/utils/resolve-workout.ts');
test('password recovery opens reset for fragment and PKCE links', () => {
  assert.equal(callbackDestination('recovery', null), '/reset-password');
  assert.equal(callbackDestination(null, 'recovery'), '/reset-password');
  assert.equal(callbackDestination(null, null), '/');
});
test('signup rejects missing names, malformed email, weak and mismatched passwords', () => {
  assert.ok(validateName(' ', 'Last'));
  assert.equal(validateName('Jean-Luc', 'O’Connor'), null);
  assert.ok(validateEmail('name@'));
  assert.equal(validateEmail(' name@example.com '), null);
  assert.ok(validatePassword('short', 'short'));
  assert.ok(validatePassword('long-password', 'different-password'));
  assert.equal(validatePassword('long-password', 'long-password'), null);
});

const session = (id, date, weight = 100) => ({ id, status: 'completed', completedAt: date, exercises: [
  { id: 'bench', targetUnit: 'REPS', sets: [{ complete: true, weight: String(weight), reps: '8' }] },
] });
test('profile uses completed training weeks, not consecutive training days', () => {
  const stats = profileStats([session('a', '2026-10-19T12:00:00'), session('b', '2026-10-20T12:00:00', 105), session('c', '2026-10-26T12:00:00', 105)], new Date('2026-10-30T12:00:00'));
  assert.deepEqual(stats, { workouts: 3, streak: 2, records: 1 });
});
test('streak gives the current week time to complete, but resets after a missed week', () => {
  const history = [session('a', '2026-10-19T12:00:00')];
  assert.equal(profileStats(history, new Date('2026-10-30T12:00:00')).streak, 1);
  assert.equal(profileStats(history, new Date('2026-11-02T12:00:00')).streak, 0);
  assert.deepEqual(profileStats([]), { workouts: 0, streak: 0, records: 0 });
});
test('drafts and workouts with no completed sets do not inflate profile stats', () => {
  assert.equal(profileStats([{ ...session('a', '2026-10-19'), status: 'draft' }, { ...session('b', '2026-10-19'), exercises: [] }]).workouts, 0);
});
test('new accounts are empty, saved workouts survive reload, and accounts stay separate', async () => {
  const data = new Map();
  const storage = { getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value) };
  const a = createLocalWorkoutRepository('user-a', storage);
  const b = createLocalWorkoutRepository('user-b', storage);
  assert.deepEqual(await a.getWorkoutTemplates(), []);
  assert.deepEqual((await a.getActiveSplit()).days, []);
  await a.saveWorkoutTemplate({ id: 'push', name: 'Push', color: '#FF3D00', exercises: [
    { id: 'bench', name: 'Bench', sets: '1', target: '8–12', unit: 'REPS', pr: 'NO PR YET' },
  ] });
  const split = await a.getActiveSplit();
  const scheduled = await a.addWorkoutToSplit(split.id, 'push', 'MONDAY');
  const workout = await a.startWorkout(scheduled.days[0].id);
  await a.saveWorkoutSet(workout.id, 'bench', { id: 1, complete: true, weight: '100', reps: '8', seconds: '', rir: '2' });
  await a.finishWorkout(workout.id);
  const reloaded = createLocalWorkoutRepository('user-a', storage);
  assert.equal((await reloaded.getWorkoutHistory()).length, 1);
  assert.equal((await reloaded.getWorkoutTemplates()).length, 1);
  assert.deepEqual(await b.getWorkoutHistory(), []);
  assert.deepEqual(await b.getWorkoutTemplates(), []);
});
test('failed storage writes reject and roll back in-memory changes', async () => {
  const repo = createLocalWorkoutRepository('user', { getItem: () => null, setItem: () => { throw new Error('Storage full'); } });
  await assert.rejects(repo.saveWorkoutTemplate({ id: 'x', name: 'Push', exercises: [] }), /Storage full/);
  assert.deepEqual(await repo.getWorkoutTemplates(), []);
});

test('a scheduled empty workout starts after its edited template is saved', async () => {
  const data = new Map();
  const repo = createLocalWorkoutRepository('play-regression', { getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value) });
  const template = { id: 'push', name: 'Push', color: '#FF3D00', exercises: [] };
  await repo.saveWorkoutTemplate(template);
  const split = await repo.getActiveSplit();
  const scheduled = await repo.addWorkoutToSplit(split.id, template.id, 'MONDAY');
  const day = scheduled.days[0];
  await assert.rejects(repo.startWorkout(day.id), /no exercises/);
  await repo.saveWorkoutTemplate({ ...template, exercises: [
    { id: 'bench', name: 'Bench', sets: '3', target: '8–12', unit: 'REPS', pr: 'NO PR YET' },
  ] });
  const session = await repo.startWorkout(day.id);
  assert.equal(session.exercises[0].sets.length, 3);
  assert.equal((await repo.getWorkout(session.id)).status, 'draft');
  assert.equal((await repo.startWorkout(day.id)).id, session.id);
  assert.equal((await loadWorkoutPage(repo, 'stale-session-id')).session.id, session.id);
  assert.equal((await loadWorkoutPage(repo, session.id)).session.id, session.id);
});

test('today preloads without starting a session and ignores stale links', async () => {
  const repo = createLocalWorkoutRepository('missing-session', { getItem: () => null, setItem: () => {} });
  await repo.saveWorkoutTemplate({ id: 'push', name: 'Push', color: '#FF3D00', exercises: [
    { id: 'bench', name: 'Bench', sets: '3', target: '8', unit: 'REPS', pr: '' },
  ] });
  const split = await repo.getActiveSplit();
  await repo.addWorkoutToSplit(split.id, 'push', 'MONDAY');
  assert.equal((await loadWorkoutPage(repo, 'missing', new Date(2026, 9, 26, 12))).kind, 'ready');
  assert.equal(await repo.getDraftWorkout(), null);
  assert.equal((await loadWorkoutPage(repo, undefined, new Date(2026, 9, 27, 12))).kind, 'rest');
});

test('daily workout states use local weekdays and completion dates, including multiple plans', async () => {
  const now = new Date(2026, 9, 26, 12);
  const day = { id: 'monday', workoutDay: 'MONDAY' };
  let history = [];
  let days = [day, { id: 'tuesday', workoutDay: 'TUESDAY' }];
  const repo = {
    getWorkout: async () => history[0] ?? null,
    getDraftWorkout: async () => null,
    getActiveSplit: async () => ({ days, nextDayIndex: 1 }),
    getWorkoutHistory: async () => history,
  };
  assert.equal((await loadWorkoutPage(repo, undefined, now)).day.id, 'monday');
  history = [{ status: 'completed', splitDayId: 'monday', completedAt: new Date(2026, 9, 26, 8).toISOString() }];
  assert.equal((await loadWorkoutPage(repo, 'completed-session', now)).kind, 'done');
  days.push({ id: 'evening', workoutDay: 'MONDAY' });
  assert.equal((await loadWorkoutPage(repo, undefined, now)).day.id, 'evening');
  days = [day];
  history[0].completedAt = new Date(2026, 9, 25, 23).toISOString();
  assert.equal((await loadWorkoutPage(repo, undefined, now)).kind, 'ready');
  assert.equal((await loadWorkoutPage(repo, undefined, new Date(2026, 9, 27, 12))).kind, 'rest');
  repo.getDraftWorkout = async () => ({ id: 'ongoing', status: 'draft' });
  assert.equal((await loadWorkoutPage(repo, undefined, now)).session.id, 'ongoing');
});

test('one rest timer preference validates minutes and seconds and defaults safely', () => {
  const { restTimerSeconds, parseRestTimer, formatRestTimer } = require('../src/utils/rest-timer.ts');
  assert.equal(restTimerSeconds(undefined), 120);
  assert.equal(restTimerSeconds(90), 90);
  assert.equal(restTimerSeconds(-1), 120);
  assert.equal(parseRestTimer('1', '30'), 90);
  assert.equal(parseRestTimer('0', '05'), 5);
  assert.equal(parseRestTimer('60', '00'), 3600);
  for (const [minutes, seconds] of [['0', '0'], ['1', '60'], ['61', '00'], ['', '30'], ['1.5', '00'], ['-1', '30']]) {
    assert.equal(parseRestTimer(minutes, seconds), null);
  }
  assert.equal(formatRestTimer(90), '1:30');
});
