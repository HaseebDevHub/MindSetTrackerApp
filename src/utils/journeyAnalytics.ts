import type { ActiveJourneyItem, Journey, JourneyTask } from '../types/models';
import { addDays, fromDateKey, isDateKey, toDateKey } from './dates';

export type JourneyDay = {
  dayNumber: number;
  dateKey: string;
  tasks: JourneyTask[];
  completedTaskIds: string[];
  finished: boolean;
  status: 'past' | 'current' | 'future';
};

export function getJourneyDayTasks(
  journey: Journey,
  dayNumber: number,
  planVersion = 1,
) {
  if (dayNumber < 1 || dayNumber > journey.durationDays) return [];
  // Old enrollments keep their original requirements; never infer completion
  // from a newly shortened plan or discard their stored history.
  if (planVersion !== 1)
    return journey.tasks.filter(task => task.id !== 'morning-breakfast');
  const ids = journey.schedule[dayNumber - 1]?.taskIds ?? [];
  return ids.flatMap(id => {
    const task = journey.tasks.find(item => item.id === id);
    return task ? [task] : [];
  });
}

export function getJourneyDays(
  enrollment: ActiveJourneyItem,
  journey: Journey,
  todayKey: string,
): JourneyDay[] {
  if (!isDateKey(enrollment.startedDateKey) || !isDateKey(todayKey)) return [];
  const byDate = new Map<string, Set<string>>();
  enrollment.taskCompletions.forEach(({ dateKey, taskId }) => {
    const ids = byDate.get(dateKey) ?? new Set<string>();
    ids.add(taskId);
    byDate.set(dateKey, ids);
  });
  return Array.from({ length: journey.durationDays }, (_, index) => {
    const dayNumber = index + 1;
    const dateKey = toDateKey(
      addDays(fromDateKey(enrollment.startedDateKey), index),
    );
    const tasks = getJourneyDayTasks(
      journey,
      dayNumber,
      enrollment.planVersion ?? 0,
    );
    const completedTaskIds = tasks
      .filter(task => byDate.get(dateKey)?.has(task.id))
      .map(task => task.id);
    return {
      dayNumber,
      dateKey,
      tasks,
      completedTaskIds,
      finished:
        dateKey <= todayKey &&
        tasks.length > 0 &&
        completedTaskIds.length === tasks.length,
      status:
        dateKey === todayKey
          ? 'current'
          : dateKey < todayKey
          ? 'past'
          : 'future',
    };
  });
}

export function getJourneyMetrics(
  enrollment: ActiveJourneyItem,
  journey: Journey,
  todayKey: string,
) {
  const days = getJourneyDays(enrollment, journey, todayKey);
  const current = days.find(day => day.status === 'current');
  const elapsed = days.filter(day => day.status !== 'future');
  const totalTasks =
    current?.tasks.length ??
    getJourneyDayTasks(journey, 1, enrollment.planVersion ?? 0).length;
  const todayCompletedTaskIds = new Set(current?.completedTaskIds ?? []);
  const completedToday = todayCompletedTaskIds.size;
  const possible = elapsed.reduce((sum, day) => sum + day.tasks.length, 0);
  const completed = elapsed.reduce(
    (sum, day) => sum + day.completedTaskIds.length,
    0,
  );
  let cursor = elapsed.length - 1;
  if (cursor >= 0 && !elapsed[cursor].finished) cursor -= 1;
  let streak = 0;
  while (cursor >= 0 && elapsed[cursor].finished) {
    streak += 1;
    cursor -= 1;
  }
  return {
    dayNumber: current?.dayNumber ?? Math.max(1, elapsed.length),
    isCompleted: days.length > 0 && days[days.length - 1].dateKey < todayKey,
    completedToday,
    totalTasks,
    percentage: totalTasks
      ? Math.round((completedToday / totalTasks) * 100)
      : 0,
    streak,
    consistency: possible ? Math.round((completed / possible) * 100) : 0,
    daysFinished: days.filter(day => day.finished).length,
    todayCompletedTaskIds,
    nextTaskId: current?.tasks.find(task => !todayCompletedTaskIds.has(task.id))
      ?.id,
  };
}

export function getJourneyFinalDateKey(
  startedDateKey: string,
  durationDays: number,
) {
  return isDateKey(startedDateKey)
    ? toDateKey(
        addDays(fromDateKey(startedDateKey), Math.max(1, durationDays) - 1),
      )
    : undefined;
}
