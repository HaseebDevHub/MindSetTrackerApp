import type {
  ActiveJourneyItem,
  HabitActionType,
  HabitItem,
  JourneyId,
} from '../../types/models';

export type HabitCreateInput = Omit<
  HabitItem,
  'id' | 'completedDates' | 'streakCount'
>;

export type HabitUpdateInput = Partial<HabitCreateInput>;

export interface HabitRepository {
  loadAllHabits(): Promise<HabitItem[]>;
  createHabit(habit: HabitCreateInput): Promise<HabitItem>;
  updateHabit(id: string, updates: HabitUpdateInput): Promise<boolean>;
  deleteHabit(id: string): Promise<boolean>;
  setArchived(
    id: string,
    archived: boolean,
    archivedAt?: string,
  ): Promise<boolean>;
  setHabitCompletion(
    habitId: string,
    dateKey: string,
    completed: boolean,
  ): Promise<boolean>;
  isHabitCompleted(habitId: string, dateKey: string): Promise<boolean>;
  setHabitAction(
    habitId: string,
    dateKey: string,
    actionType: HabitActionType,
    value?: number,
  ): Promise<boolean>;
  removeHabitAction(
    habitId: string,
    dateKey: string,
    actionType: HabitActionType,
  ): Promise<boolean>;
  importLegacyHabits(habits: HabitItem[]): Promise<void>;
  ensureOnboardingHabit(habit: HabitItem): Promise<string>;
}

export interface JourneyRepository {
  loadActiveJourneys(): Promise<ActiveJourneyItem[]>;
  startJourney(
    journeyId: JourneyId,
    startedDateKey: string,
  ): Promise<ActiveJourneyItem>;
  setTaskCompletion(
    activeJourneyId: string,
    taskId: string,
    dateKey: string,
    completed: boolean,
  ): Promise<boolean>;
  removeActiveJourney(
    activeJourneyId: string,
    removedDateKey: string,
  ): Promise<boolean>;
}
