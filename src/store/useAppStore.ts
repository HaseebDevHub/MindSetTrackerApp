import { create } from 'zustand';
import { ACHIEVEMENTS } from '../constants/achievements';
import { achievementStorage } from '../storage/achievementStorage';
import { completionStorage } from '../storage/completionStorage';
import { habitStorage } from '../storage/habitStorage';
import { onboardingStorage } from '../storage/onboardingStorage';
import type {
  Celebration,
  HabitItem,
  TodayFilter,
  UserStats,
} from '../types/models';
import type { OnboardingTarget } from '../types/onboarding';
import { getDateStatus, toDateKey } from '../utils/dates';
import {
  calculateHabitStreak,
  calculateStats,
  getDailyProgress,
} from '../utils/habitAnalytics';
import { DEFAULT_WAKE_UP_TIME } from '../utils/time';

const today = new Date();
const todayKey = toDateKey(today);

interface AppState {
  wakeTime: string;
  endTime: string;
  targets: OnboardingTarget[];
  firstHabit?: string;
  onboardingComplete: boolean;
  isPremium: boolean;
  selectedDate: string;
  selectedFilter: TodayFilter;
  habits: HabitItem[];
  stats: UserStats;
  celebration?: Celebration;
  setWakeTime: (value: string) => void;
  setEndTime: (value: string) => void;
  toggleTarget: (value: OnboardingTarget) => void;
  setFirstHabit: (value?: string) => void;
  saveWakeTime: () => boolean;
  saveEndTime: () => boolean;
  saveTargets: () => boolean;
  saveFirstHabit: (title?: string) => boolean;
  finishOnboarding: () => boolean;
  setPremium: (value: boolean) => void;
  setSelectedDate: (value: string) => void;
  setSelectedFilter: (value: TodayFilter) => void;
  toggleHabit: (id: string, date: string) => void;
  addHabit: (
    habit: Omit<HabitItem, 'id' | 'completedDates' | 'streakCount'>,
  ) => void;
  updateHabit: (id: string, updates: Partial<HabitItem>) => void;
  dismissCelebration: () => void;
}

const onboardingDraft = onboardingStorage.getDraft();
const storedFirstHabit = onboardingDraft.firstHabit;
const hadStoredHabitCollection = habitStorage.hasStoredHabits();
const storedHabits = habitStorage.getHabits();
const hydratedHabits = completionStorage.hydrateHabits(storedHabits);
const initialStoredHabits =
  !hadStoredHabitCollection &&
  onboardingStorage.isCompleted() &&
  storedFirstHabit &&
  !hydratedHabits.some(
    habit => habit.title.toLowerCase() === storedFirstHabit.title.toLowerCase(),
  )
    ? [...hydratedHabits, storedFirstHabit]
    : hydratedHabits;

if (!hadStoredHabitCollection) habitStorage.setHabits(initialStoredHabits);

function withDerivedStreaks(habits: HabitItem[]) {
  return habits.map(habit => ({
    ...habit,
    frequency: habit.frequency ?? ('EVERYDAY' as const),
    createdAt:
      habit.createdAt ?? habit.completedDates.slice().sort()[0] ?? todayKey,
    streakCount: calculateHabitStreak(habit, todayKey),
  }));
}

const initialHabitsWithStreaks = withDerivedStreaks(initialStoredHabits);
const storedUnlocks = achievementStorage.getUnlocks();
const initialStatsCandidate = calculateStats(
  initialHabitsWithStreaks,
  todayKey,
  storedUnlocks.map(unlock => unlock.id),
);
const initialUnlocks = achievementStorage.evaluate(
  initialStatsCandidate,
  false,
).unlocks;
const initialStats = calculateStats(
  initialHabitsWithStreaks,
  todayKey,
  initialUnlocks.map(unlock => unlock.id),
);

function derivedState(habits: HabitItem[], unlockedAchievements: string[]) {
  const nextHabits = withDerivedStreaks(habits);
  return {
    habits: nextHabits,
    stats: calculateStats(nextHabits, todayKey, unlockedAchievements),
  };
}

