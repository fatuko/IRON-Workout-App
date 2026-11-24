import type { WorkoutRepository } from '../repositories/workout-repository';
import type { SplitDay, WorkoutSession } from '../types/workout';
import { WEEKDAYS } from '../types/workout';
import { getLocalDateKey } from './date';

export type WorkoutPage =
  | { kind: 'session'; session: WorkoutSession }
  | { kind: 'ready'; day: SplitDay }
  | { kind: 'done' | 'rest' };

export async function loadWorkoutPage(repository: WorkoutRepository, sessionId?: string, now = new Date()): Promise<WorkoutPage> {
  const requested = sessionId ? await repository.getWorkout(sessionId) : null;
  if (requested?.status === 'draft') return { kind: 'session', session: requested };
  // A tab can retain an old ID after another draft replaces it.
  const draft = await repository.getDraftWorkout();
  if (draft) return { kind: 'session', session: draft };
  const split = await repository.getActiveSplit();
  const history = await repository.getWorkoutHistory();
  const today = getLocalDateKey(now);
  const completedToday = history.filter(item => item.completedAt && getLocalDateKey(item.completedAt) === today);
  const weekday = WEEKDAYS[(now.getDay() + 6) % 7];
  const planned = split?.days.filter(day => day.workoutDay === weekday) ?? [];
  const remaining = planned.find(day => !completedToday.some(item => item.splitDayId === day.id));
  if (remaining) return { kind: 'ready', day: remaining };
  return { kind: completedToday.length ? 'done' : 'rest' };
}
