import type { Model } from '@nozbe/watermelondb';
import { database } from '../../database';
import type ActiveJourney from '../../database/models/ActiveJourney';
import type Habit from '../../database/models/Habit';
import type HabitCompletion from '../../database/models/HabitCompletion';
import type JourneyTaskCompletion from '../../database/models/JourneyTaskCompletion';
import { DATABASE_SCHEMA_VERSION } from '../../database/schema';
import { normalizeHabitAlertType } from '../../utils/habitSchedule';
import { backupSyncStorage } from '../../storage/backupSyncStorage';
import { BACKUP_VERSION } from './backupConstants';
import { runWithBackupRestoreGate } from './backupOperationGate';
import {
  applyBackupPreferences,
  exportBackupPreferences,
} from './backupPreferences';
import type {
  ActiveJourneyBackupRecord,
  HabitBackupRecord,
  HabitCompletionBackupRecord,
  JourneyTaskCompletionBackupRecord,
  MindsetTrackerBackup,
} from './backupTypes';

const byId = <T extends { id: string }>(a: T, b: T) => a.id.localeCompare(b.id);

function mapHabit(record: Habit): HabitBackupRecord {
  return {
    id: record.id,
    title: record.title,
    timeOfDay: record.timeOfDay,
    frequency: record.frequency,
    iconName: record.iconName,
    note: record.note,
    isReminderEnabled: record.isReminderEnabled,
    reminderTime: record.reminderTime,
    reminderType: normalizeHabitAlertType(record.reminderType),
    isArchived: record.isArchived,
    archivedDateKey: record.archivedDateKey,
    createdDateKey: record.createdDateKey,
    habitType: record.habitType,
    color: record.color,
    scheduleMode: record.scheduleMode,
    selectedWeekdays: record.selectedWeekdays,
    quotaCount: record.quotaCount,
    endDateKey: record.endDateKey,
    targetDateKey: record.targetDateKey,
    goalMode: record.goalMode,
    goalTarget: record.goalTarget,
    goalUnit: record.goalUnit,
    motivationalText: record.motivationalText,
  };
}

function mapHabitCompletion(
  record: HabitCompletion,
): HabitCompletionBackupRecord {
  return {
    id: record.id,
    habitId: record.habitId,
    dateKey: record.dateKey,
    actionType: record.actionType ?? 'COMPLETION',
    progressValue: record.progressValue ?? 1,
  };
}

function mapActiveJourney(record: ActiveJourney): ActiveJourneyBackupRecord {
  return {
    id: record.id,
    journeyId: record.journeyId,
    startedDateKey: record.startedDateKey,
    isActive: record.isActive,
    removedDateKey: record.removedDateKey,
  };
}

function mapJourneyCompletion(
  record: JourneyTaskCompletion,
): JourneyTaskCompletionBackupRecord {
  return {
    id: record.id,
    activeJourneyId: record.activeJourneyId,
    taskId: record.taskId,
    dateKey: record.dateKey,
  };
}

export async function exportBackup(): Promise<MindsetTrackerBackup> {
  const data = await database.read(async () => {
    const [habits, habitCompletions, activeJourneys, journeyTaskCompletions] =
      await Promise.all([
        database.get<Habit>('habits').query().fetch(),
        database.get<HabitCompletion>('habit_completions').query().fetch(),
        database.get<ActiveJourney>('active_journeys').query().fetch(),
        database
          .get<JourneyTaskCompletion>('journey_task_completions')
          .query()
          .fetch(),
      ]);
    return {
      habits: habits.map(mapHabit).sort(byId),
      habitCompletions: habitCompletions.map(mapHabitCompletion).sort(byId),
      activeJourneys: activeJourneys.map(mapActiveJourney).sort(byId),
      journeyTaskCompletions: journeyTaskCompletions
        .map(mapJourneyCompletion)
        .sort(byId),
    };
  });

  return {
    backupVersion: BACKUP_VERSION,
    databaseSchemaVersion: DATABASE_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    data: { ...data, preferences: exportBackupPreferences() },
  };
}

export async function hasMeaningfulLocalData() {
  return database.read(async () => {
    const [habits, journeys] = await Promise.all([
      database.get<Habit>('habits').query().fetchCount(),
      database.get<ActiveJourney>('active_journeys').query().fetchCount(),
    ]);
    return habits > 0 || journeys > 0;
  });
}

function assignHabit(record: Habit, value: HabitBackupRecord) {
  record.title = value.title;
  record.timeOfDay = value.timeOfDay;
  record.frequency = value.frequency;
  record.iconName = value.iconName;
  record.note = value.note;
  record.isReminderEnabled = value.isReminderEnabled;
  record.reminderTime = value.reminderTime;
  record.reminderType = normalizeHabitAlertType(value.reminderType);
  record.isArchived = value.isArchived;
  record.archivedDateKey = value.archivedDateKey;
  record.createdDateKey = value.createdDateKey;
  record.habitType = value.habitType;
  record.color = value.color;
  record.scheduleMode = value.scheduleMode;
  record.selectedWeekdays = value.selectedWeekdays;
  record.quotaCount = value.quotaCount;
  record.endDateKey = value.endDateKey;
  record.targetDateKey = value.targetDateKey;
  record.goalMode = value.goalMode;
  record.goalTarget = value.goalTarget;
  record.goalUnit = value.goalUnit;
  record.motivationalText = value.motivationalText;
}

