import { notificationSettingsStorage } from '../src/storage/notificationSettingsStorage';
import { onboardingStorage } from '../src/storage/onboardingStorage';
import { storage } from '../src/storage/storage';
import { STORAGE_KEYS } from '../src/storage/storageKeys';

describe('notification settings storage', () => {
  beforeEach(() => {
    onboardingStorage.resetOnboarding();
    storage.remove(STORAGE_KEYS.NOTIFICATION_SETTINGS_V1);
    storage.remove(STORAGE_KEYS.NOTIFICATION_REMINDER_TIME);
  });

  afterAll(() => {
    onboardingStorage.resetOnboarding();
    storage.remove(STORAGE_KEYS.NOTIFICATION_SETTINGS_V1);
    storage.remove(STORAGE_KEYS.NOTIFICATION_REMINDER_TIME);
  });

  test('derives morning and evening defaults from onboarding', () => {
    onboardingStorage.setWakeUpTime('06:20');
    onboardingStorage.setDayEndTime('21:40');

    expect(notificationSettingsStorage.getSettings()).toEqual({
      version: 1,
      masterEnabled: true,
      globalRemindersEnabled: true,
      habitRemindersEnabled: true,
      times: {
        morning: '06:20',
        afternoon: '13:00',
        evening: '21:40',
      },
    });
  });

  test('migrates the legacy reminder time into Morning', () => {
    storage.setString(STORAGE_KEYS.NOTIFICATION_REMINDER_TIME, '07:35');

    expect(notificationSettingsStorage.getSettings().times.morning).toBe(
      '07:35',
    );
  });

  test('persists all switches and global reminder times', () => {
    const settings = {
      ...notificationSettingsStorage.getSettings(),
      masterEnabled: false,
      habitRemindersEnabled: false,
      times: {
        morning: '09:00',
        afternoon: '14:30',
        evening: '22:15',
      },
    };

    expect(notificationSettingsStorage.setSettings(settings)).toBe(true);
    expect(notificationSettingsStorage.getSettings()).toEqual(settings);
    expect(storage.getString(STORAGE_KEYS.NOTIFICATION_REMINDER_TIME)).toBe(
      '09:00',
    );
  });
});
