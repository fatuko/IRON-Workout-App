export type EntityId = string;

export type TargetUnit = 'REPS' | 'SEC';

export const WEEKDAYS = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
] as const;

export type Weekday = (typeof WEEKDAYS)[number];

export type WorkoutStatus = 'draft' | 'completed' | 'abandoned';

export type ExerciseStatus = 'NOT STARTED' | 'IN PROGRESS' | 'COMPLETED';

export type WorkoutSetField = 'weight' | 'reps' | 'seconds' | 'rir';

export type PlannedExercise = {
  id: EntityId;
  name: string;
  sets: string;
  target: string;
  unit: TargetUnit;
  pr: string;
};

export type SplitDay = {
  id: EntityId;
  name: string;
  workoutDay: Weekday;
  color: string;
  exercises: PlannedExercise[];
};

export type WorkoutSplit = {
  id: EntityId;
  name: string;
  isActive: boolean;
  nextDayIndex: number;
  days: SplitDay[];
};

export type WorkoutSet = {
  id: number;
  weight: string;
  reps: string;
  seconds: string;
  rir: string;
  complete: boolean;
};

export type WorkoutExercise = {
  id: EntityId;
  name: string;
  repRange: string;
  targetUnit: TargetUnit;
  lastPerformance: string;
  restSeconds: number;
  sets: WorkoutSet[];
};

export type WorkoutSession = {
  id: EntityId;
  splitId: EntityId | null;
  splitDayId: EntityId | null;
  workoutName: string;
  status: WorkoutStatus;
  startedAt: string;
  completedAt: string | null;
  exercises: WorkoutExercise[];
};

