import type {
  SplitDay,
  WorkoutSession,
  WorkoutTemplate,
  WorkoutSet,
  WorkoutSplit,
} from '@/types/workout';

export interface WorkoutRepository {
  getActiveSplit(): Promise<WorkoutSplit | null>;
  saveActiveSplit(split: WorkoutSplit): Promise<WorkoutSplit>;
  deleteSplitDay(splitId: string, splitDayId: string): Promise<void>;
  addWorkoutToSplit(splitId: string, workoutId: string, workoutDay: SplitDay['workoutDay']): Promise<WorkoutSplit>;

  getWorkoutTemplates(): Promise<WorkoutTemplate[]>;
  saveWorkoutTemplate(workout: WorkoutTemplate): Promise<WorkoutTemplate>;
  deleteWorkoutTemplate(workoutId: string): Promise<void>;

  startWorkout(splitDayId: string): Promise<WorkoutSession>;
  getWorkout(sessionId: string): Promise<WorkoutSession | null>;
  getDraftWorkout(): Promise<WorkoutSession | null>;
  saveWorkoutSet(
    sessionId: string,
    exerciseId: string,
    set: WorkoutSet,
  ): Promise<void>;
  finishWorkout(sessionId: string): Promise<WorkoutSession>;
  getWorkoutHistory(): Promise<WorkoutSession[]>;

  // Keeps screen code independent from where data is stored.
  getSplitDay(splitDayId: string): Promise<SplitDay | null>;
}
