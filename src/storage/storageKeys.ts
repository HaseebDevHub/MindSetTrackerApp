export const STORAGE_KEYS = {
  THEME_MODE: 'themeMode',
  ONBOARDING_COMPLETED: 'onboarding.completed',
  ONBOARDING_WAKE_UP_TIME: 'onboarding.wakeUpTime',
  ONBOARDING_DAY_END_TIME: 'onboarding.dayEndTime',
  ONBOARDING_TARGETS: 'onboarding.targets',
  ONBOARDING_FIRST_HABIT: 'onboarding.firstHabit',
  NOTIFICATION_REMINDER_TIME: 'notifications.reminderTime',
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];

export type StorageSchema = {
  [STORAGE_KEYS.THEME_MODE]: string;
  [STORAGE_KEYS.ONBOARDING_COMPLETED]: boolean;
  [STORAGE_KEYS.ONBOARDING_WAKE_UP_TIME]: string;
  [STORAGE_KEYS.ONBOARDING_DAY_END_TIME]: string;
  [STORAGE_KEYS.ONBOARDING_TARGETS]: string;
  [STORAGE_KEYS.ONBOARDING_FIRST_HABIT]: string;
  [STORAGE_KEYS.NOTIFICATION_REMINDER_TIME]: string;
};

type KeysOfType<Value> = {
  [Key in StorageKey]: StorageSchema[Key] extends Value ? Key : never;
}[StorageKey];

export type StringStorageKey = KeysOfType<string>;
export type BooleanStorageKey = KeysOfType<boolean>;
export type NumberStorageKey = KeysOfType<number>;
