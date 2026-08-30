import { appSchema, tableSchema } from '@nozbe/watermelondb';

export const habitColumns = [
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

export const habitCompletionColumns = [
  {
    name: 'habit_id',
    type: 'string' as const,
    isIndexed: true,
  },
  { name: 'date_key', type: 'string' as const },
];

const schema = appSchema({
  version: 2,
  tables: [
    tableSchema({
      name: 'habits',
      columns: habitColumns,
    }),
    tableSchema({
      name: 'habit_completions',
      columns: habitCompletionColumns,
    }),
  ],
});

export default schema;
