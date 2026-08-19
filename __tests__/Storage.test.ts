import { storage } from '../src/storage/storage';
import { STORAGE_KEYS } from '../src/storage/storageKeys';

describe('storage service', () => {
  beforeEach(() => {
    storage.remove(STORAGE_KEYS.THEME_MODE);
  });

  test('writes, reads, updates, checks, and removes the theme preference', () => {
    expect(storage.has(STORAGE_KEYS.THEME_MODE)).toBe(false);
    expect(storage.getString(STORAGE_KEYS.THEME_MODE)).toBeUndefined();

    storage.setString(STORAGE_KEYS.THEME_MODE, 'light');
    expect(storage.has(STORAGE_KEYS.THEME_MODE)).toBe(true);
    expect(storage.getString(STORAGE_KEYS.THEME_MODE)).toBe('light');

    storage.setString(STORAGE_KEYS.THEME_MODE, 'dark');
    expect(storage.getString(STORAGE_KEYS.THEME_MODE)).toBe('dark');

    expect(storage.remove(STORAGE_KEYS.THEME_MODE)).toBe(true);
    expect(storage.has(STORAGE_KEYS.THEME_MODE)).toBe(false);
  });
});
