import type { HabitItem, TimeOfDay } from '../types/models';
import {
  ONBOARDING_TARGETS,
  type OnboardingTarget,
  type OnboardingTargets,
} from '../types/onboarding';
import { isValidLocalTime } from './time';

const TIME_OF_DAY_VALUES: TimeOfDay[] = [
  'MORNING',
  'AFTERNOON',
  'EVENING',
  'ANYTIME',
];

export { isValidLocalTime } from './time';

export function isOnboardingTarget(value: unknown): value is OnboardingTarget {
  return (
    typeof value === 'string' &&
    ONBOARDING_TARGETS.some(target => target === value)
  );
}

export function isValidOnboardingTargets(
  value: unknown,
): value is OnboardingTargets {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    new Set(value).size === value.length &&
    value.every(isOnboardingTarget)
  );
}

export function isValidHabit(value: unknown): value is HabitItem {
  if (!value || typeof value !== 'object') return false;

  const habit = value as Partial<HabitItem>;
  return (
    typeof habit.id === 'string' &&
    habit.id.length > 0 &&
    typeof habit.title === 'string' &&
    habit.title.trim().length > 0 &&
    typeof habit.timeOfDay === 'string' &&
    TIME_OF_DAY_VALUES.includes(habit.timeOfDay as TimeOfDay) &&
    Array.isArray(habit.completedDates) &&
    habit.completedDates.every(date => typeof date === 'string') &&
    typeof habit.streakCount === 'number' &&
    Number.isFinite(habit.streakCount) &&
    typeof habit.iconName === 'string' &&
    habit.iconName.length > 0 &&
    (habit.reminderEnabled === undefined ||
      typeof habit.reminderEnabled === 'boolean') &&
    (habit.reminderTime === undefined || isValidLocalTime(habit.reminderTime))
  );
}
