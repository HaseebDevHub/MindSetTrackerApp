import { create } from 'zustand';
import { ACHIEVEMENTS } from '../constants/achievements';
import { migrateLegacyHabitData } from '../database/migrateLegacyHabitData';
import { habitRepository } from '../database/repositories/habitRepository';
import type {
  HabitCreateInput,
  HabitRepository,
  HabitUpdateInput,
} from '../database/repositories/types';
import { achievementStorage } from '../storage/achievementStorage';
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

const emptyStats = (unlockedAchievements: string[] = []): UserStats => ({
  currentStreak: 0,
  bestStreak: 0,
  habitsFinishedTotal: 0,
  perfectDays: 0,
  unlockedAchievements,
});

export interface AppState {
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
  isHydrating: boolean;
  isHydrated: boolean;
  hydrationError?: string;
  persistenceError?: string;
  initialize: () => Promise<boolean>;
  setWakeTime: (value: string) => void;
  setEndTime: (value: string) => void;
  toggleTarget: (value: OnboardingTarget) => void;
  setFirstHabit: (value?: string) => void;
  saveWakeTime: () => boolean;
  saveEndTime: () => boolean;
  saveTargets: () => boolean;
  saveFirstHabit: (title?: string) => boolean;
  finishOnboarding: () => Promise<boolean>;
  setPremium: (value: boolean) => void;
  setSelectedDate: (value: string) => void;
  setSelectedFilter: (value: TodayFilter) => void;
  toggleHabit: (id: string, date: string) => Promise<boolean>;
  addHabit: (habit: HabitCreateInput) => Promise<boolean>;
  updateHabit: (id: string, updates: HabitUpdateInput) => Promise<boolean>;
  setHabitArchived: (id: string, archived: boolean) => Promise<boolean>;
  dismissCelebration: () => void;
}

type StoreDependencies = {
  repository: HabitRepository;
  runLegacyMigration: (repository: HabitRepository) => Promise<unknown>;
  now: () => Date;
};

const defaultDependencies: StoreDependencies = {
  repository: habitRepository,
  runLegacyMigration: repository => migrateLegacyHabitData({ repository }),
  now: () => new Date(),
};

function logPersistenceError(operation: string, error: unknown) {
  if (__DEV__) console.error(`[habit persistence] ${operation} failed`, error);
}

