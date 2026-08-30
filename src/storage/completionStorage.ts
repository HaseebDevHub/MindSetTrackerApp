import type { HabitItem } from '../types/models';
import { isDateKey } from '../utils/dates';
import { storage } from './storage';
import { STORAGE_KEYS, type CompletionStorageKey } from './storageKeys';

function completionKey(date: string): CompletionStorageKey {
  return `habits.completions.${date}`;
}

function parseStringArray(value: string | undefined) {
  if (!value) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed)
      ? [...new Set(parsed.filter(item => typeof item === 'string'))]
      : [];
  } catch {
    return [];
  }
}

function getDates() {
  return parseStringArray(storage.getString(STORAGE_KEYS.COMPLETION_DATES))
    .filter(isDateKey)
    .sort();
}

function getCompletedHabitIds(date: string) {
  if (!isDateKey(date)) return [];
  return parseStringArray(storage.getString(completionKey(date)));
}

function hydrateHabits(
  habits: Array<Omit<HabitItem, 'completedDates' | 'streakCount'>>,
): HabitItem[] {
  const dates = getDates();
  const habitIds = new Set(habits.map(habit => habit.id));
  const orphanHabitIds = new Set<string>();
  const completionsByHabit = new Map<string, string[]>();
  dates.forEach(date =>
    getCompletedHabitIds(date).forEach(habitId => {
      if (!habitIds.has(habitId)) {
        orphanHabitIds.add(habitId);
        return;
      }
      completionsByHabit.set(habitId, [
        ...(completionsByHabit.get(habitId) ?? []),
        date,
      ]);
    }),
  );
  if (__DEV__ && orphanHabitIds.size) {
    console.warn(
      `[habit migration] Ignored completion data for ${orphanHabitIds.size} missing habit record(s).`,
    );
  }
  return habits.map(habit => ({
    ...habit,
    completedDates: [...new Set(completionsByHabit.get(habit.id) ?? [])].sort(),
    streakCount: 0,
  }));
}

export const completionStorage = {
  getDates,
  getCompletedHabitIds,
  hydrateHabits,
};
