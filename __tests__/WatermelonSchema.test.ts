import migrations from '../src/database/migrations';
import schema, {
  activeJourneyColumns,
  habitColumns,
  habitCompletionColumns,
  habitCompletionV2Columns,
  habitCompletionV3Columns,
  habitV2Columns,
  habitV3Columns,
  habitV4Columns,
  journeyTaskCompletionColumns,
} from '../src/database/schema';

describe('WatermelonDB habit schema', () => {
  test('defines a fresh version-5 normalized schema', () => {
    expect(schema.version).toBe(5);
    expect(Object.keys(schema.tables)).toEqual([
      'habits',
      'habit_completions',
      'active_journeys',
      'journey_task_completions',
    ]);
    expect(schema.tables.habits.columnArray).toEqual(habitColumns);
    expect(schema.tables.habit_completions.columnArray).toEqual(
      habitCompletionColumns,
    );
    expect(schema.tables.active_journeys.columnArray).toEqual(
      activeJourneyColumns,
    );
    expect(schema.tables.journey_task_completions.columnArray).toEqual(
      journeyTaskCompletionColumns,
    );
    expect(schema.tables.habits.columns).not.toHaveProperty('id');
    expect(schema.tables.habit_completions.columns.habit_id).toMatchObject({
      type: 'string',
      isIndexed: true,
    });
    expect(schema.tables.habit_completions.columns.date_key).toMatchObject({
      type: 'string',
    });
  });

  test('upgrades the empty version-1 database without resetting existing data', () => {
    expect(migrations.minVersion).toBe(1);
    expect(migrations.maxVersion).toBe(5);
    expect(migrations.sortedMigrations).toHaveLength(4);

    const [version2, version3, version4, version5] =
      migrations.sortedMigrations;
    expect(version2.toVersion).toBe(2);
    expect(version2.steps.map(step => step.type)).toEqual([
      'create_table',
      'create_table',
    ]);
    expect(version2.steps[0]).toMatchObject({
      type: 'create_table',
      schema: { name: 'habits', columnArray: habitV2Columns },
    });
    expect(version2.steps[1]).toMatchObject({
      type: 'create_table',
      schema: {
        name: 'habit_completions',
        columnArray: habitCompletionV2Columns,
      },
    });

    expect(version3.toVersion).toBe(3);
    expect(version3.steps).toEqual([
      { type: 'add_columns', table: 'habits', columns: habitV3Columns },
      {
        type: 'add_columns',
        table: 'habit_completions',
        columns: habitCompletionV3Columns,
      },
    ]);
    expect(version4).toMatchObject({
      toVersion: 4,
      steps: [{ type: 'add_columns', table: 'habits', columns: habitV4Columns }],
    });
    expect(version5).toMatchObject({
      toVersion: 5,
    });
    expect(version5.steps.map(step => step.type)).toEqual([
      'create_table',
      'create_table',
    ]);
    expect(version5.steps[0]).toMatchObject({
      type: 'create_table',
      schema: {
        name: 'active_journeys',
        columnArray: activeJourneyColumns,
      },
    });
    expect(version5.steps[1]).toMatchObject({
      type: 'create_table',
      schema: {
        name: 'journey_task_completions',
        columnArray: journeyTaskCompletionColumns,
      },
    });
  });
});