export function createAppStore(
  dependencyOverrides: Partial<StoreDependencies> = {},
) {
  const dependencies = { ...defaultDependencies, ...dependencyOverrides };
  const onboardingDraft = onboardingStorage.getDraft();
  const storedFirstHabit = onboardingDraft.firstHabit;
  const initialDateKey = toDateKey(dependencies.now());
  const storedUnlockIds = achievementStorage
    .getUnlocks()
    .map(unlock => unlock.id);
  let initializationPromise: Promise<boolean> | undefined;
  let finishOnboardingPromise: Promise<boolean> | undefined;
  const toggleQueues = new Map<string, Promise<boolean>>();

  function withDerivedStreaks(habits: HabitItem[]) {
    const todayKey = toDateKey(dependencies.now());
    return habits.map(habit => ({
      ...habit,
      completedDates: [...new Set(habit.completedDates)].sort(),
      frequency: habit.frequency ?? ('EVERYDAY' as const),
      createdAt:
        habit.createdAt ?? habit.completedDates.slice().sort()[0] ?? todayKey,
      streakCount: calculateHabitStreak(habit, todayKey),
    }));
  }

  function derivedState(habits: HabitItem[], unlockedAchievements: string[]) {
    const nextHabits = withDerivedStreaks(habits);
    return {
      habits: nextHabits,
      stats: calculateStats(
        nextHabits,
        toDateKey(dependencies.now()),
        unlockedAchievements,
      ),
    };
  }

  return create<AppState>((set, get) => ({
    wakeTime: onboardingDraft.wakeUpTime ?? DEFAULT_WAKE_UP_TIME,
    endTime: onboardingDraft.dayEndTime ?? '22:00',
    targets: onboardingDraft.targets ?? [],
    firstHabit: storedFirstHabit?.title,
    onboardingComplete: onboardingStorage.isCompleted(),
    isPremium: false,
    selectedDate: initialDateKey,
    selectedFilter: 'MORNING',
    habits: [],
    stats: emptyStats(storedUnlockIds),
    isHydrating: false,
    isHydrated: false,
    initialize: async () => {
      if (get().isHydrated) return true;
      if (initializationPromise) return initializationPromise;

      initializationPromise = (async () => {
        set({
          isHydrating: true,
          hydrationError: undefined,
          persistenceError: undefined,
        });
        try {
          await dependencies.runLegacyMigration(dependencies.repository);
          const loadedHabits = await dependencies.repository.loadAllHabits();
          const streakHabits = withDerivedStreaks(loadedHabits);
          const statsCandidate = calculateStats(
            streakHabits,
            toDateKey(dependencies.now()),
            achievementStorage.getUnlocks().map(unlock => unlock.id),
          );
          const unlocks = achievementStorage.evaluate(
            statsCandidate,
            false,
          ).unlocks;
          set({
            ...derivedState(
              streakHabits,
              unlocks.map(unlock => unlock.id),
            ),
            isHydrating: false,
            isHydrated: true,
            hydrationError: undefined,
          });
          return true;
        } catch (error) {
          logPersistenceError('initialization', error);
          set({
            isHydrating: false,
            isHydrated: false,
            hydrationError:
              'Your habit data could not be loaded. Please try again.',
          });
          return false;
        } finally {
          initializationPromise = undefined;
        }
      })();
      return initializationPromise;
    },
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
        createdAt: baseHabit.createdAt ?? toDateKey(dependencies.now()),
      };
      return onboardingStorage.setFirstHabit(habit);
    },
    finishOnboarding: async () => {
      if (!get().isHydrated) return false;
      if (finishOnboardingPromise) return finishOnboardingPromise;
      finishOnboardingPromise = (async () => {
        const firstHabit = onboardingStorage.getFirstHabit();
        if (!firstHabit) return false;
        try {
          await dependencies.repository.ensureOnboardingHabit(firstHabit);
          if (!onboardingStorage.complete()) return false;
          const habits = await dependencies.repository.loadAllHabits();
          set(state => ({
            onboardingComplete: true,
            persistenceError: undefined,
            ...derivedState(habits, state.stats.unlockedAchievements),
          }));
          return true;
        } catch (error) {
          logPersistenceError('finish onboarding', error);
          set({ persistenceError: 'Your first habit could not be saved.' });
          return false;
        } finally {
          finishOnboardingPromise = undefined;
        }
      })();
      return finishOnboardingPromise;
    },
    setPremium: isPremium => set({ isPremium }),
    setSelectedDate: selectedDate => set({ selectedDate }),
    setSelectedFilter: selectedFilter => set({ selectedFilter }),
    toggleHabit: async (id, date) => {
      if (!get().isHydrated || getDateStatus(date) === 'future') return false;
      const key = `${id}\u0000${date}`;
      const previous = toggleQueues.get(key) ?? Promise.resolve(true);
      const operation = previous
        .catch(() => false)
        .then(async () => {
          const state = get();
          const selectedHabit = state.habits.find(habit => habit.id === id);
          if (!selectedHabit) return false;
          const completed = !selectedHabit.completedDates.includes(date);
          try {
            const persisted = await dependencies.repository.setHabitCompletion(
              id,
              date,
              completed,
            );
            if (!persisted) return false;

            set(currentState => {
              const habits = currentState.habits.map(habit =>
                habit.id !== id
                  ? habit
                  : {
                      ...habit,
                      completedDates: completed
                        ? [...new Set([...habit.completedDates, date])].sort()
                        : habit.completedDates.filter(
                            keyDate => keyDate !== date,
                          ),
                    },
              );
              const streakHabits = withDerivedStreaks(habits);
              const statsCandidate = calculateStats(
                streakHabits,
                toDateKey(dependencies.now()),
                currentState.stats.unlockedAchievements,
              );
              const achievementResult = achievementStorage.evaluate(
                statsCandidate,
                true,
              );
              const unlockedIds = achievementResult.unlocks.map(
                unlock => unlock.id,
              );
              const stats = calculateStats(
                streakHabits,
                toDateKey(dependencies.now()),
                unlockedIds,
              );
              const perfect =
                completed && getDailyProgress(streakHabits, date).isPerfect;
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
                : currentState.celebration;
              return {
                habits: streakHabits,
                stats,
                celebration,
                persistenceError: undefined,
              };
            });
            return true;
          } catch (error) {
            logPersistenceError('toggle completion', error);
            set({ persistenceError: 'The completion could not be saved.' });
            return false;
          }
        });
      toggleQueues.set(key, operation);
      operation.finally(() => {
        if (toggleQueues.get(key) === operation) toggleQueues.delete(key);
      });
      return operation;
    },
    addHabit: async habit => {
      if (!get().isHydrated) return false;
      try {
        const created = await dependencies.repository.createHabit({
          ...habit,
          frequency: habit.frequency ?? 'EVERYDAY',
          createdAt: habit.createdAt ?? toDateKey(dependencies.now()),
        });
        set(state => ({
          ...derivedState(
            [...state.habits, created],
            state.stats.unlockedAchievements,
          ),
          persistenceError: undefined,
        }));
        return true;
      } catch (error) {
        logPersistenceError('create habit', error);
        set({ persistenceError: 'The habit could not be created.' });
        return false;
      }
    },
    updateHabit: async (id, updates) => {
      if (!get().isHydrated || !get().habits.some(habit => habit.id === id)) {
        return false;
      }
      try {
        if (!(await dependencies.repository.updateHabit(id, updates))) {
          set({ persistenceError: 'The habit is no longer available.' });
          return false;
        }
        set(state => {
          const habits = state.habits.map(habit =>
            habit.id === id ? { ...habit, ...updates } : habit,
          );
          return {
            ...derivedState(habits, state.stats.unlockedAchievements),
            persistenceError: undefined,
          };
        });
        return true;
      } catch (error) {
        logPersistenceError('update habit', error);
        set({ persistenceError: 'The habit could not be updated.' });
        return false;
      }
    },
    setHabitArchived: async (id, archived) => {
      if (!get().isHydrated || !get().habits.some(habit => habit.id === id)) {
        return false;
      }
      try {
        if (!(await dependencies.repository.setArchived(id, archived))) {
          return false;
        }
        set(state => {
          const habits = state.habits.map(habit =>
            habit.id === id ? { ...habit, archived } : habit,
          );
          return {
            ...derivedState(habits, state.stats.unlockedAchievements),
            persistenceError: undefined,
          };
        });
        return true;
      } catch (error) {
        logPersistenceError('archive habit', error);
        set({ persistenceError: 'The habit could not be archived.' });
        return false;
      }
    },
    dismissCelebration: () => set({ celebration: undefined }),
  }));
}

export const useAppStore = createAppStore();
