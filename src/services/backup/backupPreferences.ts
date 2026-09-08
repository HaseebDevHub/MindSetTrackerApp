import type { BackupPreferences } from './backupTypes';
import { achievementStorage } from '../../storage/achievementStorage';
import { appUsageStorage } from '../../storage/appUsageStorage';
import { onboardingStorage } from '../../storage/onboardingStorage';
import { storage } from '../../storage/storage';
import { STORAGE_KEYS } from '../../storage/storageKeys';
import { weekSettingsStorage } from '../../storage/weekSettingsStorage';

export function exportBackupPreferences(): BackupPreferences {
  const draft = onboardingStorage.getDraft();
  return {
    appStartedDateKey: appUsageStorage.getStartedDate(),
    onboarding: {
      completed: onboardingStorage.isCompleted(),
      ...draft,
      ...(onboardingStorage.hasSkippedFirstHabit()
        ? { firstHabitSkipped: true }
        : {}),
    },
    achievements: {
      unlocks: achievementStorage.getUnlocks(),
      celebratedPerfectDays: achievementStorage.getCelebratedPerfectDays(),
    },
    notificationReminderTime: storage.getString(
      STORAGE_KEYS.NOTIFICATION_REMINDER_TIME,
    ),
    weekStartsOn: weekSettingsStorage.getWeekStartsOn(),
  };
}

function setOptionalString(
  key:
    | typeof STORAGE_KEYS.ONBOARDING_WAKE_UP_TIME
    | typeof STORAGE_KEYS.ONBOARDING_DAY_END_TIME
    | typeof STORAGE_KEYS.ONBOARDING_TARGETS
    | typeof STORAGE_KEYS.ONBOARDING_FIRST_HABIT
    | typeof STORAGE_KEYS.APP_STARTED_DATE
    | typeof STORAGE_KEYS.NOTIFICATION_REMINDER_TIME,
  value: string | undefined,
) {
  if (value !== undefined) return storage.setString(key, value);
  return !storage.has(key) || storage.remove(key);
}

function setOptionalBoolean(
  key: typeof STORAGE_KEYS.ONBOARDING_FIRST_HABIT_SKIPPED,
  value: boolean | undefined,
) {
  if (value !== undefined) return storage.setBoolean(key, value);
  return !storage.has(key) || storage.remove(key);
}

export function applyBackupPreferences(preferences: BackupPreferences) {
  const onboarding = preferences.onboarding;
  const writes = [
    setOptionalString(
      STORAGE_KEYS.APP_STARTED_DATE,
      preferences.appStartedDateKey,
    ),
    setOptionalString(
      STORAGE_KEYS.ONBOARDING_WAKE_UP_TIME,
      onboarding.wakeUpTime,
    ),
    setOptionalString(
      STORAGE_KEYS.ONBOARDING_DAY_END_TIME,
      onboarding.dayEndTime,
    ),
    setOptionalString(
      STORAGE_KEYS.ONBOARDING_TARGETS,
      onboarding.targets ? JSON.stringify(onboarding.targets) : undefined,
    ),
    setOptionalString(
      STORAGE_KEYS.ONBOARDING_FIRST_HABIT,
      onboarding.firstHabit ? JSON.stringify(onboarding.firstHabit) : undefined,
    ),
    setOptionalBoolean(
      STORAGE_KEYS.ONBOARDING_FIRST_HABIT_SKIPPED,
      onboarding.firstHabitSkipped,
    ),
    setOptionalString(
      STORAGE_KEYS.NOTIFICATION_REMINDER_TIME,
      preferences.notificationReminderTime,
    ),
    storage.setString(
      STORAGE_KEYS.ACHIEVEMENT_UNLOCKS,
      JSON.stringify(preferences.achievements.unlocks),
    ),
    storage.setString(
      STORAGE_KEYS.CELEBRATED_PERFECT_DAYS,
      JSON.stringify(preferences.achievements.celebratedPerfectDays),
    ),
    storage.setNumber(STORAGE_KEYS.GENERAL_WEEK_START, preferences.weekStartsOn),
    onboarding.completed
      ? storage.setBoolean(STORAGE_KEYS.ONBOARDING_COMPLETED, true)
      : !storage.has(STORAGE_KEYS.ONBOARDING_COMPLETED) ||
        storage.remove(STORAGE_KEYS.ONBOARDING_COMPLETED),
  ];
  return writes.every(Boolean);
}
