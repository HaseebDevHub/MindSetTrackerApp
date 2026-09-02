import type {
  HabitGoalMode,
  HabitItem,
  HabitScheduleMode,
  HabitType,
} from '../types/models';
import { isDateKey } from './dates';
export { DEFAULT_HABIT_COLOR } from '../constants/habitColors';

export function normalizeHabitType(value: unknown): HabitType {
  return value === 'NEGATIVE' || value === 'ONE_TIME' ? value : 'REGULAR';
}

export function normalizeScheduleMode(
  value: unknown,
  fallbackFrequency: HabitItem['frequency'] = 'EVERYDAY',
): HabitScheduleMode {
  const modes: HabitScheduleMode[] = [
    'EVERYDAY',
    'WEEKDAYS',
    'SPECIFIC_DAYS',
    'WEEKLY_QUOTA',
    'MONTHLY_QUOTA',
    'YEARLY_QUOTA',
    'ONE_TIME',
  ];
  return modes.includes(value as HabitScheduleMode)
    ? (value as HabitScheduleMode)
    : fallbackFrequency === 'WEEKDAYS'
    ? 'WEEKDAYS'
    : 'EVERYDAY';
}

export function normalizeGoalMode(value: unknown): HabitGoalMode {
  return value === 'DURATION' || value === 'REPEAT' ? value : 'OFF';
}

export function normalizeWeekdays(values: readonly number[] | undefined) {
  return [
    ...new Set((values ?? []).filter(value => value >= 0 && value <= 6)),
  ].sort((a, b) => a - b);
}

export function encodeWeekdays(values: readonly number[] | undefined) {
  const normalized = normalizeWeekdays(values);
  return normalized.length ? normalized.join(',') : undefined;
}

export function decodeWeekdays(value: string | null | undefined) {
  if (!value) return [];
  return normalizeWeekdays(value.split(',').map(Number));
}

export function normalizeOptionalDateKey(value: unknown) {
  return isDateKey(value) ? value : undefined;
}

export function getHabitScheduleSummary(habit: HabitItem) {
  const mode = normalizeScheduleMode(habit.scheduleMode, habit.frequency);
  switch (mode) {
    case 'WEEKDAYS':
      return 'Weekdays';
    case 'SPECIFIC_DAYS': {
      const labels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      return normalizeWeekdays(habit.selectedWeekdays)
        .map(day => labels[day])
        .join(', ');
    }
    case 'WEEKLY_QUOTA':
      return `${habit.quotaCount ?? 1} days per week`;
    case 'MONTHLY_QUOTA':
      return `${habit.quotaCount ?? 1} days per month`;
    case 'YEARLY_QUOTA':
      return `${habit.quotaCount ?? 1} days per year`;
    case 'ONE_TIME':
      return habit.targetDate ? `Once on ${habit.targetDate}` : 'One time';
    default:
      return 'Every day';
  }
}
