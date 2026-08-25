import { HABIT_ICONS } from '../src/constants/habitIcons';
import { onboardingStorage } from '../src/storage/onboardingStorage';
import { reminderSettingsStorage } from '../src/storage/reminderSettingsStorage';
import { storage } from '../src/storage/storage';
import { STORAGE_KEYS } from '../src/storage/storageKeys';
import { useAppStore } from '../src/store/useAppStore';
import {
  formatLocalTime,
  fromTwelveHourTime,
  toTwelveHourTime,
} from '../src/utils/time';

jest.mock(
  'lucide-react-native',
  () =>
    new Proxy(
      { __esModule: true },
      {
        get: (target, property) =>
          property === '__esModule' ? target.__esModule : () => null,
      },
    ),
);

describe('reminder settings', () => {
  beforeEach(() => {
    onboardingStorage.resetOnboarding();
    storage.remove(STORAGE_KEYS.NOTIFICATION_REMINDER_TIME);
  });

  afterAll(() => {
    onboardingStorage.resetOnboarding();
    storage.remove(STORAGE_KEYS.NOTIFICATION_REMINDER_TIME);
  });

  test('initializes the notification reminder from the onboarding wake time', () => {
    onboardingStorage.setWakeUpTime('06:30');

    expect(reminderSettingsStorage.getNotificationReminderTime()).toBe('06:30');
    expect(storage.getString(STORAGE_KEYS.NOTIFICATION_REMINDER_TIME)).toBe(
      '06:30',
    );
  });

  test('keeps a customized notification reminder independent of wake time', () => {
    onboardingStorage.setWakeUpTime('06:30');
    reminderSettingsStorage.setNotificationReminderTime('20:00');
    onboardingStorage.setWakeUpTime('07:15');

    expect(reminderSettingsStorage.getNotificationReminderTime()).toBe('20:00');
    expect(reminderSettingsStorage.getWakeUpDefault()).toBe('07:15');
  });

  test('rejects invalid reminder values', () => {
    expect(reminderSettingsStorage.setNotificationReminderTime('8:00 PM')).toBe(
      false,
    );
    expect(storage.has(STORAGE_KEYS.NOTIFICATION_REMINDER_TIME)).toBe(false);
  });

  test('stores a customized reminder and icon on only the new habit', () => {
    onboardingStorage.setWakeUpTime('06:30');
    useAppStore.getState().addHabit({
      title: 'Morning medicine test habit',
      iconName: 'Pill',
      timeOfDay: 'MORNING',
      reminderEnabled: true,
      reminderTime: '10:00',
    });

    const created = useAppStore
      .getState()
      .habits.find(habit => habit.title === 'Morning medicine test habit');
    expect(created).toMatchObject({
      iconName: 'Pill',
      reminderEnabled: true,
      reminderTime: '10:00',
    });
    expect(reminderSettingsStorage.getWakeUpDefault()).toBe('06:30');
  });
});

describe('reminder time presentation', () => {
  test.each([
    ['00:00', '12:00 AM'],
    ['06:30', '6:30 AM'],
    ['12:00', '12:00 PM'],
    ['20:15', '8:15 PM'],
  ])('formats %s as %s', (value, expected) => {
    expect(formatLocalTime(value)).toBe(expected);
  });

  test('converts picker values between 24-hour and 12-hour forms', () => {
    expect(toTwelveHourTime('20:15')).toEqual({
      hour: '08',
      minute: '15',
      period: 'PM',
    });
    expect(fromTwelveHourTime('08', '15', 'PM')).toBe('20:15');
    expect(fromTwelveHourTime('12', '00', 'AM')).toBe('00:00');
  });
});

describe('habit icon catalog', () => {
  test('uses stable unique IDs and includes all required categories', () => {
    const ids = HABIT_ICONS.map(icon => icon.id);
    const labels = HABIT_ICONS.map(icon => icon.label.toLowerCase()).join(' ');

    expect(new Set(ids).size).toBe(ids.length);
    [
      'exercise',
      'medicine',
      'wake-up',
      'hydration',
      'food',
      'sleep',
      'meditation',
      'running',
      'gym',
      'health',
      'study',
      'work',
      'cleaning',
      'journaling',
    ].forEach(category => expect(labels).toContain(category));
  });
});
