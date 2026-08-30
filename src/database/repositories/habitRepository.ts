import { Q, type Database, type Model } from '@nozbe/watermelondb';
import type Habit from '../models/Habit';
import type HabitCompletion from '../models/HabitCompletion';
import { mapHabitRecord } from '../mappers/habitMapper';
import type { HabitItem } from '../../types/models';
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
  record.createdDateKey = habit.createdAt ?? toDateKey(new Date());
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
  if (updates.createdAt !== undefined) {
    record.createdDateKey = updates.createdAt;
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

async function setArchived(id: string, archived: boolean) {
  return updateHabit(id, { archived });
}

async function setHabitCompletion(
  habitId: string,
  dateKey: string,
  completed: boolean,
) {
  if (!habitId || !isDateKey(dateKey) || getDateStatus(dateKey) === 'future') {
    return false;
  }

  return serializeWrite(`completion:${habitId}:${dateKey}`, async () => {
    const database = await getDatabase();
    return database.write(async () => {
      if (!(await findHabit(database, habitId))) return false;
      const records = await database
        .get<HabitCompletion>('habit_completions')
        .query(Q.where('habit_id', habitId), Q.where('date_key', dateKey))
        .fetch();

      if (completed) {
        if (!records.length) {
          await database
            .get<HabitCompletion>('habit_completions')
            .create(record => {
              record.habitId = habitId;
              record.dateKey = dateKey;
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
  return (
    (await database
      .get<HabitCompletion>('habit_completions')
      .query(Q.where('habit_id', habitId), Q.where('date_key', dateKey))
      .fetchCount()) > 0
  );
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

      existingCompletions.forEach(completion => {
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
  setArchived,
  setHabitCompletion,
  isHabitCompleted,
  importLegacyHabits,
  ensureOnboardingHabit,
};
