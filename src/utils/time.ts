export const DEFAULT_WAKE_UP_TIME = '08:00';

const LOCAL_TIME_PATTERN = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

export type DayPeriod = 'AM' | 'PM';

export function isValidLocalTime(value: unknown): value is string {
  return typeof value === 'string' && LOCAL_TIME_PATTERN.test(value);
}

export function formatLocalTime(value: string) {
  if (!isValidLocalTime(value)) return '';

  const [hourText, minute] = value.split(':');
  const hour = Number(hourText);
  const period: DayPeriod = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minute} ${period}`;
}

export function toTwelveHourTime(value: string) {
  const safeValue = isValidLocalTime(value) ? value : DEFAULT_WAKE_UP_TIME;
  const [hourText, minute] = safeValue.split(':');
  const hour = Number(hourText);

  return {
    hour: String(hour % 12 || 12).padStart(2, '0'),
    minute,
    period: (hour >= 12 ? 'PM' : 'AM') as DayPeriod,
  };
}

export function fromTwelveHourTime(
  hour: string,
  minute: string,
  period: DayPeriod,
) {
  const hourNumber = (Number(hour) % 12) + (period === 'PM' ? 12 : 0);
  return `${String(hourNumber).padStart(2, '0')}:${minute}`;
}
