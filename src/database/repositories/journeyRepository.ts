import { Q, type Database } from '@nozbe/watermelondb';
import type {
  ActiveJourneyItem,
  JourneyId,
  JourneyTaskCompletion as JourneyTaskCompletionItem,
} from '../../types/models';
import { isDateKey } from '../../utils/dates';
import type ActiveJourney from '../models/ActiveJourney';
import type JourneyTaskCompletion from '../models/JourneyTaskCompletion';
import type { JourneyRepository } from './types';

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

function mapRecord(
  record: ActiveJourney,
  completions: JourneyTaskCompletionItem[] = [],
): ActiveJourneyItem {
  return {
    id: record.id,
    journeyId: record.journeyId as JourneyId,
    startedDateKey: record.startedDateKey,
    isActive: record.isActive,
    removedDateKey: record.removedDateKey ?? undefined,
    taskCompletions: completions,
  };
}

async function completionsFor(
  database: Database,
  activeJourneyId: string,
): Promise<JourneyTaskCompletionItem[]> {
  const records = await database
    .get<JourneyTaskCompletion>('journey_task_completions')
    .query(Q.where('active_journey_id', activeJourneyId))
    .fetch();
  const unique = new Map<string, JourneyTaskCompletionItem>();
  records.forEach(record => {
    if (!record.taskId || !isDateKey(record.dateKey)) return;
    unique.set(`${record.taskId}:${record.dateKey}`, {
      taskId: record.taskId,
      dateKey: record.dateKey,
    });
  });
  return [...unique.values()];
}

async function findEnrollment(database: Database, id: string) {
  try {
    return await database.get<ActiveJourney>('active_journeys').find(id);
  } catch {
    return undefined;
  }
}

async function loadActiveJourneys() {
  const database = await getDatabase();
  const records = await database
    .get<ActiveJourney>('active_journeys')
    .query(Q.where('is_active', true))
    .fetch();
  return Promise.all(
    records.map(async record =>
      mapRecord(record, await completionsFor(database, record.id)),
    ),
  );
}

async function startJourney(journeyId: JourneyId, startedDateKey: string) {
  if (!journeyId || !isDateKey(startedDateKey)) {
    throw new Error('A valid journey and start date are required.');
  }
  return serializeWrite(`journey:${journeyId}`, async () => {
    const database = await getDatabase();
    const record = await database.write(async () => {
      const existing = await database
        .get<ActiveJourney>('active_journeys')
        .query(Q.where('journey_id', journeyId))
        .fetch();
      const active = existing.find(item => item.isActive);
      if (active) return active;
      const archived = existing[0];
      if (archived) {
        await archived.update(item => {
          item.isActive = true;
          item.removedDateKey = null;
        });
        return archived;
      }
      return database.get<ActiveJourney>('active_journeys').create(item => {
        item.journeyId = journeyId;
        item.startedDateKey = startedDateKey;
        item.isActive = true;
        item.removedDateKey = null;
      });
    });
    return mapRecord(record, await completionsFor(database, record.id));
  });
}

async function setTaskCompletion(
  activeJourneyId: string,
  taskId: string,
  dateKey: string,
  completed: boolean,
) {
  if (!activeJourneyId || !taskId || !isDateKey(dateKey)) return false;
  return serializeWrite(
    `journey-task:${activeJourneyId}:${taskId}:${dateKey}`,
    async () => {
      const database = await getDatabase();
      return database.write(async () => {
        const enrollment = await findEnrollment(database, activeJourneyId);
        if (!enrollment?.isActive) return false;
        const collection = database.get<JourneyTaskCompletion>(
          'journey_task_completions',
        );
        const records = await collection
          .query(
            Q.where('active_journey_id', activeJourneyId),
            Q.where('task_id', taskId),
            Q.where('date_key', dateKey),
          )
          .fetch();
        if (completed) {
          if (!records.length) {
            await collection.create(record => {
              record.activeJourneyId = activeJourneyId;
              record.taskId = taskId;
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
    },
  );
}

async function removeActiveJourney(
  activeJourneyId: string,
  removedDateKey: string,
) {
  if (!activeJourneyId || !isDateKey(removedDateKey)) return false;
  return serializeWrite(`active-journey:${activeJourneyId}`, async () => {
    const database = await getDatabase();
    return database.write(async () => {
      const enrollment = await findEnrollment(database, activeJourneyId);
      if (!enrollment) return false;
      await enrollment.update(item => {
        item.isActive = false;
        item.removedDateKey = removedDateKey;
      });
      return true;
    });
  });
}

export const journeyRepository: JourneyRepository = {
  loadActiveJourneys,
  startJourney,
  setTaskCompletion,
  removeActiveJourney,
};
