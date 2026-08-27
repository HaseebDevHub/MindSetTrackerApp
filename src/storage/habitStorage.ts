import type { HabitFrequency, HabitItem } from '../types/models';
import { isDateKey, toDateKey } from '../utils/dates';
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

function toStoredHabit(habit: HabitItem): StoredHabit {
  return {
    id: habit.id,
    title: habit.title,
    timeOfDay: habit.timeOfDay,
    iconName: habit.iconName,
    note: habit.note,
    reminderEnabled: habit.reminderEnabled,
    reminderTime: habit.reminderTime,
    archived: habit.archived,
    frequency: habit.frequency ?? 'EVERYDAY',
    createdAt:
      habit.createdAt ??
      habit.completedDates.slice().sort()[0] ??
      toDateKey(new Date()),
  };
}

function writeStoredHabits(habits: StoredHabit[]) {
  return storage.setString(STORAGE_KEYS.HABITS, JSON.stringify(habits));
}

function removeLegacySeededHabits(habits: StoredHabit[]) {
  if (storage.getBoolean(STORAGE_KEYS.LEGACY_DEMO_HABITS_REMOVED) === true) {
    return habits;
  }

  const userHabits = habits.filter(
    habit => !LEGACY_SEEDED_HABIT_IDS.has(habit.id),
  );
  if (
    userHabits.length !== habits.length &&
    !writeStoredHabits(userHabits)
  ) {
    return habits;
  }

  storage.setBoolean(STORAGE_KEYS.LEGACY_DEMO_HABITS_REMOVED, true);
  return userHabits;
}

function hasStoredHabits() {
  return storage.has(STORAGE_KEYS.HABITS);
}

function getHabits(): StoredHabit[] {
  const parsed = parseJson(storage.getString(STORAGE_KEYS.HABITS));
  if (!Array.isArray(parsed) || !parsed.every(isStoredHabit)) return [];
  return removeLegacySeededHabits(parsed);
}

function setHabits(habits: HabitItem[]) {
  return storage.setString(
    STORAGE_KEYS.HABITS,
    JSON.stringify(habits.map(toStoredHabit)),
  );
}

export const habitStorage = { getHabits, hasStoredHabits, setHabits };
