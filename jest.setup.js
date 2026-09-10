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

jest.mock('@notifee/react-native', () => {
  const api = {
    createChannel: jest.fn(async ({ id }) => id),
    requestPermission: jest.fn(async () => ({
      authorizationStatus: 1,
      android: { alarm: 1 },
    })),
    getNotificationSettings: jest.fn(async () => ({
      authorizationStatus: 1,
      android: { alarm: 1 },
    })),
    getTriggerNotifications: jest.fn(async () => []),
    getDisplayedNotifications: jest.fn(async () => []),
    cancelDisplayedNotification: jest.fn(async () => undefined),
    getNotificationCategories: jest.fn(async () => []),
    setNotificationCategories: jest.fn(async () => undefined),
    onBackgroundEvent: jest.fn(),
    onForegroundEvent: jest.fn(() => () => undefined),
    createTriggerNotification: jest.fn(async () => undefined),
    cancelTriggerNotification: jest.fn(async () => undefined),
    openNotificationSettings: jest.fn(async () => undefined),
    openAlarmPermissionSettings: jest.fn(async () => undefined),
  };

  return {
    __esModule: true,
    default: api,
    AlarmType: {
      SET_EXACT_AND_ALLOW_WHILE_IDLE: 3,
      SET_AND_ALLOW_WHILE_IDLE: 1,
    },
    AndroidCategory: { ALARM: 'alarm' },
    AndroidDefaults: { LIGHTS: 4 },
    AndroidVisibility: { PUBLIC: 1 },
    EventType: { DELIVERED: 3, ACTION_PRESS: 2, DISMISSED: 0, PRESS: 1 },
    AndroidImportance: { HIGH: 4 },
    AndroidNotificationSetting: { DISABLED: 0, ENABLED: 1 },
    AuthorizationStatus: {
      DENIED: 0,
      AUTHORIZED: 1,
      PROVISIONAL: 2,
      NOT_DETERMINED: -1,
    },
    RepeatFrequency: { DAILY: 0 },
    TriggerType: { TIMESTAMP: 0 },
  };
});

jest.mock('react-native-reanimated', () => {
  const { Text, View } = require('react-native');
  const transition = { duration: () => transition };
  return {
    __esModule: true,
    default: {
      View,
      Text,
      createAnimatedComponent: component => component,
      call: () => undefined,
    },
    Easing: {
      cubic: value => value,
      in: easing => easing,
      inOut: easing => easing,
    },
    FadeIn: transition,
    FadeOut: transition,
    cancelAnimation: jest.fn(),
    interpolateColor: jest.fn((_value, _input, output) => output[0]),
    runOnJS: callback => callback,
    useAnimatedProps: factory => factory(),
    useAnimatedStyle: factory => factory(),
    useSharedValue: value => ({ value }),
    withSequence: (...values) => values[values.length - 1],
    withSpring: value => value,
    withTiming: (value, _config, callback) => {
      if (callback) callback(true);
      return value;
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
