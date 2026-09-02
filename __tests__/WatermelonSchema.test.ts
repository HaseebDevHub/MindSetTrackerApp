import migrations from '../src/database/migrations';
import schema, {
  habitColumns,
  habitCompletionColumns,
  habitCompletionV2Columns,
  habitCompletionV3Columns,
  habitV2Columns,
  habitV3Columns,
  habitV4Columns,
} from '../src/database/schema';

describe('WatermelonDB habit schema', () => {
  test('defines a fresh version-4 normalized schema', () => {
    expect(schema.version).toBe(4);
    expect(Object.keys(schema.tables)).toEqual(['habits', 'habit_completions']);
    expect(schema.tables.habits.columnArray).toEqual(habitColumns);
    expect(schema.tables.habit_completions.columnArray).toEqual(
      habitCompletionColumns,
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
    expect(migrations.maxVersion).toBe(4);
    expect(migrations.sortedMigrations).toHaveLength(3);

    const [version2, version3, version4] = migrations.sortedMigrations;
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
  });
});
