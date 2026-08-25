import { DEFAULT_WAKE_UP_TIME, isValidLocalTime } from '../utils/time';
import { onboardingStorage } from './onboardingStorage';
import { storage } from './storage';
import { STORAGE_KEYS } from './storageKeys';

function getWakeUpDefault() {
  return onboardingStorage.getWakeUpTime() ?? DEFAULT_WAKE_UP_TIME;
}

function getNotificationReminderTime() {
  const stored = storage.getString(STORAGE_KEYS.NOTIFICATION_REMINDER_TIME);
  if (isValidLocalTime(stored)) return stored;

  const wakeUpTime = onboardingStorage.getWakeUpTime();
  if (wakeUpTime) {
    storage.setString(STORAGE_KEYS.NOTIFICATION_REMINDER_TIME, wakeUpTime);
    return wakeUpTime;
  }

  return DEFAULT_WAKE_UP_TIME;
}

function setNotificationReminderTime(value: string) {
  return (
    isValidLocalTime(value) &&
    storage.setString(STORAGE_KEYS.NOTIFICATION_REMINDER_TIME, value)
  );
}

export const reminderSettingsStorage = {
  getWakeUpDefault,
  getNotificationReminderTime,
  setNotificationReminderTime,
};
