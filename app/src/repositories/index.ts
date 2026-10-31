import { storage } from '@/lib/storage';
import { createLocalWorkoutRepository } from './local-workout-repository';
import type { WorkoutRepository } from './workout-repository';
export type { WorkoutRepository } from './workout-repository';
let userId: string | null = null;
let repository: WorkoutRepository | null = null;
let previewData = new Map<string, string>();
// Old repositories keep their old map; late saves cannot repopulate a new preview.
export function clearPreviewWorkouts() { previewData = new Map(); }
export function setWorkoutUser(next: string | null, preview = false) {
  if (next === userId) return;
  repository = null;
  userId = null;
  if (next) {
    const data = previewData;
    const previewStorage = { getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => { data.set(key, value); } };
    repository = createLocalWorkoutRepository(next, preview ? previewStorage : storage); userId = next;
  }
}
export const workoutRepository = new Proxy({} as WorkoutRepository, {
  get(_target, property: keyof WorkoutRepository) {
    return (...args: unknown[]) => {
      if (!repository) return Promise.reject(new Error('Sign in to access workouts.'));
      return Reflect.apply(repository[property], repository, args);
    };
  },
});
