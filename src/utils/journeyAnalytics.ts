import type { ActiveJourneyItem, Journey } from '../types/models';
import { isDateKey } from './dates';

const DAY_MS = 86_400_000;

function dateKeyDayNumber(dateKey: string) {
  if (!isDateKey(dateKey)) return undefined;
  const [year, month, day] = dateKey.split('-').map(Number);
  return Math.floor(Date.UTC(year, month - 1, day) / DAY_MS);
}

function dayNumberToDateKey(dayNumber: number) {
  const date = new Date(dayNumber * DAY_MS);
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${date.getUTCFullYear()}-${month}-${day}`;
}

export type JourneyMetrics = {
  dayNumber: number;
  isCompleted: boolean;
  completedToday: number;
  totalTasks: number;
  percentage: number;
  streak: number;
  consistency: number;
  todayCompletedTaskIds: Set<string>;
  nextTaskId?: string;
};

export function getJourneyMetrics(
  enrollment: ActiveJourneyItem,
  journey: Journey,
  todayKey: string,
): JourneyMetrics {
  const startDay = dateKeyDayNumber(enrollment.startedDateKey);
  const todayDay = dateKeyDayNumber(todayKey);
  const totalTasks = journey.habits.length;
  if (startDay === undefined || todayDay === undefined || totalTasks === 0) {
    return {
      dayNumber: 1,
      isCompleted: false,
      completedToday: 0,
      totalTasks,
      percentage: 0,
      streak: 0,
      consistency: 0,
      todayCompletedTaskIds: new Set(),
    };
  }

  const taskIds = new Set(journey.habits.map(task => task.id));
  const finalDay = startDay + journey.durationDays - 1;
  const elapsedRaw = todayDay - startDay + 1;
  const elapsedDays = Math.max(0, Math.min(journey.durationDays, elapsedRaw));
  const isCompleted = todayDay > finalDay;
  const uniqueByDay = new Map<number, Set<string>>();

  enrollment.taskCompletions.forEach(completion => {
    const completionDay = dateKeyDayNumber(completion.dateKey);
    if (
      completionDay === undefined ||
      completionDay < startDay ||
      completionDay > finalDay ||
      !taskIds.has(completion.taskId)
    ) {
      return;
    }
    const ids = uniqueByDay.get(completionDay) ?? new Set<string>();
    ids.add(completion.taskId);
    uniqueByDay.set(completionDay, ids);
  });

  const todayCompletedTaskIds = new Set(
    [...(uniqueByDay.get(todayDay) ?? [])].filter(id => taskIds.has(id)),
  );
  const completedToday = todayCompletedTaskIds.size;
  const percentage = Math.round((completedToday / totalTasks) * 100);

  const effectiveEnd = Math.min(todayDay, finalDay);
  let streakCursor = effectiveEnd;
  if ((uniqueByDay.get(streakCursor)?.size ?? 0) !== totalTasks) {
    streakCursor -= 1;
  }
  let streak = 0;
  while (
    streakCursor >= startDay &&
    (uniqueByDay.get(streakCursor)?.size ?? 0) === totalTasks
  ) {
    streak += 1;
    streakCursor -= 1;
  }

  let completedOpportunities = 0;
  uniqueByDay.forEach((ids, day) => {
    if (day >= startDay && day <= effectiveEnd) {
      completedOpportunities += ids.size;
    }
  });
  const possibleOpportunities = elapsedDays * totalTasks;
  const consistency = possibleOpportunities
    ? Math.round((completedOpportunities / possibleOpportunities) * 100)
    : 0;

  return {
    dayNumber: Math.max(1, Math.min(journey.durationDays, elapsedRaw)),
    isCompleted,
    completedToday,
    totalTasks,
    percentage,
    streak,
    consistency,
    todayCompletedTaskIds,
    nextTaskId: journey.habits.find(
      task => !todayCompletedTaskIds.has(task.id),
    )?.id,
  };
}

export function getJourneyFinalDateKey(
  startedDateKey: string,
  durationDays: number,
) {
  const startDay = dateKeyDayNumber(startedDateKey);
  return startDay === undefined
    ? undefined
    : dayNumberToDateKey(startDay + Math.max(1, durationDays) - 1);
}
