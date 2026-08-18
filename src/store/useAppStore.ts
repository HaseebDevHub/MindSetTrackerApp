import {create} from 'zustand';
import type {HabitItem, TimeOfDay} from '../types/models';
import {addDays, toDateKey} from '../utils/dates';

const today = new Date();
const initialHabits: HabitItem[] = [
  {id: 'water', title: 'Drink 8 cups of water', timeOfDay: 'MORNING', completedDates: [toDateKey(addDays(today, -1))], streakCount: 1, iconName: 'Droplets'},
  {id: 'walk', title: 'Morning walk', timeOfDay: 'MORNING', completedDates: [toDateKey(today), toDateKey(addDays(today, -1))], streakCount: 2, iconName: 'Footprints'},
  {id: 'read', title: 'Read 10 pages', timeOfDay: 'AFTERNOON', completedDates: [], streakCount: 0, iconName: 'BookOpen'},
  {id: 'meditate', title: 'Meditate for 10 minutes', timeOfDay: 'EVENING', completedDates: [toDateKey(addDays(today, -2))], streakCount: 0, iconName: 'Brain'},
  {id: 'sleep', title: 'Sleep before 11 PM', timeOfDay: 'ANYTIME', completedDates: [], streakCount: 0, iconName: 'Moon'},
];

interface AppState {
  wakeTime: string;
  endTime: string;
  targets: string[];
  firstHabit?: string;
  onboardingComplete: boolean;
  isPremium: boolean;
  selectedDate: string;
  selectedFilter: TimeOfDay;
  habits: HabitItem[];
  setWakeTime: (value: string) => void;
  setEndTime: (value: string) => void;
  toggleTarget: (value: string) => void;
  setFirstHabit: (value?: string) => void;
  finishOnboarding: () => void;
  setPremium: (value: boolean) => void;
  setSelectedDate: (value: string) => void;
  setSelectedFilter: (value: TimeOfDay) => void;
  toggleHabit: (id: string, date: string) => void;
  addHabit: (habit: Omit<HabitItem, 'id' | 'completedDates' | 'streakCount'>) => void;
  updateHabit: (id: string, updates: Partial<HabitItem>) => void;
}

export const useAppStore = create<AppState>(set => ({
  wakeTime: '08:00', endTime: '22:00', targets: [], onboardingComplete: false,
  isPremium: false, selectedDate: toDateKey(today), selectedFilter: 'MORNING', habits: initialHabits,
  setWakeTime: wakeTime => set({wakeTime}),
  setEndTime: endTime => set({endTime}),
  toggleTarget: target => set(state => ({targets: state.targets.includes(target) ? state.targets.filter(item => item !== target) : [...state.targets, target]})),
  setFirstHabit: firstHabit => set({firstHabit}),
  finishOnboarding: () => set(state => {
    const title = state.firstHabit?.trim();
    const exists = title ? state.habits.some(habit => habit.title.toLowerCase() === title.toLowerCase()) : true;
    return {
      onboardingComplete: true,
      habits: title && !exists ? [...state.habits, {id: `habit-${Date.now()}`, title, timeOfDay: 'MORNING', completedDates: [], streakCount: 0, iconName: 'Sparkles'}] : state.habits,
    };
  }),
  setPremium: isPremium => set({isPremium}),
  setSelectedDate: selectedDate => set({selectedDate}),
  setSelectedFilter: selectedFilter => set({selectedFilter}),
  toggleHabit: (id, date) => set(state => ({habits: state.habits.map(habit => habit.id !== id ? habit : {...habit, completedDates: habit.completedDates.includes(date) ? habit.completedDates.filter(key => key !== date) : [...habit.completedDates, date]})})),
  addHabit: habit => set(state => ({habits: [...state.habits, {...habit, id: `habit-${Date.now()}`, completedDates: [], streakCount: 0}]})),
  updateHabit: (id, updates) => set(state => ({habits: state.habits.map(habit => habit.id === id ? {...habit, ...updates} : habit)})),
}));
