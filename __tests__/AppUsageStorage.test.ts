import { appUsageStorage } from '../src/storage/appUsageStorage';
import { storage } from '../src/storage/storage';
import { STORAGE_KEYS } from '../src/storage/storageKeys';

describe('app usage storage', () => {
  beforeEach(() => storage.remove(STORAGE_KEYS.APP_STARTED_DATE));

  afterAll(() => storage.remove(STORAGE_KEYS.APP_STARTED_DATE));

  test('initializes the first local date and preserves it on later launches', () => {
    expect(appUsageStorage.ensureStartedDate(new Date(2026, 8, 8, 23, 45))).toBe(
      '2026-09-08',
    );
    expect(appUsageStorage.ensureStartedDate(new Date(2026, 8, 12, 8))).toBe(
      '2026-09-08',
    );
    expect(appUsageStorage.getStartedDate()).toBe('2026-09-08');
  });

  test('repairs an invalid persisted value safely', () => {
    storage.setString(STORAGE_KEYS.APP_STARTED_DATE, 'not-a-date');

    expect(appUsageStorage.getStartedDate()).toBeUndefined();
    expect(appUsageStorage.ensureStartedDate(new Date(2027, 0, 2))).toBe(
      '2027-01-02',
    );
  });
});
