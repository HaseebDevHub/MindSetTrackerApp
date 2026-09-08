import { isDateKey, toDateKey } from '../utils/dates';
import { storage } from './storage';
import { STORAGE_KEYS } from './storageKeys';

function getStartedDate() {
  const value = storage.getString(STORAGE_KEYS.APP_STARTED_DATE);
  return isDateKey(value) ? value : undefined;
}

function ensureStartedDate(now = new Date()) {
  const existing = getStartedDate();
  if (existing) return existing;
  const dateKey = toDateKey(now);
  storage.setString(STORAGE_KEYS.APP_STARTED_DATE, dateKey);
  return dateKey;
}

export const appUsageStorage = {
  getStartedDate,
  ensureStartedDate,
};
