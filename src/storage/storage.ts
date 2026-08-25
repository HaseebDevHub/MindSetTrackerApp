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
    return execute('setString', false, instance => {
      instance.set(key, value);
      return true;
    });
  },

  getBoolean<Key extends BooleanStorageKey>(key: Key): boolean | undefined {
    return execute('getBoolean', undefined, instance =>
      instance.getBoolean(key),
    );
  },

  setBoolean<Key extends BooleanStorageKey>(key: Key, value: boolean) {
    return execute('setBoolean', false, instance => {
      instance.set(key, value);
      return true;
    });
  },

  getNumber<Key extends NumberStorageKey>(key: Key): number | undefined {
    return execute('getNumber', undefined, instance => instance.getNumber(key));
  },

  setNumber<Key extends NumberStorageKey>(key: Key, value: number) {
    return execute('setNumber', false, instance => {
      instance.set(key, value);
      return true;
    });
  },

  remove(key: StorageKey) {
    return execute('remove', false, instance => instance.remove(key));
  },

  has(key: StorageKey) {
    return execute('has', false, instance => instance.contains(key));
  },
};