export const useAppStore = create<AppState>((set, get) => ({
  wakeTime: onboardingDraft.wakeUpTime ?? DEFAULT_WAKE_UP_TIME,
  endTime: onboardingDraft.dayEndTime ?? '22:00',
  targets: onboardingDraft.targets ?? [],
  firstHabit: storedFirstHabit?.title,
  onboardingComplete: onboardingStorage.isCompleted(),
  isPremium: false,
  selectedDate: toDateKey(today),
  selectedFilter: 'MORNING',
  habits: initialHabitsWithStreaks,
  stats: initialStats,
  setWakeTime: wakeTime => set({ wakeTime }),
  setEndTime: endTime => set({ endTime }),
  toggleTarget: target =>
    set(state => ({
      targets: state.targets.includes(target)
        ? state.targets.filter(item => item !== target)
        : [...state.targets, target],
    })),
  setFirstHabit: firstHabit => set({ firstHabit }),
  saveWakeTime: () => onboardingStorage.setWakeUpTime(get().wakeTime),
  saveEndTime: () => onboardingStorage.setDayEndTime(get().endTime),
  saveTargets: () => onboardingStorage.setTargets(get().targets),
  saveFirstHabit: candidate => {
    const title = candidate?.trim() ?? get().firstHabit?.trim();
    if (!title) return false;
    set({ firstHabit: title });

    const existing = onboardingStorage.getFirstHabit();
    const baseHabit: HabitItem =
      existing?.title === title
        ? existing
        : {
            id: `onboarding-habit-${Date.now()}`,
            title,
            timeOfDay: 'MORNING',
            completedDates: [],
            streakCount: 0,
            iconName: 'Sparkles',
          };
    const habit: HabitItem = {
      ...baseHabit,
      reminderEnabled: baseHabit.reminderEnabled ?? false,
      reminderTime: baseHabit.reminderTime ?? get().wakeTime,
      frequency: baseHabit.frequency ?? 'EVERYDAY',
      createdAt: baseHabit.createdAt ?? todayKey,
    };
    return onboardingStorage.setFirstHabit(habit);
  },
  finishOnboarding: () => {
    if (!onboardingStorage.complete()) return false;

    const firstHabit = onboardingStorage.getFirstHabit();
    set(state => {
      const habits =
        firstHabit &&
        !state.habits.some(
          habit =>
            habit.id === firstHabit.id ||
            habit.title.toLowerCase() === firstHabit.title.toLowerCase(),
        )
          ? [...state.habits, firstHabit]
          : state.habits;
      habitStorage.setHabits(habits);
      return {
        onboardingComplete: true,
        ...derivedState(habits, state.stats.unlockedAchievements),
      };
    });
    return true;
  },
  setPremium: isPremium => set({ isPremium }),
  setSelectedDate: selectedDate => set({ selectedDate }),
  setSelectedFilter: selectedFilter => set({ selectedFilter }),
  toggleHabit: (id, date) =>
    set(state => {
      if (getDateStatus(date) === 'future') return state;
      const selectedHabit = state.habits.find(habit => habit.id === id);
      if (!selectedHabit) return state;
      const completed = !selectedHabit.completedDates.includes(date);
      if (!completionStorage.setHabitCompletion(id, date, completed))
        return state;

      const habits = state.habits.map(habit =>
        habit.id !== id
          ? habit
          : {
              ...habit,
              completedDates: habit.completedDates.includes(date)
                ? habit.completedDates.filter(key => key !== date)
                : [...habit.completedDates, date],
            },
      );
      const streakHabits = withDerivedStreaks(habits);
      const statsCandidate = calculateStats(
        streakHabits,
        todayKey,
        state.stats.unlockedAchievements,
      );
      const achievementResult = achievementStorage.evaluate(
        statsCandidate,
        true,
      );
      const unlockedIds = achievementResult.unlocks.map(unlock => unlock.id);
      const stats = calculateStats(streakHabits, todayKey, unlockedIds);
      const perfect =
        completed &&
        getDailyProgress(streakHabits, date).isPerfect;
      const newlyUnlocked = achievementResult.newlyUnlocked[0];
      const definition = newlyUnlocked
        ? ACHIEVEMENTS.find(item => item.id === newlyUnlocked.id)
        : undefined;
      const isNewPerfectDay = perfect
        ? achievementStorage.claimPerfectDay(date)
        : false;
      const celebration = definition
        ? {
            id: newlyUnlocked!.id,
            title: definition.title,
            subtitle: 'NEW ACHIEVEMENT',
          }
        : isNewPerfectDay
        ? {
            id: `perfect-day-${date}`,
            title: 'Perfect Day',
            subtitle: 'ALL HABITS FINISHED',
          }
        : state.celebration;
      return { habits: streakHabits, stats, celebration };
    }),
  addHabit: habit =>
    set(state => {
      const habits = [
        ...state.habits,
        {
          ...habit,
          id: `habit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          completedDates: [],
          streakCount: 0,
          frequency: habit.frequency ?? 'EVERYDAY',
          createdAt: habit.createdAt ?? todayKey,
        },
      ];
      if (!habitStorage.setHabits(habits)) return state;
      return derivedState(habits, state.stats.unlockedAchievements);
    }),
  updateHabit: (id, updates) =>
    set(state => {
      const habits = state.habits.map(habit =>
        habit.id === id ? { ...habit, ...updates } : habit,
      );
      if (!habitStorage.setHabits(habits)) return state;
      return derivedState(habits, state.stats.unlockedAchievements);
    }),
  dismissCelebration: () => set({ celebration: undefined }),
}));
