import { storage } from '@/lib/storage';
import { createLocalWorkoutRepository } from './local-workout-repository';
import type { WorkoutRepository } from './workout-repository';
export type { WorkoutRepository } from './workout-repository';
let userId: string | null = null;
let repository: WorkoutRepository | null = null;
export function setWorkoutUser(next: string | null) {
  if (next === userId) return;
  repository = null;
  userId = null;
  if (next) { repository = createLocalWorkoutRepository(next, storage); userId = next; }
}
export const workoutRepository = new Proxy({} as WorkoutRepository, {
  get(_target, property: keyof WorkoutRepository) {
    return (...args: unknown[]) => {
      if (!repository) return Promise.reject(new Error('Sign in to access workouts.'));
      return Reflect.apply(repository[property], repository, args);
    };
  },
});
