export const STORAGE_KEYS = {
  THEME_MODE: 'themeMode',
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];

export type StorageSchema = {
  [STORAGE_KEYS.THEME_MODE]: string;
};

type KeysOfType<Value> = {
  [Key in StorageKey]: StorageSchema[Key] extends Value ? Key : never;
}[StorageKey];

export type StringStorageKey = KeysOfType<string>;
export type BooleanStorageKey = KeysOfType<boolean>;
export type NumberStorageKey = KeysOfType<number>;
