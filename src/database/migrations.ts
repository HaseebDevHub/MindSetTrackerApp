import {
  createTable,
  schemaMigrations,
} from '@nozbe/watermelondb/Schema/migrations';
import { habitColumns, habitCompletionColumns } from './schema';

const migrations = schemaMigrations({
  migrations: [
    {
      toVersion: 2,
      steps: [
        createTable({
          name: 'habits',
          columns: habitColumns,
        }),
        createTable({
          name: 'habit_completions',
          columns: habitCompletionColumns,
        }),
      ],
    },
  ],
});

export default migrations;
