import { ACHIEVEMENTS, achievementMetric } from '../constants/achievements';
import type { AchievementUnlock, UserStats } from '../types/models';
import { isDateKey } from '../utils/dates';
import { storage } from './storage';
import { STORAGE_KEYS } from './storageKeys';

function parseJson(value: string | undefined): unknown {
  if (!value) return undefined;
  try {
    return JSON.parse(value);
  } catch {
    return undefined;
  }
}

function isUnlock(value: unknown): value is AchievementUnlock {
  if (!value || typeof value !== 'object') return false;
  const unlock = value as Partial<AchievementUnlock>;
  return (
    typeof unlock.id === 'string' &&
    ACHIEVEMENTS.some(definition => definition.id === unlock.id) &&
    typeof unlock.unlockedAt === 'string' &&
    !Number.isNaN(Date.parse(unlock.unlockedAt))
  );
}

function getUnlocks() {
  const parsed = parseJson(storage.getString(STORAGE_KEYS.ACHIEVEMENT_UNLOCKS));
  if (!Array.isArray(parsed)) return [];
  const byId = new Map(
    parsed.filter(isUnlock).map(unlock => [unlock.id, unlock]),
  );
  return [...byId.values()].sort((a, b) =>
    b.unlockedAt.localeCompare(a.unlockedAt),
  );
}

function evaluate(stats: UserStats, celebrateNew: boolean) {
  const existing = getUnlocks();
  const existingIds = new Set(existing.map(unlock => unlock.id));
  const timestamp = new Date().toISOString();
  const newlyUnlocked = ACHIEVEMENTS.filter(
    definition =>
      !existingIds.has(definition.id) &&
      achievementMetric(stats, definition.category) >= definition.threshold,
  ).map(definition => ({ id: definition.id, unlockedAt: timestamp }));
  const unlocks = [...newlyUnlocked, ...existing];
  if (newlyUnlocked.length) {
    storage.setString(
      STORAGE_KEYS.ACHIEVEMENT_UNLOCKS,
      JSON.stringify(unlocks),
    );
  }
  return { unlocks, newlyUnlocked: celebrateNew ? newlyUnlocked : [] };
}

function getCelebratedPerfectDays() {
  const parsed = parseJson(
    storage.getString(STORAGE_KEYS.CELEBRATED_PERFECT_DAYS),
  );
  return Array.isArray(parsed)
    ? [...new Set(parsed.filter(isDateKey))].sort()
    : [];
}

function claimPerfectDay(date: string) {
  if (!isDateKey(date)) return false;
  const dates = getCelebratedPerfectDays();
  if (dates.includes(date)) return false;
  return storage.setString(
    STORAGE_KEYS.CELEBRATED_PERFECT_DAYS,
    JSON.stringify([...dates, date].sort()),
  );
}

export const achievementStorage = { getUnlocks, evaluate, claimPerfectDay };
