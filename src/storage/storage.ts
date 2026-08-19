import { createMMKV, type MMKV } from 'react-native-mmkv';
import type {
  BooleanStorageKey,
  NumberStorageKey,
  StorageKey,
  StorageSchema,
  StringStorageKey,
} from './storageKeys';

const STORAGE_ID = 'mindset-tracker-preferences';

function logStorageError(operation: string, error: unknown) {
  if (__DEV__) {
    console.warn(`[storage] ${operation} failed`, error);
  }
}

function initializeStorage(): MMKV | undefined {
  try {
    return createMMKV({ id: STORAGE_ID });
  } catch (error) {
    logStorageError('initialization', error);
    return undefined;
  }
}

const mmkv = initializeStorage();

function execute<T>(
  operation: string,
  fallback: T,
  action: (instance: MMKV) => T,
): T {
  if (!mmkv) return fallback;

  try {
    return action(mmkv);
  } catch (error) {
    logStorageError(operation, error);
    return fallback;
  }
}

export const storage = {
  getString<Key extends StringStorageKey>(
    key: Key,
  ): StorageSchema[Key] | undefined {
    return execute('getString', undefined, instance => instance.getString(key));
  },

  setString<Key extends StringStorageKey>(key: Key, value: StorageSchema[Key]) {
    execute('setString', undefined, instance => instance.set(key, value));
  },

  getBoolean<Key extends BooleanStorageKey>(key: Key): boolean | undefined {
    return execute('getBoolean', undefined, instance =>
      instance.getBoolean(key),
    );
  },

  setBoolean<Key extends BooleanStorageKey>(key: Key, value: boolean) {
    execute('setBoolean', undefined, instance => instance.set(key, value));
  },

  getNumber<Key extends NumberStorageKey>(key: Key): number | undefined {
    return execute('getNumber', undefined, instance => instance.getNumber(key));
  },

  setNumber<Key extends NumberStorageKey>(key: Key, value: number) {
    execute('setNumber', undefined, instance => instance.set(key, value));
  },

  remove(key: StorageKey) {
    return execute('remove', false, instance => instance.remove(key));
  },

  has(key: StorageKey) {
    return execute('has', false, instance => instance.contains(key));
  },
};
