import { Q, type Database, type Model } from '@nozbe/watermelondb';
import type Habit from '../models/Habit';
import type HabitCompletion from '../models/HabitCompletion';
import { mapHabitRecord } from '../mappers/habitMapper';
import type { HabitItem } from '../../types/models';
import type { HabitActionType } from '../../types/models';
import {
  encodeWeekdays,
  normalizeGoalMode,
  normalizeHabitType,
  normalizeScheduleMode,
} from '../../utils/habitSchedule';
import { getDateStatus, isDateKey, toDateKey } from '../../utils/dates';
import type {
  HabitCreateInput,
  HabitRepository,
  HabitUpdateInput,
} from './types';

let databasePromise: Promise<Database> | undefined;
const writeQueues = new Map<string, Promise<void>>();

async function getDatabase() {
  databasePromise ??= import('../index').then(module => module.database);
  return databasePromise;
}

function serializeWrite<T>(key: string, action: () => Promise<T>) {
  const previous = writeQueues.get(key) ?? Promise.resolve();
  const operation = previous.catch(() => undefined).then(action);
  const settled = operation.then(
    () => undefined,
    () => undefined,
  );
  writeQueues.set(key, settled);
  settled.finally(() => {
    if (writeQueues.get(key) === settled) writeQueues.delete(key);
  });
  return operation;
}

function setHabitFields(
  record: Habit,
  habit: HabitCreateInput | Omit<HabitItem, 'id' | 'completedDates'>,
) {
  record.title = habit.title.trim();
  record.timeOfDay = habit.timeOfDay;
  record.frequency = habit.frequency ?? 'EVERYDAY';
  record.iconName = habit.iconName;
  record.note = habit.note ?? null;
  record.isReminderEnabled = habit.reminderEnabled ?? false;
  record.reminderTime = habit.reminderTime ?? null;
  record.isArchived = habit.archived ?? false;
  record.archivedDateKey = habit.archivedAt ?? null;
  record.createdDateKey = habit.createdAt ?? toDateKey(new Date());
  record.habitType = normalizeHabitType(habit.habitType);
  record.color = habit.color ?? null;
  record.scheduleMode = normalizeScheduleMode(
    habit.scheduleMode,
    habit.frequency,
  );
  record.selectedWeekdays = encodeWeekdays(habit.selectedWeekdays) ?? null;
  record.quotaCount = habit.quotaCount ?? null;
  record.endDateKey = habit.endDate ?? null;
  record.targetDateKey = habit.targetDate ?? null;
  record.goalMode = normalizeGoalMode(habit.goalMode);
  record.goalTarget = habit.goalTarget ?? null;
  record.goalUnit = habit.goalUnit ?? null;
  record.motivationalText = habit.motivationalText ?? null;
}

function applyHabitUpdates(record: Habit, updates: HabitUpdateInput) {
  if (updates.title !== undefined) record.title = updates.title.trim();
  if (updates.timeOfDay !== undefined) record.timeOfDay = updates.timeOfDay;
  if (updates.frequency !== undefined) record.frequency = updates.frequency;
  if (updates.iconName !== undefined) record.iconName = updates.iconName;
  if (Object.prototype.hasOwnProperty.call(updates, 'note')) {
    record.note = updates.note ?? null;
  }
  if (updates.reminderEnabled !== undefined) {
    record.isReminderEnabled = updates.reminderEnabled;
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'reminderTime')) {
    record.reminderTime = updates.reminderTime ?? null;
  }
  if (updates.archived !== undefined) record.isArchived = updates.archived;
  if (Object.prototype.hasOwnProperty.call(updates, 'archivedAt')) {
    record.archivedDateKey = updates.archivedAt ?? null;
  }
  if (updates.createdAt !== undefined) {
    record.createdDateKey = updates.createdAt;
  }
  if (updates.habitType !== undefined) record.habitType = updates.habitType;
  if (Object.prototype.hasOwnProperty.call(updates, 'color')) {
    record.color = updates.color ?? null;
  }
  if (updates.scheduleMode !== undefined) {
    record.scheduleMode = updates.scheduleMode;
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'selectedWeekdays')) {
    record.selectedWeekdays = encodeWeekdays(updates.selectedWeekdays) ?? null;
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'quotaCount')) {
    record.quotaCount = updates.quotaCount ?? null;
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'endDate')) {
    record.endDateKey = updates.endDate ?? null;
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'targetDate')) {
    record.targetDateKey = updates.targetDate ?? null;
  }
  if (updates.goalMode !== undefined) record.goalMode = updates.goalMode;
  if (Object.prototype.hasOwnProperty.call(updates, 'goalTarget')) {
    record.goalTarget = updates.goalTarget ?? null;
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'goalUnit')) {
    record.goalUnit = updates.goalUnit ?? null;
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'motivationalText')) {
    record.motivationalText = updates.motivationalText ?? null;
  }
}

