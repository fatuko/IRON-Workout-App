export const DEFAULT_REST_SECONDS = 120;

export function restTimerSeconds(value: unknown): number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 5 && value <= 3600
    ? value : DEFAULT_REST_SECONDS;
}

export function parseRestTimer(minutes: string, seconds: string): number | null {
  if (!/^\d+$/.test(minutes) || !/^\d+$/.test(seconds)) return null;
  const total = Number(minutes) * 60 + Number(seconds);
  return Number(seconds) < 60 && total >= 5 && total <= 3600 ? total : null;
}

export function formatRestTimer(seconds: number) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}
