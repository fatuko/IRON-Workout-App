export type LocalWeekDay = {
  date: Date;
  key: string;
  label: string;
  isToday: boolean;
};

const DAY_IN_MS = 86_400_000;

function asDate(value: Date | string) {
  return value instanceof Date ? new Date(value) : new Date(value);
}

export function getLocalDateKey(value: Date | string = new Date()) {
  const date = asDate(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return year + '-' + month + '-' + day;
}

export function getStartOfLocalWeek(value: Date = new Date()) {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  const daysSinceMonday = date.getDay() === 0 ? 6 : date.getDay() - 1;
  date.setDate(date.getDate() - daysSinceMonday);
  return date;
}

export function getLocalWeek(value: Date = new Date()): LocalWeekDay[] {
  const start = getStartOfLocalWeek(value);
  const todayKey = getLocalDateKey(value);
  const labels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  return labels.map((label, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    const key = getLocalDateKey(date);
    return { date, key, label, isToday: key === todayKey };
  });
}

function calendarDayNumber(value: Date | string) {
  const date = asDate(value);
  return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / DAY_IN_MS;
}

export function getCalendarDaysAgo(value: Date | string, now: Date = new Date()) {
  return Math.max(0, Math.round(calendarDayNumber(now) - calendarDayNumber(value)));
}

export function formatDaysAgo(value: Date | string | null, now: Date = new Date()) {
  if (!value) return 'NO PREVIOUS WORKOUT';
  const days = getCalendarDaysAgo(value, now);
  if (days === 0) return 'COMPLETED TODAY';
  if (days === 1) return '1 DAY AGO';
  return String(days) + ' DAYS AGO';
}

export function getGreeting(value: Date = new Date()) {
  const hour = value.getHours();
  if (hour < 12) return 'GOOD MORNING';
  if (hour < 18) return 'GOOD AFTERNOON';
  return 'GOOD EVENING';
}
