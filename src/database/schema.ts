import { appSchema, tableSchema } from '@nozbe/watermelondb';

export const habitV2Columns = [
  { name: 'title', type: 'string' as const },
  { name: 'time_of_day', type: 'string' as const },
  { name: 'frequency', type: 'string' as const },
  { name: 'icon_name', type: 'string' as const },
  { name: 'note', type: 'string' as const, isOptional: true },
  { name: 'is_reminder_enabled', type: 'boolean' as const },
  { name: 'reminder_time', type: 'string' as const, isOptional: true },
  { name: 'is_archived', type: 'boolean' as const },
  { name: 'created_date_key', type: 'string' as const },
];

export const habitV3Columns = [
  { name: 'habit_type', type: 'string' as const, isOptional: true },
  { name: 'color', type: 'string' as const, isOptional: true },
  { name: 'schedule_mode', type: 'string' as const, isOptional: true },
  { name: 'selected_weekdays', type: 'string' as const, isOptional: true },
  { name: 'quota_count', type: 'number' as const, isOptional: true },
  { name: 'end_date_key', type: 'string' as const, isOptional: true },
  { name: 'target_date_key', type: 'string' as const, isOptional: true },
  { name: 'goal_mode', type: 'string' as const, isOptional: true },
  { name: 'goal_target', type: 'number' as const, isOptional: true },
  { name: 'goal_unit', type: 'string' as const, isOptional: true },
  { name: 'motivational_text', type: 'string' as const, isOptional: true },
];

export const habitV4Columns = [
  { name: 'archived_date_key', type: 'string' as const, isOptional: true },
];

export const habitColumns = [
  ...habitV2Columns,
  ...habitV3Columns,
  ...habitV4Columns,
];

export const habitCompletionV2Columns = [
  {
    name: 'habit_id',
    type: 'string' as const,
    isIndexed: true,
  },
  { name: 'date_key', type: 'string' as const },
];

export const habitCompletionV3Columns = [
  { name: 'action_type', type: 'string' as const, isOptional: true },
  { name: 'progress_value', type: 'number' as const, isOptional: true },
];

export const habitCompletionColumns = [
  ...habitCompletionV2Columns,
  ...habitCompletionV3Columns,
];

export const activeJourneyColumns = [
  { name: 'journey_id', type: 'string' as const, isIndexed: true },
  { name: 'started_date_key', type: 'string' as const },
  { name: 'is_active', type: 'boolean' as const },
  { name: 'removed_date_key', type: 'string' as const, isOptional: true },
];

export const journeyTaskCompletionColumns = [
  { name: 'active_journey_id', type: 'string' as const, isIndexed: true },
  { name: 'task_id', type: 'string' as const },
  { name: 'date_key', type: 'string' as const },
];

const schema = appSchema({
  version: 5,
  tables: [
    tableSchema({
      name: 'habits',
      columns: habitColumns,
    }),
    tableSchema({
      name: 'habit_completions',
      columns: habitCompletionColumns,
    }),
    tableSchema({
      name: 'active_journeys',
      columns: activeJourneyColumns,
    }),
    tableSchema({
      name: 'journey_task_completions',
      columns: journeyTaskCompletionColumns,
    }),
  ],
});

export default schema;
