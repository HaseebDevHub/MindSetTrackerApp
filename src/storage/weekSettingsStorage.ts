import type { WeekStartsOn } from '../types/models';
import { storage } from './storage';
import { STORAGE_KEYS } from './storageKeys';

export const DEFAULT_WEEK_START: WeekStartsOn = 0;

function isWeekStart(value: unknown): value is WeekStartsOn {
  return value === 0 || value === 1;
}

export const weekSettingsStorage = {
  getWeekStartsOn(): WeekStartsOn {
    const stored = storage.getNumber(STORAGE_KEYS.GENERAL_WEEK_START);
    return isWeekStart(stored) ? stored : DEFAULT_WEEK_START;
  },

  setWeekStartsOn(value: WeekStartsOn) {
    return storage.setNumber(STORAGE_KEYS.GENERAL_WEEK_START, value);
  },
};
