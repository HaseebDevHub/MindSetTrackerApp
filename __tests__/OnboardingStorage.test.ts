import { onboardingStorage } from '../src/storage/onboardingStorage';
import type { HabitItem } from '../src/types/models';
import type { OnboardingTargets } from '../src/types/onboarding';

const targets: OnboardingTargets = ['Live healthier', 'Be more focused'];
const firstHabit: HabitItem = {
  id: 'onboarding-habit-test',
  title: 'Read for ten minutes',
  timeOfDay: 'MORNING',
  completedDates: [],
  streakCount: 0,
  iconName: 'Sparkles',
};

describe('onboarding storage', () => {
  beforeEach(() => onboardingStorage.resetOnboarding());

  afterAll(() => onboardingStorage.resetOnboarding());

  test('saves each valid step and resumes at the first missing step', () => {
    expect(onboardingStorage.getResumeStep()).toBe('WakeTime');

    expect(onboardingStorage.setWakeUpTime('07:00')).toBe(true);
    expect(onboardingStorage.getWakeUpTime()).toBe('07:00');
    expect(onboardingStorage.getResumeStep()).toBe('BedTime');

    expect(onboardingStorage.setDayEndTime('23:00')).toBe(true);
    expect(onboardingStorage.getResumeStep()).toBe('Goals');

    expect(onboardingStorage.setTargets(targets)).toBe(true);
    expect(onboardingStorage.getTargets()).toEqual(targets);
    expect(onboardingStorage.getResumeStep()).toBe('FirstHabit');

    expect(onboardingStorage.setFirstHabit(firstHabit)).toBe(true);
    expect(onboardingStorage.getFirstHabit()).toEqual(firstHabit);
    expect(onboardingStorage.getResumeStep()).toBe('ValueProposition');
  });

  test('rejects invalid step data', () => {
    expect(onboardingStorage.setWakeUpTime('7:00 AM')).toBe(false);
    expect(onboardingStorage.setDayEndTime('24:00')).toBe(false);
    expect(onboardingStorage.setTargets([])).toBe(false);
    expect(onboardingStorage.getDraft()).toEqual({
      wakeUpTime: undefined,
      dayEndTime: undefined,
      targets: undefined,
      firstHabit: undefined,
    });
  });

  test('only completes after every required value has been saved', () => {
    expect(onboardingStorage.complete()).toBe(false);
    expect(onboardingStorage.isCompleted()).toBe(false);

    onboardingStorage.setWakeUpTime('06:30');
    onboardingStorage.setDayEndTime('22:30');
    onboardingStorage.setTargets(targets);
    onboardingStorage.setFirstHabit(firstHabit);

    expect(onboardingStorage.complete()).toBe(true);
    expect(onboardingStorage.isCompleted()).toBe(true);
    expect(onboardingStorage.getResumeStep()).toBe('completed');
    expect(onboardingStorage.getData()).toEqual({
      wakeUpTime: '06:30',
      dayEndTime: '22:30',
      targets,
      firstHabit,
    });
  });

  test('reset removes completion and all onboarding values', () => {
    onboardingStorage.setWakeUpTime('06:30');
    onboardingStorage.setDayEndTime('22:30');
    onboardingStorage.setTargets(targets);
    onboardingStorage.setFirstHabit(firstHabit);
    onboardingStorage.complete();

    onboardingStorage.resetOnboarding();

    expect(onboardingStorage.isCompleted()).toBe(false);
    expect(onboardingStorage.getResumeStep()).toBe('WakeTime');
    expect(onboardingStorage.getData()).toBeUndefined();
  });
});
