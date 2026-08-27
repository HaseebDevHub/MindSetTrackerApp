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
    return Array.isArray(parsed) &&
      parsed.every(item => typeof item === 'string')
      ? [...new Set(parsed)]
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

function setHabitCompletion(habitId: string, date: string, completed: boolean) {
  if (!habitId || !isDateKey(date)) return false;
  const current = getCompletedHabitIds(date);
  const next = completed
    ? [...new Set([...current, habitId])]
    : current.filter(id => id !== habitId);
  if (!storage.setString(completionKey(date), JSON.stringify(next)))
    return false;

  const dates = getDates();
  if (!dates.includes(date)) {
    return storage.setString(
      STORAGE_KEYS.COMPLETION_DATES,
      JSON.stringify([...dates, date].sort()),
    );
  }
  return true;
}

function hydrateHabits(
  habits: Array<Omit<HabitItem, 'completedDates' | 'streakCount'>>,
): HabitItem[] {
  const dates = getDates();
  const completionsByHabit = new Map<string, string[]>();
  dates.forEach(date =>
    getCompletedHabitIds(date).forEach(habitId => {
      completionsByHabit.set(habitId, [
        ...(completionsByHabit.get(habitId) ?? []),
        date,
      ]);
    }),
  );
  return habits.map(habit => ({
    ...habit,
    completedDates: completionsByHabit.get(habit.id) ?? [],
    streakCount: 0,
  }));
}

export const completionStorage = {
  getDates,
  getCompletedHabitIds,
  setHabitCompletion,
  hydrateHabits,
};
