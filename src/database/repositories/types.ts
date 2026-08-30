import type { HabitItem } from '../../types/models';

export type HabitCreateInput = Omit<
  HabitItem,
  'id' | 'completedDates' | 'streakCount'
>;

export type HabitUpdateInput = Partial<HabitCreateInput>;

export interface HabitRepository {
  loadAllHabits(): Promise<HabitItem[]>;
  createHabit(habit: HabitCreateInput): Promise<HabitItem>;
  updateHabit(id: string, updates: HabitUpdateInput): Promise<boolean>;
  setArchived(id: string, archived: boolean): Promise<boolean>;
  setHabitCompletion(
    habitId: string,
    dateKey: string,
    completed: boolean,
  ): Promise<boolean>;
  isHabitCompleted(habitId: string, dateKey: string): Promise<boolean>;
  importLegacyHabits(habits: HabitItem[]): Promise<void>;
  ensureOnboardingHabit(habit: HabitItem): Promise<string>;
}
