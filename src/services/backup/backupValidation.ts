import { ACHIEVEMENTS } from '../../constants/achievements';
import type {
  HabitActionType,
  HabitFrequency,
  HabitGoalMode,
  HabitScheduleMode,
  HabitType,
  TimeOfDay,
} from '../../types/models';
import { isOnboardingTarget, isValidHabit } from '../../utils/onboardingValidation';
import { isDateKey } from '../../utils/dates';
import { isValidLocalTime } from '../../utils/time';
import { BACKUP_VERSION } from './backupConstants';
import { migrateBackupToCurrent } from './backupMigrations';
import { BackupValidationError } from './backupValidationError';
import type {
  ActiveJourneyBackupRecord,
  BackupPreferences,
  HabitBackupRecord,
  HabitCompletionBackupRecord,
  JourneyTaskCompletionBackupRecord,
  MindsetTrackerBackup,
} from './backupTypes';

export { BackupValidationError } from './backupValidationError';

const TIME_VALUES: TimeOfDay[] = [
  'MORNING',
  'AFTERNOON',
  'EVENING',
  'ANYTIME',
];
const FREQUENCY_VALUES: HabitFrequency[] = ['EVERYDAY', 'WEEKDAYS'];
const HABIT_TYPE_VALUES: HabitType[] = ['REGULAR', 'NEGATIVE', 'ONE_TIME'];
const SCHEDULE_VALUES: HabitScheduleMode[] = [
  'EVERYDAY',
  'WEEKDAYS',
  'SPECIFIC_DAYS',
  'WEEKLY_QUOTA',
  'MONTHLY_QUOTA',
  'YEARLY_QUOTA',
  'ONE_TIME',
];
const GOAL_VALUES: HabitGoalMode[] = ['OFF', 'DURATION', 'REPEAT'];
const ACTION_VALUES: HabitActionType[] = ['COMPLETION', 'RELAPSE', 'PROGRESS'];

const isObject = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value);
const isString = (value: unknown): value is string => typeof value === 'string';
const isNonEmptyString = (value: unknown): value is string =>
  isString(value) && value.length > 0;
const isNullableString = (value: unknown): value is string | null =>
  value === null || isString(value);
const isNullableDateKey = (value: unknown): value is string | null =>
  value === null || (isString(value) && isDateKey(value));
const isNullableFiniteNumber = (value: unknown): value is number | null =>
  value === null || (typeof value === 'number' && Number.isFinite(value));
const isOptionalLocalTime = (value: unknown): value is string | undefined =>
  value === undefined || (isString(value) && isValidLocalTime(value));
const isOptionalDateKey = (value: unknown): value is string | undefined =>
  value === undefined || (isString(value) && isDateKey(value));

function assertUniqueIds(records: Array<{ id: string }>, label: string) {
  const ids = new Set<string>();
  records.forEach(record => {
    if (ids.has(record.id)) {
      throw new BackupValidationError(
        'malformed_backup',
        `Duplicate ${label} record id.`,
      );
    }
    ids.add(record.id);
  });
}

function isHabitRecord(value: unknown): value is HabitBackupRecord {
  if (!isObject(value)) return false;
  return (
    isNonEmptyString(value.id) &&
    isNonEmptyString(value.title) &&
    TIME_VALUES.includes(value.timeOfDay as TimeOfDay) &&
    FREQUENCY_VALUES.includes(value.frequency as HabitFrequency) &&
    isNonEmptyString(value.iconName) &&
    isNullableString(value.note) &&
    typeof value.isReminderEnabled === 'boolean' &&
    (value.reminderTime === null ||
      (isString(value.reminderTime) && isValidLocalTime(value.reminderTime))) &&
    typeof value.isArchived === 'boolean' &&
    isNullableDateKey(value.archivedDateKey) &&
    isString(value.createdDateKey) &&
    isDateKey(value.createdDateKey) &&
    (value.habitType === null ||
      HABIT_TYPE_VALUES.includes(value.habitType as HabitType)) &&
    isNullableString(value.color) &&
    (value.scheduleMode === null ||
      SCHEDULE_VALUES.includes(value.scheduleMode as HabitScheduleMode)) &&
    isNullableString(value.selectedWeekdays) &&
    isNullableFiniteNumber(value.quotaCount) &&
    isNullableDateKey(value.endDateKey) &&
    isNullableDateKey(value.targetDateKey) &&
    (value.goalMode === null ||
      GOAL_VALUES.includes(value.goalMode as HabitGoalMode)) &&
    isNullableFiniteNumber(value.goalTarget) &&
    (value.goalUnit === null ||
      value.goalUnit === 'MINUTES' ||
      value.goalUnit === 'REPS') &&
    isNullableString(value.motivationalText)
  );
}