async function findHabit(database: Database, id: string) {
  const matches = await database
    .get<Habit>('habits')
    .query(Q.where('id', id))
    .fetch();
  return matches[0];
}

async function loadAllHabits(): Promise<HabitItem[]> {
  const database = await getDatabase();
  const [habits, completions] = await Promise.all([
    database.get<Habit>('habits').query().fetch(),
    database.get<HabitCompletion>('habit_completions').query().fetch(),
  ]);
  const completionsByHabit = new Map<string, HabitCompletion[]>();
  completions.forEach(completion => {
    const records = completionsByHabit.get(completion.habitId) ?? [];
    records.push(completion);
    completionsByHabit.set(completion.habitId, records);
  });
  return habits.map(habit =>
    mapHabitRecord(habit, completionsByHabit.get(habit.id)),
  );
}

async function createHabit(habit: HabitCreateInput) {
  return serializeWrite('habits:create', async () => {
    const database = await getDatabase();
    const record = await database.write(async () =>
      database.get<Habit>('habits').create(created => {
        setHabitFields(created, habit);
      }),
    );
    return mapHabitRecord(record);
  });
}

async function updateHabit(id: string, updates: HabitUpdateInput) {
  return serializeWrite(`habit:${id}`, async () => {
    const database = await getDatabase();
    return database.write(async () => {
      const record = await findHabit(database, id);
      if (!record) return false;
      await record.update(updated => applyHabitUpdates(updated, updates));
      return true;
    });
  });
}

async function deleteHabit(id: string) {
  if (!id) return false;
  return serializeWrite(`habit:${id}`, async () => {
    const database = await getDatabase();
    return database.write(async () => {
      const habit = await findHabit(database, id);
      if (!habit) return false;
      const completions = await database
        .get<HabitCompletion>('habit_completions')
        .query(Q.where('habit_id', id))
        .fetch();
      await database.batch(
        ...completions.map(record => record.prepareDestroyPermanently()),
        habit.prepareDestroyPermanently(),
      );
      return true;
    });
  });
}

async function setArchived(id: string, archived: boolean, archivedAt?: string) {
  return updateHabit(id, {
    archived,
    archivedAt: archived ? archivedAt ?? toDateKey(new Date()) : undefined,
  });
}

async function setHabitCompletion(
  habitId: string,
  dateKey: string,
  completed: boolean,
) {
  if (!habitId || !isDateKey(dateKey) || getDateStatus(dateKey) === 'future') {
    return false;
  }

  return serializeWrite(`habit:${habitId}`, async () => {
    const database = await getDatabase();
    return database.write(async () => {
      if (!(await findHabit(database, habitId))) return false;
      const dateRecords = await database
        .get<HabitCompletion>('habit_completions')
        .query(Q.where('habit_id', habitId), Q.where('date_key', dateKey))
        .fetch();
      const records = dateRecords.filter(
        record =>
          record.actionType === null || record.actionType === 'COMPLETION',
      );

      if (completed) {
        if (!records.length) {
          await database
            .get<HabitCompletion>('habit_completions')
            .create(record => {
              record.habitId = habitId;
              record.dateKey = dateKey;
              record.actionType = 'COMPLETION';
              record.progressValue = 1;
            });
        } else if (records.length > 1) {
          await database.batch(
            records.slice(1).map(record => record.prepareDestroyPermanently()),
          );
        }
      } else if (records.length) {
        await database.batch(
          records.map(record => record.prepareDestroyPermanently()),
        );
      }
      return true;
    });
  });
}

async function isHabitCompleted(habitId: string, dateKey: string) {
  if (!habitId || !isDateKey(dateKey)) return false;
  const database = await getDatabase();
  const records = await database
    .get<HabitCompletion>('habit_completions')
    .query(Q.where('habit_id', habitId), Q.where('date_key', dateKey))
    .fetch();
  return records.some(
    record => record.actionType === null || record.actionType === 'COMPLETION',
  );
}

