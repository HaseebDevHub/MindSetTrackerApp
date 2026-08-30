import migrations from '../src/database/migrations';
import schema, {
  habitColumns,
  habitCompletionColumns,
} from '../src/database/schema';

describe('WatermelonDB habit schema', () => {
  test('defines a fresh version-2 normalized schema', () => {
    expect(schema.version).toBe(2);
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

  test('upgrades the existing empty version-1 database with matching tables', () => {
    expect(migrations.minVersion).toBe(1);
    expect(migrations.maxVersion).toBe(2);
    expect(migrations.sortedMigrations).toHaveLength(1);
    const migration = migrations.sortedMigrations[0];
    expect(migration.toVersion).toBe(2);
    expect(migration.steps.map(step => step.type)).toEqual([
      'create_table',
      'create_table',
    ]);
    expect(migration.steps).toEqual([
      {
        type: 'create_table',
        schema: schema.tables.habits,
      },
      {
        type: 'create_table',
        schema: schema.tables.habit_completions,
      },
    ]);
  });
});