function isHabitCompletionRecord(
  value: unknown,
): value is HabitCompletionBackupRecord {
  if (!isObject(value)) return false;
  return (
    isNonEmptyString(value.id) &&
    isNonEmptyString(value.habitId) &&
    isString(value.dateKey) &&
    isDateKey(value.dateKey) &&
    ACTION_VALUES.includes(value.actionType as HabitActionType) &&
    typeof value.progressValue === 'number' &&
    Number.isFinite(value.progressValue) &&
    value.progressValue >= 0
  );
}

function isActiveJourneyRecord(
  value: unknown,
): value is ActiveJourneyBackupRecord {
  if (!isObject(value)) return false;
  return (
    isNonEmptyString(value.id) &&
    isNonEmptyString(value.journeyId) &&
    isString(value.startedDateKey) &&
    isDateKey(value.startedDateKey) &&
    typeof value.isActive === 'boolean' &&
    isNullableDateKey(value.removedDateKey)
  );
}

function isJourneyTaskCompletionRecord(
  value: unknown,
): value is JourneyTaskCompletionBackupRecord {
  if (!isObject(value)) return false;
  return (
    isNonEmptyString(value.id) &&
    isNonEmptyString(value.activeJourneyId) &&
    isNonEmptyString(value.taskId) &&
    isString(value.dateKey) &&
    isDateKey(value.dateKey)
  );
}

function isPreferences(value: unknown): value is BackupPreferences {
  if (!isObject(value) || !isObject(value.onboarding)) return false;
  if (!isObject(value.achievements)) return false;
  const onboarding = value.onboarding;
  const achievements = value.achievements;
  const firstHabit = onboarding.firstHabit;
  const targets = onboarding.targets;
  return (
    isOptionalDateKey(value.appStartedDateKey) &&
    typeof onboarding.completed === 'boolean' &&
    isOptionalLocalTime(onboarding.wakeUpTime) &&
    isOptionalLocalTime(onboarding.dayEndTime) &&
    (targets === undefined ||
      (Array.isArray(targets) && targets.every(isOnboardingTarget))) &&
    (firstHabit === undefined || isValidHabit(firstHabit)) &&
    (onboarding.firstHabitSkipped === undefined ||
      typeof onboarding.firstHabitSkipped === 'boolean') &&
    Array.isArray(achievements.unlocks) &&
    achievements.unlocks.every(unlock => {
      if (!isObject(unlock)) return false;
      return (
        isString(unlock.id) &&
        ACHIEVEMENTS.some(item => item.id === unlock.id) &&
        isString(unlock.unlockedAt) &&
        !Number.isNaN(Date.parse(unlock.unlockedAt))
      );
    }) &&
    Array.isArray(achievements.celebratedPerfectDays) &&
    achievements.celebratedPerfectDays.every(
      date => isString(date) && isDateKey(date),
    ) &&
    isOptionalLocalTime(value.notificationReminderTime) &&
    (value.weekStartsOn === 0 || value.weekStartsOn === 1)
  );
}

