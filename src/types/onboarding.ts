import type { HabitItem } from './models';

export const ONBOARDING_TARGETS = [
  'Live healthier',
  'Relieve pressure',
  'Try new things',
  'Be more focused',
  'Better relationship',
  'Sleep better',
] as const;

export type OnboardingTarget = (typeof ONBOARDING_TARGETS)[number];
export type OnboardingTargets = OnboardingTarget[];

export interface OnboardingData {
  wakeUpTime: string;
  dayEndTime: string;
  targets: OnboardingTargets;
  firstHabit: HabitItem;
}

export type OnboardingStep =
  | 'WakeTime'
  | 'BedTime'
  | 'Goals'
  | 'FirstHabit'
  | 'ValueProposition'
  | 'completed';

export type OnboardingDraft = Partial<OnboardingData>;
