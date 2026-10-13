import type {
  PlannedExercise,
  SplitDay,
  WorkoutExercise,
  WorkoutSession,
  WorkoutSet,
  WorkoutSplit,
} from '@/types/workout';

import type { WorkoutRepository } from './workout-repository';

const createId = (prefix: string) =>
  prefix + '-' + Date.now() + '-' + Math.random().toString(16).slice(2);

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const starterExercises = {
  push: [
    { id: 'bench', name: 'Incline Chest Press', sets: '3', target: '8–12', unit: 'REPS', pr: '185 LB × 8' },
    { id: 'shoulder', name: 'Shoulder Press', sets: '3', target: '6–10', unit: 'REPS', pr: '90 LB × 10' },
    { id: 'fly', name: 'Cable Fly', sets: '3', target: '10–15', unit: 'REPS', pr: '35 LB × 14' },
    { id: 'raise', name: 'Lateral Raise', sets: '3', target: '12–20', unit: 'REPS', pr: '60 LB × 15' },
    { id: 'pushdown', name: 'Tricep Pushdown', sets: '3', target: '10–15', unit: 'REPS', pr: '130 LB × 12' },
    { id: 'extension', name: 'Overhead Extension', sets: '3', target: '10–15', unit: 'REPS', pr: '50 LB × 14' },
  ],
  pull: [
    { id: 'pulldown', name: 'Lat Pulldown', sets: '3', target: '6–10', unit: 'REPS', pr: '150 LB × 8' },
    { id: 'row', name: 'Chest-Supported Row', sets: '3', target: '8–12', unit: 'REPS', pr: '135 LB × 10' },
    { id: 'curl', name: 'Preacher Curl', sets: '3', target: '8–12', unit: 'REPS', pr: '65 LB × 9' },
  ],
  legs: [
    { id: 'squat', name: 'Hack Squat', sets: '4', target: '6–10', unit: 'REPS', pr: '270 LB × 7' },
    { id: 'leg-curl', name: 'Seated Leg Curl', sets: '3', target: '8–12', unit: 'REPS', pr: '120 LB × 10' },
    { id: 'calf', name: 'Standing Calf Raise', sets: '4', target: '10–15', unit: 'REPS', pr: '180 LB × 12' },
  ],
} satisfies Record<string, PlannedExercise[]>;

let activeSplit: WorkoutSplit = {
  id: 'starter-split',
  name: 'Push Pull Legs',
  isActive: true,
  nextDayIndex: 0,
  days: [
    { id: 'push', name: 'PUSH DAY', workoutDay: 'MONDAY', color: '#FF3D00', exercises: starterExercises.push },
    { id: 'pull', name: 'PULL DAY', workoutDay: 'TUESDAY', color: '#9B6DFF', exercises: starterExercises.pull },
    { id: 'legs', name: 'LEGS DAY', workoutDay: 'WEDNESDAY', color: '#368DFF', exercises: starterExercises.legs },
  ],
};

const sessions = new Map<string, WorkoutSession>();

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

function createWorkoutExercise(exercise: PlannedExercise): WorkoutExercise {
  const unitLabel = exercise.unit === 'REPS' ? 'reps' : 'seconds';
  return {
    id: exercise.id,
    name: exercise.name.toUpperCase(),
    repRange: exercise.target + ' ' + unitLabel,
    targetUnit: exercise.unit,
    lastPerformance: parsePreviousPerformance(exercise.pr),
    restSeconds: exercise.unit === 'REPS' ? 120 : 60,
    sets: createSets(Math.max(1, Number(exercise.sets) || 1)),
  };
}

export class MockWorkoutRepository implements WorkoutRepository {
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
      exercises: day.exercises.map(createWorkoutExercise),
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

  async finishWorkout(sessionId: string) {
    const session = sessions.get(sessionId);
    if (!session) throw new Error('Workout not found');

    const completed: WorkoutSession = {
      ...session,
      status: 'completed',
      completedAt: new Date().toISOString(),
    };
    sessions.set(sessionId, completed);

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

export const workoutRepository: WorkoutRepository = new MockWorkoutRepository();