function deduplicateLogicalRecords(backup: MindsetTrackerBackup) {
  const habitCompletions = new Map<string, HabitCompletionBackupRecord>();
  backup.data.habitCompletions.forEach(record => {
    const key = `${record.habitId}\u0000${record.dateKey}\u0000${record.actionType}`;
    if (!habitCompletions.has(key)) habitCompletions.set(key, record);
  });
  const journeyCompletions = new Map<
    string,
    JourneyTaskCompletionBackupRecord
  >();
  backup.data.journeyTaskCompletions.forEach(record => {
    const key = `${record.activeJourneyId}\u0000${record.taskId}\u0000${record.dateKey}`;
    if (!journeyCompletions.has(key)) journeyCompletions.set(key, record);
  });
  return {
    ...backup,
    data: {
      ...backup.data,
      habitCompletions: [...habitCompletions.values()],
      journeyTaskCompletions: [...journeyCompletions.values()],
    },
  };
}

function validateCurrentBackup(value: unknown): MindsetTrackerBackup {
  if (!isObject(value)) {
    throw new BackupValidationError('malformed_backup', 'Backup is not an object.');
  }
  if (value.backupVersion !== BACKUP_VERSION) {
    throw new BackupValidationError(
      'incompatible_backup',
      'Backup version is not supported.',
    );
  }
  if (value.databaseSchemaVersion !== 5) {
    throw new BackupValidationError(
      'incompatible_backup',
      'Database schema version is not supported.',
    );
  }
  if (!isString(value.exportedAt) || Number.isNaN(Date.parse(value.exportedAt))) {
    throw new BackupValidationError('malformed_backup', 'Invalid export time.');
  }
  if (!isObject(value.data)) {
    throw new BackupValidationError('malformed_backup', 'Backup data is missing.');
  }
  const data = value.data;
  if (
    !Array.isArray(data.habits) ||
    !data.habits.every(isHabitRecord) ||
    !Array.isArray(data.habitCompletions) ||
    !data.habitCompletions.every(isHabitCompletionRecord) ||
    !Array.isArray(data.activeJourneys) ||
    !data.activeJourneys.every(isActiveJourneyRecord) ||
    !Array.isArray(data.journeyTaskCompletions) ||
    !data.journeyTaskCompletions.every(isJourneyTaskCompletionRecord) ||
    !isPreferences(data.preferences)
  ) {
    throw new BackupValidationError(
      'malformed_backup',
      'Backup contains invalid records.',
    );
  }

  const backup = value as MindsetTrackerBackup;
  assertUniqueIds(backup.data.habits, 'habit');
  assertUniqueIds(backup.data.habitCompletions, 'habit completion');
  assertUniqueIds(backup.data.activeJourneys, 'active journey');
  assertUniqueIds(
    backup.data.journeyTaskCompletions,
    'journey task completion',
  );

  const habitIds = new Set(backup.data.habits.map(record => record.id));
  if (
    backup.data.habitCompletions.some(record => !habitIds.has(record.habitId))
  ) {
    throw new BackupValidationError(
      'malformed_backup',
      'Backup contains an orphan habit completion.',
    );
  }
  const enrollmentIds = new Set(
    backup.data.activeJourneys.map(record => record.id),
  );
  if (
    backup.data.journeyTaskCompletions.some(
      record => !enrollmentIds.has(record.activeJourneyId),
    )
  ) {
    throw new BackupValidationError(
      'malformed_backup',
      'Backup contains an orphan journey completion.',
    );
  }

  return deduplicateLogicalRecords(backup);
}

export function validateBackup(value: unknown): MindsetTrackerBackup {
  return validateCurrentBackup(migrateBackupToCurrent(value));
}

export function parseBackup(serialized: string) {
  try {
    return validateBackup(JSON.parse(serialized) as unknown);
  } catch (error) {
    if (error instanceof BackupValidationError) throw error;
    throw new BackupValidationError('malformed_backup', 'Backup JSON is invalid.');
  }
}
