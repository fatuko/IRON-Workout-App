import type { WorkoutSession } from '../types/workout';

function weekKey(date: Date) {
  const day = new Date(date); day.setHours(0, 0, 0, 0);
  day.setDate(day.getDate() - (day.getDay() + 6) % 7);
  return `${day.getFullYear()}-${day.getMonth()}-${day.getDate()}`;
}

// A training week runs Monday–Sunday. Last week's streak remains active
// until the current week ends, giving the user time to complete a workout.
export function profileStats(history: WorkoutSession[], now = new Date()) {
  const completed = history.filter(s => s.status === 'completed' && s.completedAt && s.exercises.some(e => e.sets.some(s => s.complete)));
  const weeks = new Set(completed.map(s => weekKey(new Date(s.completedAt!))));
  const cursor = new Date(now);
  if (!weeks.has(weekKey(cursor))) cursor.setDate(cursor.getDate() - 7);
  let streak = 0;
  while (weeks.has(weekKey(cursor))) { streak++; cursor.setDate(cursor.getDate() - 7); }
  let records = 0;
  const best = new Map<string, number>();
  for (const session of [...completed].sort((a, b) => a.completedAt!.localeCompare(b.completedAt!))) {
    for (const exercise of session.exercises) {
      if (exercise.targetUnit !== 'REPS') continue;
      const weight = Math.max(0, ...exercise.sets.filter(s => s.complete && Number(s.reps) > 0).map(s => Number(s.weight) || 0));
      const previous = best.get(exercise.id);
      // The first recorded weight establishes a baseline, not a broken record.
      if (previous !== undefined && weight > previous) records++;
      if (weight > (previous ?? 0)) best.set(exercise.id, weight);
    }
  }
  return { workouts: completed.length, streak, records };
}
