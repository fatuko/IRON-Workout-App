const test = require('node:test');
const assert = require('node:assert/strict');
require('./register-typescript.cjs');
const { validateEmail, validateName, validatePassword } = require('../src/auth/validation.ts');
const { profileStats } = require('../src/utils/profile-stats.ts');
const { createLocalWorkoutRepository } = require('../src/repositories/local-workout-repository.ts');
const { callbackDestination } = require('../src/auth/callback-destination.ts');
test('password recovery opens reset for fragment and PKCE links', () => {
  assert.equal(callbackDestination('recovery', null, true), '/reset-password');
  assert.equal(callbackDestination(null, 'recovery', true), '/reset-password');
  assert.equal(callbackDestination(null, null, false), '/onboarding');
  assert.equal(callbackDestination(null, null, true), '/');
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
