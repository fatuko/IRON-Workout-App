import type {
  PlannedExercise,
  SplitDay,
  WorkoutExercise,
  WorkoutSession,
  WorkoutSet,
  WorkoutSplit,
  WorkoutTemplate,
  Weekday,
} from '@/types/workout';

import type { WorkoutRepository } from './workout-repository';

const createId = (prefix: string) =>
  prefix + '-' + Date.now() + '-' + Math.random().toString(16).slice(2);

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

export function createLocalWorkoutRepository(userId: string, storage: { getItem(key: string): string | null; setItem(key: string, value: string): void }): WorkoutRepository {
const key = 'iron.workouts.v1.' + userId;
const saved = storage.getItem(key);
const state = saved ? JSON.parse(saved) : null;
if (state && (!Array.isArray(state.templates) || !Array.isArray(state.sessions) || !Array.isArray(state.split?.days))) {
  throw new Error('Saved workout data is invalid');
}
let workoutTemplates: WorkoutTemplate[] = state?.templates ?? [];
let activeSplit: WorkoutSplit = state?.split ?? {
  id: 'split-' + userId, name: 'My split', isActive: true, nextDayIndex: 0, days: [],
};
const sessions = new Map<string, WorkoutSession>((state?.sessions ?? []).map((session: WorkoutSession) => [session.id, session]));
function scheduleWorkout(workoutId: string, workoutDay: Weekday, id = createId('scheduled')): SplitDay {
  const workout = workoutTemplates.find((item) => item.id === workoutId);
  if (!workout) throw new Error('Workout template not found');
  return { id, workoutId, workoutDay, name: workout.name, color: workout.color, exercises: clone(workout.exercises) };
}

function parsePreviousPerformance(pr: string) {
  return pr === 'NO PR YET' ? 'No previous performance' : 'Previous best: ' + pr;
}

function createSets(count: number): WorkoutSet[] {
  return Array.from({ length: count }, (_, index) => ({
    id: index + 1,
    weight: '',
    reps: '',
    seconds: '',
    rir: '',
    complete: false,
  }));
}

function createWorkoutExercise(exercise: PlannedExercise, previousExercise?: WorkoutExercise): WorkoutExercise {
  const unitLabel = exercise.unit === 'REPS' ? 'reps' : 'seconds';
  return {
    id: exercise.id,
    name: exercise.name.toUpperCase(),
    repRange: exercise.target + ' ' + unitLabel,
    targetUnit: exercise.unit,
    lastPerformance: parsePreviousPerformance(exercise.pr),
    restSeconds: exercise.unit === 'REPS' ? 120 : 60,
    previousSets: clone(previousExercise?.sets.filter((set) => set.complete) ?? []),
    sets: createSets(Math.max(1, Number(exercise.sets) || 1)),
  };
}

class LocalWorkoutRepository implements WorkoutRepository {
  async getActiveSplit() {
    return clone(activeSplit);
  }

  async saveActiveSplit(split: WorkoutSplit) {
    activeSplit = clone(split);
    return clone(activeSplit);
  }

  async deleteSplitDay(splitId: string, splitDayId: string) {
    if (activeSplit.id !== splitId) throw new Error('Split not found');
    activeSplit = {
      ...activeSplit,
      days: activeSplit.days.filter((day) => day.id !== splitDayId),
    };
  }

  async addWorkoutToSplit(splitId: string, workoutId: string, workoutDay: Weekday) {
    if (activeSplit.id !== splitId) throw new Error('Split not found');
    activeSplit = { ...activeSplit, days: [...activeSplit.days, scheduleWorkout(workoutId, workoutDay)] };
    return clone(activeSplit);
  }

  async getWorkoutTemplates() {
    return clone(workoutTemplates);
  }

  async saveWorkoutTemplate(workout: WorkoutTemplate) {
    const exists = workoutTemplates.some((item) => item.id === workout.id);
    workoutTemplates = exists
      ? workoutTemplates.map((item) => item.id === workout.id ? clone(workout) : item)
      : [...workoutTemplates, clone(workout)];
    activeSplit = {
      ...activeSplit,
      days: activeSplit.days.map((day) => day.workoutId === workout.id
        ? { ...day, name: workout.name, color: workout.color, exercises: clone(workout.exercises) }
        : day),
    };
    return clone(workout);
  }

  async deleteWorkoutTemplate(workoutId: string) {
    workoutTemplates = workoutTemplates.filter((item) => item.id !== workoutId);
    activeSplit = { ...activeSplit, days: activeSplit.days.filter((day) => day.workoutId !== workoutId) };
  }

  async getSplitDay(splitDayId: string): Promise<SplitDay | null> {
    return clone(activeSplit.days.find((day) => day.id === splitDayId) ?? null);
  }

  async startWorkout(splitDayId: string) {
    const day = activeSplit.days.find((item) => item.id === splitDayId);
    if (!day) throw new Error('Split day not found');
    if (day.exercises.length === 0) throw new Error('Split day has no exercises');

    const existing = await this.getDraftWorkout();
    if (
      existing &&
      existing.splitDayId === splitDayId &&
      existing.exercises.length > 0
    ) {
      return existing;
    }
    if (existing) sessions.delete(existing.id);

    const session: WorkoutSession = {
      id: createId('workout'),
      splitId: activeSplit.id,
      splitDayId: day.id,
      workoutName: day.name,
      status: 'draft',
      startedAt: new Date().toISOString(),
      completedAt: null,
      exercises: day.exercises.map((plannedExercise) => {
        const previousExercise = [...sessions.values()]
          .filter((previousSession) => previousSession.status === 'completed')
          .sort((a, b) => (b.completedAt ?? '').localeCompare(a.completedAt ?? ''))
          .map((previousSession) => previousSession.exercises.find((item) => item.id === plannedExercise.id))
          .find((item): item is WorkoutExercise => Boolean(item));
        return createWorkoutExercise(plannedExercise, previousExercise);
      }),
    };
    sessions.set(session.id, clone(session));
    return clone(session);
  }

  async getWorkout(sessionId: string) {
    return clone(sessions.get(sessionId) ?? null);
  }

  async getDraftWorkout() {
    const draft = [...sessions.values()].find((session) => session.status === 'draft');
    return clone(draft ?? null);
  }

  async saveWorkoutSet(sessionId: string, exerciseId: string, set: WorkoutSet) {
    const session = sessions.get(sessionId);
    if (!session) throw new Error('Workout not found');

    session.exercises = session.exercises.map((exercise) =>
      exercise.id === exerciseId
        ? {
            ...exercise,
            sets: exercise.sets.some((item) => item.id === set.id)
              ? exercise.sets.map((item) => item.id === set.id ? clone(set) : item)
              : [...exercise.sets, clone(set)],
          }
        : exercise,
    );
    sessions.set(sessionId, session);
  }

  async deleteWorkoutSet(sessionId: string, exerciseId: string, setId: number) {
    const session = sessions.get(sessionId);
    if (!session) throw new Error('Workout not found');
    session.exercises = session.exercises.map((exercise) => exercise.id === exerciseId
      ? { ...exercise, sets: exercise.sets.filter((set) => set.id !== setId) }
      : exercise);
    sessions.set(sessionId, session);
  }

  async finishWorkout(sessionId: string) {
    const session = sessions.get(sessionId);
    if (!session) throw new Error('Workout not found');

    const completed: WorkoutSession = {
      ...session,
      status: 'completed',
      completedAt: new Date().toISOString(),
    };
    sessions.set(sessionId, completed);

    activeSplit = {
      ...activeSplit,
      days: activeSplit.days.map((day) => day.id !== completed.splitDayId ? day : {
        ...day,
        exercises: day.exercises.map((plannedExercise) => {
          const completedExercise = completed.exercises.find((exercise) => exercise.id === plannedExercise.id);
          if (!completedExercise || completedExercise.targetUnit !== 'REPS') return plannedExercise;

          const bestSet = completedExercise.sets
            .filter((set) => set.complete && (Number(set.weight) || 0) > 0)
            .sort((a, b) => (Number(b.weight) || 0) - (Number(a.weight) || 0))[0];
          if (!bestSet) return plannedExercise;

          const previousWeightMatch = plannedExercise.pr.match(/([\d.]+)\s*LB/i);
          const previousWeight = previousWeightMatch ? Number(previousWeightMatch[1]) : 0;
          const completedWeight = Number(bestSet.weight) || 0;
          if (completedWeight <= previousWeight) return plannedExercise;

          return {
            ...plannedExercise,
            pr: String(completedWeight) + ' LB × ' + String(Number(bestSet.reps) || 0),
          };
        }),
      }),
    };

    const updatedDay = activeSplit.days.find((day) => day.id === completed.splitDayId);
    if (updatedDay) {
      workoutTemplates = workoutTemplates.map((workout) => workout.id === updatedDay.workoutId
        ? { ...workout, exercises: clone(updatedDay.exercises) }
        : workout);
      activeSplit = {
        ...activeSplit,
        days: activeSplit.days.map((day) => day.workoutId === updatedDay.workoutId
          ? { ...day, exercises: clone(updatedDay.exercises) }
          : day),
      };
    }

    if (completed.splitId === activeSplit.id && activeSplit.days.length > 0) {
      const completedDayIndex = activeSplit.days.findIndex(
        (day) => day.id === completed.splitDayId,
      );
      if (completedDayIndex >= 0) {
        activeSplit = {
          ...activeSplit,
          nextDayIndex: (completedDayIndex + 1) % activeSplit.days.length,
        };
      }
    }

    return clone(completed);
  }

  async getWorkoutHistory() {
    return clone(
      [...sessions.values()]
        .filter((session) => session.status === 'completed')
        .sort((a, b) => b.startedAt.localeCompare(a.startedAt)),
    );
  }
}

const repository = new LocalWorkoutRepository();
const mutations = new Set(['saveActiveSplit', 'deleteSplitDay', 'addWorkoutToSplit', 'saveWorkoutTemplate', 'deleteWorkoutTemplate', 'startWorkout', 'saveWorkoutSet', 'deleteWorkoutSet', 'finishWorkout']);
// Each instance closes over one account. In-flight calls cannot switch owners.
let queue: Promise<unknown> = Promise.resolve();
return new Proxy(repository, {
  get(target, property: keyof WorkoutRepository) {
    const method = target[property];
    if (typeof method !== 'function') return method;
    return (...args: unknown[]) => {
      const run = queue.then(async () => {
        const before = mutations.has(property) ? clone({ templates: workoutTemplates, split: activeSplit, sessions: [...sessions.values()] }) : null;
        try {
          const result = await Reflect.apply(method, target, args);
          if (before) storage.setItem(key, JSON.stringify({ templates: workoutTemplates, split: activeSplit, sessions: [...sessions.values()] }));
          return result;
        } catch (error) {
          if (before) {
            workoutTemplates = before.templates; activeSplit = before.split;
            sessions.clear(); before.sessions.forEach(session => sessions.set(session.id, session));
          }
          throw error;
        }
      });
      queue = run.catch(() => undefined);
      return run;
    };
  },
});
}
