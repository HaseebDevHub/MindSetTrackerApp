/* eslint-env jest */

jest.mock('react-native-mmkv', () => {
  const stores = new Map();

  return {
    createMMKV: ({ id = 'mmkv.default' } = {}) => {
      if (!stores.has(id)) stores.set(id, new Map());
      const values = stores.get(id);

      return {
        contains: key => values.has(key),
        getBoolean: key => {
          const value = values.get(key);
          return typeof value === 'boolean' ? value : undefined;
        },
        getNumber: key => {
          const value = values.get(key);
          return typeof value === 'number' ? value : undefined;
        },
        getString: key => {
          const value = values.get(key);
          return typeof value === 'string' ? value : undefined;
        },
        remove: key => values.delete(key),
        set: (key, value) => values.set(key, value),
      };
    },
  };
});

jest.mock('./src/database/repositories/habitRepository', () => {
  let nextId = 1;
  return {
    habitRepository: {
      loadAllHabits: jest.fn(async () => []),
      createHabit: jest.fn(async habit => ({
        ...habit,
        id: `test-habit-${nextId++}`,
        completedDates: [],
        streakCount: 0,
      })),
      updateHabit: jest.fn(async () => true),
      deleteHabit: jest.fn(async () => true),
      setArchived: jest.fn(async () => true),
      setHabitCompletion: jest.fn(async () => true),
      isHabitCompleted: jest.fn(async () => false),
      setHabitAction: jest.fn(async () => true),
      removeHabitAction: jest.fn(async () => true),
      importLegacyHabits: jest.fn(async () => undefined),
      ensureOnboardingHabit: jest.fn(async habit => habit.id),
    },
  };
});
