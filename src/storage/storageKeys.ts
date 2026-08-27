export const STORAGE_KEYS = {
  THEME_MODE: 'themeMode',
  ONBOARDING_COMPLETED: 'onboarding.completed',
  ONBOARDING_WAKE_UP_TIME: 'onboarding.wakeUpTime',
  ONBOARDING_DAY_END_TIME: 'onboarding.dayEndTime',
  ONBOARDING_TARGETS: 'onboarding.targets',
  ONBOARDING_FIRST_HABIT: 'onboarding.firstHabit',
  NOTIFICATION_REMINDER_TIME: 'notifications.reminderTime',
  HABITS: 'habits.items',
  LEGACY_DEMO_HABITS_REMOVED: 'migrations.legacyDemoHabitsRemoved',
  COMPLETION_DATES: 'habits.completionDates',
  ACHIEVEMENT_UNLOCKS: 'achievements.unlocks',
  CELEBRATED_PERFECT_DAYS: 'achievements.celebratedPerfectDays',
} as const;

type StaticStorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];
export type CompletionStorageKey = `habits.completions.${string}`;
export type StorageKey = StaticStorageKey | CompletionStorageKey;

export type StorageSchema = {
  [STORAGE_KEYS.THEME_MODE]: string;
  [STORAGE_KEYS.ONBOARDING_COMPLETED]: boolean;
  [STORAGE_KEYS.ONBOARDING_WAKE_UP_TIME]: string;
  [STORAGE_KEYS.ONBOARDING_DAY_END_TIME]: string;
  [STORAGE_KEYS.ONBOARDING_TARGETS]: string;
  [STORAGE_KEYS.ONBOARDING_FIRST_HABIT]: string;
  [STORAGE_KEYS.NOTIFICATION_REMINDER_TIME]: string;
  [STORAGE_KEYS.HABITS]: string;
  [STORAGE_KEYS.LEGACY_DEMO_HABITS_REMOVED]: boolean;
  [STORAGE_KEYS.COMPLETION_DATES]: string;
  [STORAGE_KEYS.ACHIEVEMENT_UNLOCKS]: string;
  [STORAGE_KEYS.CELEBRATED_PERFECT_DAYS]: string;
};

type KeysOfType<Value> = {
  [Key in StaticStorageKey]: StorageSchema[Key] extends Value ? Key : never;
}[StaticStorageKey];

export type StringStorageKey = KeysOfType<string> | CompletionStorageKey;
export type BooleanStorageKey = KeysOfType<boolean>;
export type NumberStorageKey = KeysOfType<number>;

export type StorageValue<Key extends StorageKey> =
  Key extends CompletionStorageKey
    ? string
    : Key extends keyof StorageSchema
    ? StorageSchema[Key]
    : never;
