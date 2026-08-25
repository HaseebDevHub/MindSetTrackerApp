import { create } from 'zustand';
import { onboardingStorage } from '../storage/onboardingStorage';
import type { HabitItem, TodayFilter } from '../types/models';
import type { OnboardingTarget } from '../types/onboarding';
import { addDays, toDateKey } from '../utils/dates';
import { DEFAULT_WAKE_UP_TIME } from '../utils/time';

const today = new Date();
const initialHabits: HabitItem[] = [
  {
    id: 'water',
    title: 'Drink 8 cups of water',
    timeOfDay: 'MORNING',
    completedDates: [toDateKey(addDays(today, -1))],
    streakCount: 1,
    iconName: 'Droplets',
  },
  {
    id: 'walk',
    title: 'Morning walk',
    timeOfDay: 'MORNING',
    completedDates: [toDateKey(today), toDateKey(addDays(today, -1))],
    streakCount: 2,
    iconName: 'Footprints',
  },
  {
    id: 'read',
    title: 'Read 10 pages',
    timeOfDay: 'AFTERNOON',
    completedDates: [],
    streakCount: 0,
    iconName: 'BookOpen',
  },
  {
    id: 'meditate',
    title: 'Meditate for 10 minutes',
    timeOfDay: 'EVENING',
    completedDates: [toDateKey(addDays(today, -2))],
    streakCount: 0,
    iconName: 'Brain',
  },
  {
    id: 'sleep',
    title: 'Sleep before 11 PM',
    timeOfDay: 'ANYTIME',
    completedDates: [],
    streakCount: 0,
    iconName: 'Moon',
  },
];

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
}

const onboardingDraft = onboardingStorage.getDraft();
const storedFirstHabit = onboardingDraft.firstHabit;
const initialStoredHabits =
  onboardingStorage.isCompleted() &&
  storedFirstHabit &&
  !initialHabits.some(
    habit => habit.title.toLowerCase() === storedFirstHabit.title.toLowerCase(),
  )
    ? [...initialHabits, storedFirstHabit]
    : initialHabits;

export const useAppStore = create<AppState>((set, get) => ({
  wakeTime: onboardingDraft.wakeUpTime ?? DEFAULT_WAKE_UP_TIME,
  endTime: onboardingDraft.dayEndTime ?? '22:00',
  targets: onboardingDraft.targets ?? [],
  firstHabit: storedFirstHabit?.title,
  onboardingComplete: onboardingStorage.isCompleted(),
  isPremium: false,
  selectedDate: toDateKey(today),
  selectedFilter: 'MORNING',
  habits: initialStoredHabits,
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
    };
    return onboardingStorage.setFirstHabit(habit);
  },
  finishOnboarding: () => {
    if (!onboardingStorage.complete()) return false;

    const firstHabit = onboardingStorage.getFirstHabit();
    set(state => ({
      onboardingComplete: true,
      habits:
        firstHabit &&
        !state.habits.some(
          habit =>
            habit.id === firstHabit.id ||
            habit.title.toLowerCase() === firstHabit.title.toLowerCase(),
        )
          ? [...state.habits, firstHabit]
          : state.habits,
    }));
    return true;
  },
  setPremium: isPremium => set({ isPremium }),
  setSelectedDate: selectedDate => set({ selectedDate }),
  setSelectedFilter: selectedFilter => set({ selectedFilter }),
  toggleHabit: (id, date) =>
    set(state => ({
      habits: state.habits.map(habit =>
        habit.id !== id
          ? habit
          : {
              ...habit,
              completedDates: habit.completedDates.includes(date)
                ? habit.completedDates.filter(key => key !== date)
                : [...habit.completedDates, date],
            },
      ),
    })),
  addHabit: habit =>
    set(state => ({
      habits: [
        ...state.habits,
        {
          ...habit,
          id: `habit-${Date.now()}`,
          completedDates: [],
          streakCount: 0,
        },
      ],
    })),
  updateHabit: (id, updates) =>
    set(state => ({
      habits: state.habits.map(habit =>
        habit.id === id ? { ...habit, ...updates } : habit,
      ),
    })),
}));
