const pad = (value: number) => String(value).padStart(2, '0');
const DATE_KEY_PATTERN = /^\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\d|3[01])$/;

export type DateStatus = 'past' | 'today' | 'future';

export const isDateKey = (value: unknown): value is string => {
  if (typeof value !== 'string' || !DATE_KEY_PATTERN.test(value)) return false;
  return toDateKey(fromDateKey(value)) === value;
};

export const toDateKey = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

export function getDateStatus(
  dateKey: string,
  localToday = new Date(),
): DateStatus {
  const todayKey = toDateKey(localToday);
  if (dateKey === todayKey) return 'today';
  return dateKey < todayKey ? 'past' : 'future';
}

export const fromDateKey = (key: string) => {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, month - 1, day);
};

export const addDays = (date: Date, amount: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
};

export const formatShortDate = (date: Date) =>
  date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

export const monthTitle = (date: Date) =>
  date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

export const getCalendarDays = (month: Date) => {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  return [
    ...Array.from({ length: first.getDay() }, () => null),
    ...Array.from(
      { length: days },
      (_, index) => new Date(month.getFullYear(), month.getMonth(), index + 1),
    ),
  ];
};

export const startOfWeek = (date: Date) => addDays(date, -date.getDay());

export const getRelativeDateLabel = (date: Date, today = new Date()) => {
  const difference = Math.round(
    (fromDateKey(toDateKey(date)).getTime() -
      fromDateKey(toDateKey(today)).getTime()) /
      86400000,
  );
  if (difference === -1) return 'YESTERDAY';
  if (difference === 0) return 'TODAY';
  if (difference === 1) return 'TOMORROW';
  return formatShortDate(date).toUpperCase();
};