async function setHabitAction(
  habitId: string,
  dateKey: string,
  actionType: HabitActionType,
  value = 1,
) {
  if (!habitId || !isDateKey(dateKey) || value < 0) return false;
  return serializeWrite(`habit:${habitId}`, async () => {
    const database = await getDatabase();
    return database.write(async () => {
      if (!(await findHabit(database, habitId))) return false;
      const collection = database.get<HabitCompletion>('habit_completions');
      const records = await collection
        .query(
          Q.where('habit_id', habitId),
          Q.where('date_key', dateKey),
          Q.where('action_type', actionType),
        )
        .fetch();
      if (records[0]) {
        await records[0].update(record => {
          record.progressValue = value;
        });
        if (records.length > 1) {
          await database.batch(
            records
              .slice(1)
              .map(record => record.prepareDestroyPermanently()),
          );
        }
      } else {
        await collection.create(record => {
          record.habitId = habitId;
          record.dateKey = dateKey;
          record.actionType = actionType;
          record.progressValue = value;
        });
      }
      return true;
    });
  });
}

async function removeHabitAction(
  habitId: string,
  dateKey: string,
  actionType: HabitActionType,
) {
  if (!habitId || !isDateKey(dateKey)) return false;
  return serializeWrite(`habit:${habitId}`, async () => {
    const database = await getDatabase();
    return database.write(async () => {
      const records = await database
        .get<HabitCompletion>('habit_completions')
        .query(
          Q.where('habit_id', habitId),
          Q.where('date_key', dateKey),
          Q.where('action_type', actionType),
        )
        .fetch();
      if (records.length) {
        await database.batch(
          records.map(record => record.prepareDestroyPermanently()),
        );
      }
      return true;
    });
  });
}

async function importLegacyHabits(habits: HabitItem[]) {
  await serializeWrite('legacy-habit-import', async () => {
    const database = await getDatabase();
    await database.write(async () => {
      const habitCollection = database.get<Habit>('habits');
      const completionCollection =
        database.get<HabitCompletion>('habit_completions');
      const [existingHabits, existingCompletions] = await Promise.all([
        habitCollection.query().fetch(),
        completionCollection.query().fetch(),
      ]);
      const existingHabitIds = new Set(existingHabits.map(habit => habit.id));
      const firstCompletionByKey = new Map<string, HabitCompletion>();
      const operations: Model[] = [];

      existingCompletions
        .filter(
          completion =>
            completion.actionType === null ||
            completion.actionType === 'COMPLETION',
        )
        .forEach(completion => {
          const key = `${completion.habitId}\u0000${completion.dateKey}`;
          if (firstCompletionByKey.has(key)) {
            operations.push(completion.prepareDestroyPermanently());
          } else {
            firstCompletionByKey.set(key, completion);
          }
        });

      habits.forEach(habit => {
        if (!existingHabitIds.has(habit.id)) {
          operations.push(
            habitCollection.prepareCreate(record => {
              record._raw.id = habit.id;
              setHabitFields(record, habit);
            }),
          );
          existingHabitIds.add(habit.id);
        }

        new Set(habit.completedDates.filter(isDateKey)).forEach(dateKey => {
          const key = `${habit.id}\u0000${dateKey}`;
          if (firstCompletionByKey.has(key)) return;
          const completion = completionCollection.prepareCreate(record => {
            record.habitId = habit.id;
            record.dateKey = dateKey;
            record.actionType = 'COMPLETION';
            record.progressValue = 1;
          });
          firstCompletionByKey.set(key, completion);
          operations.push(completion);
        });
      });

      if (operations.length) await database.batch(operations);
    });
  });
}

async function ensureOnboardingHabit(habit: HabitItem) {
  return serializeWrite('onboarding-habit', async () => {
    const existing = await loadAllHabits();
    const exact = existing.find(record => record.id === habit.id);
    if (exact) return exact.id;
    const titleMatch = existing.find(
      record => record.title.toLowerCase() === habit.title.toLowerCase(),
    );
    if (titleMatch) return titleMatch.id;
    await importLegacyHabits([habit]);
    return habit.id;
  });
}

export const habitRepository: HabitRepository = {
  loadAllHabits,
  createHabit,
  updateHabit,
  deleteHabit,
  setArchived,
  setHabitCompletion,
  isHabitCompleted,
  setHabitAction,
  removeHabitAction,
  importLegacyHabits,
  ensureOnboardingHabit,
};
