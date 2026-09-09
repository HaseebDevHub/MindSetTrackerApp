import type { MindsetTrackerBackup } from '../src/services/backup/backupTypes';
import {
  BackupValidationError,
  parseBackup,
  validateBackup,
} from '../src/services/backup/backupValidation';

const makeBackup = (): MindsetTrackerBackup => ({
  backupVersion: 1,
  databaseSchemaVersion: 5,
  exportedAt: '2026-09-06T17:30:00.000Z',
  data: {
    habits: [
      {
        id: 'habit-1',
        title: 'Drink water',
        timeOfDay: 'MORNING',
        frequency: 'EVERYDAY',
        iconName: 'Droplets',
        note: 'Use the large bottle',
        isReminderEnabled: true,
        reminderTime: '08:00',
        isArchived: false,
        archivedDateKey: null,
        createdDateKey: '2026-09-01',
        habitType: 'REGULAR',
        color: '#2563EB',
        scheduleMode: 'SPECIFIC_DAYS',
        selectedWeekdays: '[1,3,5]',
        quotaCount: null,
        endDateKey: null,
        targetDateKey: null,
        goalMode: 'DURATION',
        goalTarget: 10,
        goalUnit: 'MINUTES',
        motivationalText: 'Keep going',
      },
    ],
    habitCompletions: [
      {
        id: 'completion-1',
        habitId: 'habit-1',
        dateKey: '2026-09-05',
        actionType: 'COMPLETION',
        progressValue: 1,
      },
    ],
    activeJourneys: [
      {
        id: 'journey-1',
        journeyId: 'walk',
        startedDateKey: '2026-09-01',
        isActive: true,
        removedDateKey: null,
      },
    ],
    journeyTaskCompletions: [
      {
        id: 'journey-completion-1',
        activeJourneyId: 'journey-1',
        taskId: 'walk-1',
        dateKey: '2026-09-05',
      },
    ],
    preferences: {
      onboarding: { completed: false },
      achievements: { unlocks: [], celebratedPerfectDays: [] },
      notificationReminderTime: '08:00',
      weekStartsOn: 1,
    },
  },
});

describe('backup validation', () => {
  test('accepts and parses every supported collection and habit field', () => {
    expect(parseBackup(JSON.stringify(makeBackup()))).toEqual(makeBackup());
  });

  test('accepts notification settings while remaining compatible with older backups', () => {
    const backup = makeBackup();
    backup.data.preferences.notificationSettings = {
      version: 1,
      masterEnabled: true,
      globalRemindersEnabled: false,
      habitRemindersEnabled: true,
      times: {
        morning: '07:00',
        afternoon: '13:30',
        evening: '21:15',
      },
    };

    expect(
      validateBackup(backup).data.preferences.notificationSettings,
    ).toEqual(backup.data.preferences.notificationSettings);
    expect(validateBackup(makeBackup())).toEqual(makeBackup());
  });

  test('rejects malformed notification settings', () => {
    const backup = makeBackup();
    backup.data.preferences.notificationSettings = {
      version: 1,
      masterEnabled: true,
      globalRemindersEnabled: true,
      habitRemindersEnabled: true,
      times: {
        morning: 'not-a-time',
        afternoon: '13:00',
        evening: '20:00',
      },
    };

    expect(() => validateBackup(backup)).toThrow(BackupValidationError);
  });

  test('deduplicates logical completion rows without losing their parent', () => {
    const backup = makeBackup();
    backup.data.habitCompletions.push({
      ...backup.data.habitCompletions[0],
      id: 'completion-duplicate',
    });
    backup.data.journeyTaskCompletions.push({
      ...backup.data.journeyTaskCompletions[0],
      id: 'journey-completion-duplicate',
    });

    const validated = validateBackup(backup);
    expect(validated.data.habitCompletions).toHaveLength(1);
    expect(validated.data.journeyTaskCompletions).toHaveLength(1);
  });

  test('rejects duplicate IDs and orphan relationship records', () => {
    const duplicate = makeBackup();
    duplicate.data.habits.push({ ...duplicate.data.habits[0] });
    expect(() => validateBackup(duplicate)).toThrow(BackupValidationError);

    const orphan = makeBackup();
    orphan.data.habitCompletions[0].habitId = 'missing';
    expect(() => validateBackup(orphan)).toThrow('orphan habit completion');
  });

  test('rejects malformed JSON and incompatible backup versions', () => {
    expect(() => parseBackup('{not-json')).toThrow(BackupValidationError);
    expect(() => validateBackup({ ...makeBackup(), backupVersion: 2 })).toThrow(
      'Backup version is not supported',
    );
  });

  test('rejects invalid local date keys, enums, and non-finite values', () => {
    const invalidDate = makeBackup();
    invalidDate.data.habitCompletions[0].dateKey = '2026-02-30';
    expect(() => validateBackup(invalidDate)).toThrow(BackupValidationError);

    const invalidEnum = makeBackup();
    invalidEnum.data.habits[0].timeOfDay = 'MIDNIGHT' as 'MORNING';
    expect(() => validateBackup(invalidEnum)).toThrow(BackupValidationError);

    const invalidNumber = makeBackup();
    invalidNumber.data.habitCompletions[0].progressValue = Number.NaN;
    expect(() => validateBackup(invalidNumber)).toThrow(BackupValidationError);
  });
});
