import {
  getHabitAlertOccurrences,
  getHabitOccurrenceId,
  getSnoozeId,
  HABIT_ALERT_OCCURRENCES,
} from '../src/utils/habitAlerts';
import { normalizeHabitAlertType } from '../src/utils/habitSchedule';
import { canEnableHabitReminder } from '../src/utils/notifications';
import type { HabitItem } from '../src/types/models';

const habit: HabitItem = {
  id: 'test',
  title: 'Walk',
  timeOfDay: 'ANYTIME',
  iconName: 'Footprints',
  streakCount: 0,
  completedDates: [],
  reminderEnabled: true,
  reminderTime: '09:00',
  createdAt: '2026-01-01',
};

test.each([undefined, null, '', 'bad', 'reminder'])(
  'normalizes legacy type %s to Reminder',
  value => {
    expect(normalizeHabitAlertType(value)).toBe('reminder');
  },
);
test('keeps Alarm and derives distinct deterministic IDs', () => {
  expect(normalizeHabitAlertType('alarm')).toBe('alarm');
  expect(getHabitOccurrenceId(habit, '2026-09-08')).toBe(
    'habit-reminder-test-2026-09-08',
  );
  expect(
    getHabitOccurrenceId({ ...habit, reminderType: 'alarm' }, '2026-09-08'),
  ).toBe('habit-alarm-test-2026-09-08');
  expect(getSnoozeId('test')).toBe('habit-alarm-snooze-test');
});
test('schedules later today, skips passed times, and bounds the OS queue', () => {
  const before = getHabitAlertOccurrences(habit, new Date(2026, 8, 8, 8));
  expect(before).toHaveLength(HABIT_ALERT_OCCURRENCES);
  expect(before[0]).toEqual({
    dateKey: '2026-09-08',
    timestamp: new Date(2026, 8, 8, 9).getTime(),
  });
  expect(
    getHabitAlertOccurrences(habit, new Date(2026, 8, 8, 9))[0].dateKey,
  ).toBe('2026-09-09');
});
test('honors weekdays, specific days, one-time dates and end dates', () => {
  const now = new Date(2026, 8, 11, 10); // Friday, after reminder
  expect(
    getHabitAlertOccurrences({ ...habit, scheduleMode: 'WEEKDAYS' }, now)[0]
      .dateKey,
  ).toBe('2026-09-14');
  expect(
    getHabitAlertOccurrences(
      {
        ...habit,
        scheduleMode: 'SPECIFIC_DAYS',
        selectedWeekdays: [2],
        endDate: '2026-09-22',
      },
      now,
    ).map(item => item.dateKey),
  ).toEqual(['2026-09-15', '2026-09-22']);
  expect(
    getHabitAlertOccurrences(
      { ...habit, habitType: 'ONE_TIME', targetDate: '2026-09-12' },
      now,
    ),
  ).toHaveLength(1);
  expect(
    getHabitAlertOccurrences(
      { ...habit, habitType: 'ONE_TIME', targetDate: '2026-09-10' },
      now,
    ),
  ).toHaveLength(0);
  expect(
    getHabitAlertOccurrences({ ...habit, endDate: '2026-09-11' }, now),
  ).toHaveLength(0);
});
test.each([
  { archived: true },
  { reminderEnabled: false },
  { reminderTime: '25:30' },
])('does not schedule inactive or invalid habits %s', patch => {
  expect(getHabitAlertOccurrences({ ...habit, ...patch })).toEqual([]);
});
test.each([
  [2026, 0, 31, '2026-02-01'],
  [2026, 11, 31, '2027-01-01'],
  [2026, 2, 7, '2026-03-08'],
  [2026, 9, 31, '2026-11-01'],
] as const)(
  'uses local calendar dates across boundaries %s/%s/%s',
  (year, month, day, next) => {
    const result = getHabitAlertOccurrences(
      habit,
      new Date(year, month, day, 12),
    );
    expect(result[0].dateKey).toBe(next);
    expect(new Date(result[0].timestamp).getHours()).toBe(9);
  },
);
test('shares the two-habit limit across both modes and excludes an edited habit', () => {
  const active = [
    habit,
    { ...habit, id: 'alarm', reminderType: 'alarm' as const },
  ];
  expect(canEnableHabitReminder(active)).toBe(false);
  expect(canEnableHabitReminder(active, 'alarm')).toBe(true);
  expect(
    canEnableHabitReminder([habit, { ...active[1], archived: true }]),
  ).toBe(true);
});