function assignHabitCompletion(
  record: HabitCompletion,
  value: HabitCompletionBackupRecord,
) {
  record.habitId = value.habitId;
  record.dateKey = value.dateKey;
  record.actionType = value.actionType;
  record.progressValue = value.progressValue;
}

function assignActiveJourney(
  record: ActiveJourney,
  value: ActiveJourneyBackupRecord,
) {
  record.journeyId = value.journeyId;
  record.startedDateKey = value.startedDateKey;
  record.isActive = value.isActive;
  record.removedDateKey = value.removedDateKey;
}

function assignJourneyCompletion(
  record: JourneyTaskCompletion,
  value: JourneyTaskCompletionBackupRecord,
) {
  record.activeJourneyId = value.activeJourneyId;
  record.taskId = value.taskId;
  record.dateKey = value.dateKey;
}

function reconcileRecords<TModel extends Model, TValue extends { id: string }>(
  current: TModel[],
  incoming: TValue[],
  create: (value: TValue) => TModel,
  update: (record: TModel, value: TValue) => TModel,
) {
  const incomingIds = new Set(incoming.map(record => record.id));
  const currentById = new Map(current.map(record => [record.id, record]));
  const deletions: Model[] = current
    .filter(record => !incomingIds.has(record.id))
    .map(record => record.prepareDestroyPermanently());
  const upserts: Model[] = [];
  incoming.forEach(value => {
    const existing = currentById.get(value.id);
    upserts.push(existing ? update(existing, value) : create(value));
  });
  return { deletions, upserts };
}

async function replaceDatabaseSnapshot(backup: MindsetTrackerBackup) {
  await database.write(async () => {
    const habitCollection = database.get<Habit>('habits');
    const habitCompletionCollection =
      database.get<HabitCompletion>('habit_completions');
    const journeyCollection = database.get<ActiveJourney>('active_journeys');
    const journeyCompletionCollection = database.get<JourneyTaskCompletion>(
      'journey_task_completions',
    );
    const [habits, habitCompletions, journeys, journeyCompletions] =
      await Promise.all([
        habitCollection.query().fetch(),
        habitCompletionCollection.query().fetch(),
        journeyCollection.query().fetch(),
        journeyCompletionCollection.query().fetch(),
      ]);

    const habitOperations = reconcileRecords(
      habits,
      backup.data.habits,
      value =>
        habitCollection.prepareCreate(record => {
          record._raw.id = value.id;
          assignHabit(record, value);
        }),
      (record, value) =>
        record.prepareUpdate(updated => assignHabit(updated, value)),
    );
    const habitCompletionOperations = reconcileRecords(
      habitCompletions,
      backup.data.habitCompletions,
      value =>
        habitCompletionCollection.prepareCreate(record => {
          record._raw.id = value.id;
          assignHabitCompletion(record, value);
        }),
      (record, value) =>
        record.prepareUpdate(updated => assignHabitCompletion(updated, value)),
    );
    const journeyOperations = reconcileRecords(
      journeys,
      backup.data.activeJourneys,
      value =>
        journeyCollection.prepareCreate(record => {
          record._raw.id = value.id;
          assignActiveJourney(record, value);
        }),
      (record, value) =>
        record.prepareUpdate(updated => assignActiveJourney(updated, value)),
    );
    const journeyCompletionOperations = reconcileRecords(
      journeyCompletions,
      backup.data.journeyTaskCompletions,
      value =>
        journeyCompletionCollection.prepareCreate(record => {
          record._raw.id = value.id;
          assignJourneyCompletion(record, value);
        }),
      (record, value) =>
        record.prepareUpdate(updated =>
          assignJourneyCompletion(updated, value),
        ),
    );

    await database.batch([
      // Remove children first so a snapshot can safely omit their parents.
      ...habitCompletionOperations.deletions,
      ...journeyCompletionOperations.deletions,
      ...habitOperations.deletions,
      ...journeyOperations.deletions,
      // Create/update parents before restoring their related child records.
      ...habitOperations.upserts,
      ...journeyOperations.upserts,
      ...habitCompletionOperations.upserts,
      ...journeyCompletionOperations.upserts,
    ]);
  });
}

export async function importBackup(backup: MindsetTrackerBackup) {
  return runWithBackupRestoreGate(async () => {
    await replaceDatabaseSnapshot(backup);
    if (!backupSyncStorage.setRestoreJournal(backup.data.preferences)) {
      throw new Error('Unable to persist the restore journal.');
    }
    if (!applyBackupPreferences(backup.data.preferences)) {
      throw new Error('Unable to restore application preferences.');
    }
    backupSyncStorage.clearRestoreJournal();
  });
}

export function recoverPendingPreferenceRestore() {
  const journal = backupSyncStorage.getRestoreJournal();
  if (!journal) return true;
  if (!applyBackupPreferences(journal.preferences)) return false;
  backupSyncStorage.clearRestoreJournal();
  return true;
}
