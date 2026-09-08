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

jest.mock('@react-native-google-signin/google-signin', () => ({
  GoogleSignin: {
    configure: jest.fn(),
    addScopes: jest.fn(async () => ({ type: 'cancelled', data: null })),
    clearCachedAccessToken: jest.fn(async () => null),
    getCurrentUser: jest.fn(() => null),
    getTokens: jest.fn(),
    hasPlayServices: jest.fn(async () => true),
    hasPreviousSignIn: jest.fn(() => false),
    signIn: jest.fn(async () => ({ type: 'cancelled', data: null })),
    signInSilently: jest.fn(async () => ({
      type: 'noSavedCredentialFound',
      data: null,
    })),
    signOut: jest.fn(async () => null),
  },
  isErrorWithCode: error =>
    error instanceof Error && typeof error.code === 'string',
  isSuccessResponse: response => response.type === 'success',
  statusCodes: {
    IN_PROGRESS: 'IN_PROGRESS',
    NULL_PRESENTER: 'NULL_PRESENTER',
    PLAY_SERVICES_NOT_AVAILABLE: 'PLAY_SERVICES_NOT_AVAILABLE',
  },
}));

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
