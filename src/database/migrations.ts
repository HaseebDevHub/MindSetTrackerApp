import {
  addColumns,
  createTable,
  schemaMigrations,
} from '@nozbe/watermelondb/Schema/migrations';
import {
  activeJourneyColumns,
  habitCompletionV2Columns,
  habitCompletionV3Columns,
  habitV2Columns,
  habitV3Columns,
  habitV4Columns,
  habitV6Columns,
  journeyTaskCompletionColumns,
} from './schema';

const migrations = schemaMigrations({
  migrations: [
    {
      toVersion: 6,
      steps: [addColumns({ table: 'habits', columns: habitV6Columns })],
    },
    {
      toVersion: 2,
      steps: [
        createTable({
          name: 'habits',
          columns: habitV2Columns,
        }),
        createTable({
          name: 'habit_completions',
          columns: habitCompletionV2Columns,
        }),
      ],
    },
    {
      toVersion: 3,
      steps: [
        addColumns({ table: 'habits', columns: habitV3Columns }),
        addColumns({
          table: 'habit_completions',
          columns: habitCompletionV3Columns,
        }),
      ],
    },
    {
      toVersion: 4,
      steps: [addColumns({ table: 'habits', columns: habitV4Columns })],
    },
    {
      toVersion: 5,
      steps: [
        createTable({
          name: 'active_journeys',
          columns: activeJourneyColumns,
        }),
        createTable({
          name: 'journey_task_completions',
          columns: journeyTaskCompletionColumns,
        }),
      ],
    },
  ],
});

export default migrations;
