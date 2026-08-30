import { completionStorage } from '../storage/completionStorage';
import { habitStorage } from '../storage/habitStorage';
import { onboardingStorage } from '../storage/onboardingStorage';
import { storage } from '../storage/storage';
import { STORAGE_KEYS } from '../storage/storageKeys';
import type { HabitItem } from '../types/models';
import { isDateKey, toDateKey } from '../utils/dates';
import { habitRepository } from './repositories/habitRepository';
import type { HabitRepository } from './repositories/types';

export type LegacyHabitMigrationResult =
  | 'imported'
  | 'recovered'
  | 'already-complete'
  | 'no-legacy-data';

type LegacyMigrationDependencies = {
  repository?: HabitRepository;
  getLegacyHabits?: typeof habitStorage.getHabits;
  hydrateLegacyHabits?: typeof completionStorage.hydrateHabits;
  getOnboardingHabit?: typeof onboardingStorage.getFirstHabit;
  isOnboardingCompleted?: typeof onboardingStorage.isCompleted;
  getMarker?: () => boolean;
  setMarker?: () => boolean;
  todayKey?: string;
};

function normalizeHabit(habit: HabitItem, todayKey: string): HabitItem {
  return {
    ...habit,
    title: habit.title.trim(),
    frequency: habit.frequency ?? 'EVERYDAY',
    reminderEnabled: habit.reminderEnabled ?? false,
    archived: habit.archived ?? false,
    createdAt:
      habit.createdAt ??
      habit.completedDates.filter(isDateKey).sort()[0] ??
      todayKey,
    completedDates: [...new Set(habit.completedDates.filter(isDateKey))].sort(),
    streakCount: 0,
  };
}

function deduplicateById(habits: HabitItem[]) {
  const byId = new Map<string, HabitItem>();
  habits.forEach(habit => {
    if (!byId.has(habit.id)) byId.set(habit.id, habit);
    else if (__DEV__) {
      console.warn(
        `[habit migration] Skipped duplicate habit id during import: ${habit.id}`,
      );
    }
  });
  return [...byId.values()];
}

export async function migrateLegacyHabitData(
  dependencies: LegacyMigrationDependencies = {},
): Promise<LegacyHabitMigrationResult> {
  const repository = dependencies.repository ?? habitRepository;
  const getLegacyHabits =
    dependencies.getLegacyHabits ?? habitStorage.getHabits;
  const hydrateLegacyHabits =
    dependencies.hydrateLegacyHabits ?? completionStorage.hydrateHabits;
  const getOnboardingHabit =
    dependencies.getOnboardingHabit ?? onboardingStorage.getFirstHabit;
  const isOnboardingCompleted =
    dependencies.isOnboardingCompleted ?? onboardingStorage.isCompleted;
  const getMarker =
    dependencies.getMarker ??
    (() =>
      storage.getBoolean(STORAGE_KEYS.WATERMELON_HABIT_MIGRATION_V1) === true);
  const setMarker =
    dependencies.setMarker ??
    (() =>
      storage.setBoolean(STORAGE_KEYS.WATERMELON_HABIT_MIGRATION_V1, true));
  const todayKey = dependencies.todayKey ?? toDateKey(new Date());
  const markerWasSet = getMarker();
  const legacy = hydrateLegacyHabits(getLegacyHabits()).map(habit =>
    normalizeHabit(habit, todayKey),
  );
  const onboardingHabit = isOnboardingCompleted()
    ? getOnboardingHabit()
    : undefined;
  const existing = await repository.loadAllHabits();
  const existingIds = new Set(existing.map(habit => habit.id));
  const existingTitles = new Set(
    existing.map(habit => habit.title.trim().toLowerCase()),
  );
  const onboardingIsAlreadyRepresented =
    onboardingHabit &&
    (existingIds.has(onboardingHabit.id) ||
      existingTitles.has(onboardingHabit.title.trim().toLowerCase()) ||
      legacy.some(
        habit =>
          habit.id === onboardingHabit.id ||
          habit.title.trim().toLowerCase() ===
            onboardingHabit.title.trim().toLowerCase(),
      ));
  const candidates = deduplicateById([
    ...legacy,
    ...(onboardingHabit && !onboardingIsAlreadyRepresented
      ? [normalizeHabit(onboardingHabit, todayKey)]
      : []),
  ]);
  const existingById = new Map(existing.map(habit => [habit.id, habit]));
  const missingCandidates = candidates.filter(habit => {
    const record = existingById.get(habit.id);
    if (!record) return true;
    const existingDates = new Set(record.completedDates);
    return habit.completedDates.some(date => !existingDates.has(date));
  });

  if (markerWasSet && missingCandidates.length === 0) {
    return 'already-complete';
  }

  if (candidates.length === 0) {
    if (!markerWasSet && !setMarker()) {
      throw new Error(
        'Could not record completion of the habit data migration.',
      );
    }
    return 'no-legacy-data';
  }

  await repository.importLegacyHabits(candidates);
  const imported = await repository.loadAllHabits();
  const importedById = new Map(imported.map(habit => [habit.id, habit]));
  const missingAfterImport = candidates.filter(habit => {
    const record = importedById.get(habit.id);
    if (!record) return true;
    const importedDates = new Set(record.completedDates);
    return habit.completedDates.some(date => !importedDates.has(date));
  });
  if (missingAfterImport.length) {
    throw new Error(
      `Habit migration verification failed for ${missingAfterImport.length} record(s).`,
    );
  }
  if (!setMarker()) {
    throw new Error('Could not record completion of the habit data migration.');
  }
  return markerWasSet ? 'recovered' : 'imported';
}
