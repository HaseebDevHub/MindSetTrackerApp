import type { HabitItem } from '../types/models';
import type {
  OnboardingData,
  OnboardingDraft,
  OnboardingStep,
  OnboardingTargets,
} from '../types/onboarding';
import {
  isValidHabit,
  isValidLocalTime,
  isValidOnboardingTargets,
} from '../utils/onboardingValidation';
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

function getWakeUpTime() {
  const value = storage.getString(STORAGE_KEYS.ONBOARDING_WAKE_UP_TIME);
  return isValidLocalTime(value) ? value : undefined;
}

function setWakeUpTime(value: string) {
  return (
    isValidLocalTime(value) &&
    storage.setString(STORAGE_KEYS.ONBOARDING_WAKE_UP_TIME, value)
  );
}

function getDayEndTime() {
  const value = storage.getString(STORAGE_KEYS.ONBOARDING_DAY_END_TIME);
  return isValidLocalTime(value) ? value : undefined;
}

function setDayEndTime(value: string) {
  return (
    isValidLocalTime(value) &&
    storage.setString(STORAGE_KEYS.ONBOARDING_DAY_END_TIME, value)
  );
}

function getTargets(): OnboardingTargets | undefined {
  const value = parseJson(
    storage.getString(STORAGE_KEYS.ONBOARDING_TARGETS),
  );
  return isValidOnboardingTargets(value) ? value : undefined;
}

function setTargets(value: OnboardingTargets) {
  return (
    isValidOnboardingTargets(value) &&
    storage.setString(STORAGE_KEYS.ONBOARDING_TARGETS, JSON.stringify(value))
  );
}

function getFirstHabit(): HabitItem | undefined {
  const value = parseJson(
    storage.getString(STORAGE_KEYS.ONBOARDING_FIRST_HABIT),
  );
  return isValidHabit(value) ? value : undefined;
}

function setFirstHabit(value: HabitItem) {
  return (
    isValidHabit(value) &&
    storage.setString(
      STORAGE_KEYS.ONBOARDING_FIRST_HABIT,
      JSON.stringify(value),
    )
  );
}

function getDraft(): OnboardingDraft {
  return {
    wakeUpTime: getWakeUpTime(),
    dayEndTime: getDayEndTime(),
    targets: getTargets(),
    firstHabit: getFirstHabit(),
  };
}

function getData(): OnboardingData | undefined {
  const draft = getDraft();
  if (
    !draft.wakeUpTime ||
    !draft.dayEndTime ||
    !draft.targets ||
    !draft.firstHabit
  ) {
    return undefined;
  }

  return draft as OnboardingData;
}

function isCompleted() {
  return (
    storage.getBoolean(STORAGE_KEYS.ONBOARDING_COMPLETED) === true &&
    getData() !== undefined
  );
}

function getResumeStep(): OnboardingStep {
  if (isCompleted()) return 'completed';

  const draft = getDraft();
  if (!draft.wakeUpTime) return 'WakeTime';
  if (!draft.dayEndTime) return 'BedTime';
  if (!draft.targets) return 'Goals';
  if (!draft.firstHabit) return 'FirstHabit';
  return 'ValueProposition';
}

function complete() {
  if (!getData()) return false;
  return storage.setBoolean(STORAGE_KEYS.ONBOARDING_COMPLETED, true);
}

function resetOnboarding() {
  const keys = [
    STORAGE_KEYS.ONBOARDING_COMPLETED,
    STORAGE_KEYS.ONBOARDING_WAKE_UP_TIME,
    STORAGE_KEYS.ONBOARDING_DAY_END_TIME,
    STORAGE_KEYS.ONBOARDING_TARGETS,
    STORAGE_KEYS.ONBOARDING_FIRST_HABIT,
  ];
  keys.forEach(key => storage.remove(key));
}

export const onboardingStorage = {
  getWakeUpTime,
  setWakeUpTime,
  getDayEndTime,
  setDayEndTime,
  getTargets,
  setTargets,
  getFirstHabit,
  setFirstHabit,
  getDraft,
  getData,
  getResumeStep,
  isCompleted,
  complete,
  resetOnboarding,
};
