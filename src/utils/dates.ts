import type { WeekStartsOn } from '../types/models';

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

export const formatShortDate = (date: Date, locale = 'en-US') =>
  date.toLocaleDateString(locale, { month: 'short', day: 'numeric' });

export const monthTitle = (date: Date, locale = 'en-US') =>
  date.toLocaleDateString(locale, { month: 'long', year: 'numeric' });

export const getCalendarDays = (
  month: Date,
  weekStartsOn: WeekStartsOn = 0,
) => {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const leadingBlanks = (first.getDay() - weekStartsOn + 7) % 7;
  return [
    ...Array.from({ length: leadingBlanks }, () => null),
    ...Array.from(
      { length: days },
      (_, index) => new Date(month.getFullYear(), month.getMonth(), index + 1),
    ),
  ];
};

export const startOfWeek = (date: Date, weekStartsOn: WeekStartsOn = 0) =>
  addDays(date, -((date.getDay() - weekStartsOn + 7) % 7));

export function getWeekDateKeys(
  dateKey: string,
  weekStartsOn: WeekStartsOn = 0,
) {
  if (!isDateKey(dateKey)) return [];
  const first = startOfWeek(fromDateKey(dateKey), weekStartsOn);
  return Array.from({ length: 7 }, (_, index) =>
    toDateKey(addDays(first, index)),
  );
}

export function getWeekdayLabels(
  weekStartsOn: WeekStartsOn = 0,
  locale = 'en-US',
) {
  const sunday = new Date(2021, 7, 1);
  const labels = Array.from({ length: 7 }, (_, id) => {
    const date = addDays(sunday, id);
    return {
      id,
      short: date.toLocaleDateString(locale, { weekday: 'narrow' }),
      long: date.toLocaleDateString(locale, { weekday: 'long' }),
    };
  });
  return [...labels.slice(weekStartsOn), ...labels.slice(0, weekStartsOn)];
}

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
