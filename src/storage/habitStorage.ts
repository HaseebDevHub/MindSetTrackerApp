import type { HabitFrequency, HabitItem } from '../types/models';
import { isDateKey } from '../utils/dates';
import { isValidLocalTime } from '../utils/time';
import { storage } from './storage';
import { STORAGE_KEYS } from './storageKeys';

type StoredHabit = Omit<HabitItem, 'completedDates' | 'streakCount'>;

const TIME_OF_DAY_VALUES = ['MORNING', 'AFTERNOON', 'EVENING', 'ANYTIME'];
const FREQUENCY_VALUES: HabitFrequency[] = ['EVERYDAY', 'WEEKDAYS'];
// These IDs predate user-created IDs, which are namespaced with `habit-` or
// `onboarding-habit-`. They identify only records injected by the old startup
// demo and are never assigned by a user creation flow.
const LEGACY_SEEDED_HABIT_IDS = new Set([
  'water',
  'walk',
  'read',
  'meditate',
  'sleep',
]);

function parseJson(value: string | undefined): unknown {
  if (!value) return undefined;
  try {
    return JSON.parse(value);
  } catch {
    return undefined;
  }
}

function isStoredHabit(value: unknown): value is StoredHabit {
  if (!value || typeof value !== 'object') return false;
  const habit = value as Partial<StoredHabit>;
  return (
    typeof habit.id === 'string' &&
    habit.id.length > 0 &&
    typeof habit.title === 'string' &&
    habit.title.trim().length > 0 &&
    typeof habit.iconName === 'string' &&
    habit.iconName.length > 0 &&
    typeof habit.timeOfDay === 'string' &&
    TIME_OF_DAY_VALUES.includes(habit.timeOfDay) &&
    (habit.frequency === undefined ||
      FREQUENCY_VALUES.includes(habit.frequency)) &&
    (habit.createdAt === undefined || isDateKey(habit.createdAt)) &&
    (habit.note === undefined || typeof habit.note === 'string') &&
    (habit.archived === undefined || typeof habit.archived === 'boolean') &&
    (habit.reminderEnabled === undefined ||
      typeof habit.reminderEnabled === 'boolean') &&
    (habit.reminderTime === undefined || isValidLocalTime(habit.reminderTime))
  );
}

function removeLegacySeededHabits(habits: StoredHabit[]) {
  if (storage.getBoolean(STORAGE_KEYS.LEGACY_DEMO_HABITS_REMOVED) === true) {
    return habits;
  }
  return habits.filter(habit => !LEGACY_SEEDED_HABIT_IDS.has(habit.id));
}

function hasStoredHabits() {
  return storage.has(STORAGE_KEYS.HABITS);
}

function getHabits(): StoredHabit[] {
  const parsed = parseJson(storage.getString(STORAGE_KEYS.HABITS));
  if (!Array.isArray(parsed)) return [];
  const valid = parsed.filter(isStoredHabit);
  if (__DEV__ && valid.length !== parsed.length) {
    console.warn(
      `[habit migration] Ignored ${
        parsed.length - valid.length
      } malformed legacy habit record(s).`,
    );
  }
  const byId = new Map<string, StoredHabit>();
  valid.forEach(habit => {
    if (!byId.has(habit.id)) byId.set(habit.id, habit);
    else if (__DEV__) {
      console.warn(
        `[habit migration] Ignored duplicate legacy habit id: ${habit.id}`,
      );
    }
  });
  return removeLegacySeededHabits([...byId.values()]);
}

export const habitStorage = { getHabits, hasStoredHabits };
