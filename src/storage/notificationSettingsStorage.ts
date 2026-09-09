import type { NotificationPreferences } from '../types/notification';
import { isValidLocalTime } from '../utils/time';
import { onboardingStorage } from './onboardingStorage';
import { storage } from './storage';
import { STORAGE_KEYS } from './storageKeys';

export const DEFAULT_AFTERNOON_REMINDER_TIME = '13:00';
export const DEFAULT_EVENING_REMINDER_TIME = '20:00';

function buildDefaultSettings(): NotificationPreferences {
  const legacyMorning = storage.getString(
    STORAGE_KEYS.NOTIFICATION_REMINDER_TIME,
  );
  const wakeUpTime = onboardingStorage.getWakeUpTime();
  const dayEndTime = onboardingStorage.getDayEndTime();
  return {
    version: 1,
    masterEnabled: true,
    globalRemindersEnabled: true,
    habitRemindersEnabled: true,
    times: {
      morning: isValidLocalTime(legacyMorning)
        ? legacyMorning
        : wakeUpTime ?? '08:00',
      afternoon: DEFAULT_AFTERNOON_REMINDER_TIME,
      evening: dayEndTime ?? DEFAULT_EVENING_REMINDER_TIME,
    },
  };
}

export function isNotificationPreferences(
  value: unknown,
): value is NotificationPreferences {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<NotificationPreferences>;
  return (
    candidate.version === 1 &&
    typeof candidate.masterEnabled === 'boolean' &&
    typeof candidate.globalRemindersEnabled === 'boolean' &&
    typeof candidate.habitRemindersEnabled === 'boolean' &&
    Boolean(candidate.times) &&
    isValidLocalTime(candidate.times?.morning) &&
    isValidLocalTime(candidate.times?.afternoon) &&
    isValidLocalTime(candidate.times?.evening)
  );
}

function persistSettings(settings: NotificationPreferences) {
  const saved = storage.setString(
    STORAGE_KEYS.NOTIFICATION_SETTINGS_V1,
    JSON.stringify(settings),
  );
  if (saved) {
    storage.setString(
      STORAGE_KEYS.NOTIFICATION_REMINDER_TIME,
      settings.times.morning,
    );
  }
  return saved;
}

function getSettings() {
  const serialized = storage.getString(STORAGE_KEYS.NOTIFICATION_SETTINGS_V1);
  if (serialized) {
    try {
      const parsed: unknown = JSON.parse(serialized);
      if (isNotificationPreferences(parsed)) return parsed;
    } catch {
      // Invalid settings are replaced with safe defaults below.
    }
  }
  const defaults = buildDefaultSettings();
  persistSettings(defaults);
  return defaults;
}

function setSettings(settings: NotificationPreferences) {
  return isNotificationPreferences(settings) && persistSettings(settings);
}

function hasMigratedReminderLimit() {
  return (
    storage.getBoolean(STORAGE_KEYS.NOTIFICATION_REMINDER_LIMIT_MIGRATED) ===
    true
  );
}

function markReminderLimitMigrated() {
  return storage.setBoolean(
    STORAGE_KEYS.NOTIFICATION_REMINDER_LIMIT_MIGRATED,
    true,
  );
}

function setReminderLimitNoticePending(value: boolean) {
  return storage.setBoolean(
    STORAGE_KEYS.NOTIFICATION_REMINDER_LIMIT_NOTICE,
    value,
  );
}

function consumeReminderLimitNotice() {
  const pending =
    storage.getBoolean(STORAGE_KEYS.NOTIFICATION_REMINDER_LIMIT_NOTICE) ===
    true;
  if (pending) storage.remove(STORAGE_KEYS.NOTIFICATION_REMINDER_LIMIT_NOTICE);
  return pending;
}

export const notificationSettingsStorage = {
  getSettings,
  setSettings,
  buildDefaultSettings,
  hasMigratedReminderLimit,
  markReminderLimitMigrated,
  setReminderLimitNoticePending,
  consumeReminderLimitNotice,
};
