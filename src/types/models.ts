import type { NavigatorScreenParams } from '@react-navigation/native';
import type { TranslationKey } from '../localization/languages/english';

export type TimeOfDay = 'MORNING' | 'AFTERNOON' | 'EVENING' | 'ANYTIME';
export type TodayFilter = 'ALL' | TimeOfDay;
export type WeekStartsOn = 0 | 1;
export type HabitFrequency = 'EVERYDAY' | 'WEEKDAYS';
export type HabitType = 'REGULAR' | 'NEGATIVE' | 'ONE_TIME';
export type HabitScheduleMode =
  | 'EVERYDAY'
  | 'WEEKDAYS'
  | 'SPECIFIC_DAYS'
  | 'WEEKLY_QUOTA'
  | 'MONTHLY_QUOTA'
  | 'YEARLY_QUOTA'
  | 'ONE_TIME';
export type HabitGoalMode = 'OFF' | 'DURATION' | 'REPEAT';
export type HabitActionType = 'COMPLETION' | 'RELAPSE' | 'PROGRESS';

export type HabitProgressEntry = {
  dateKey: string;
  actionType: HabitActionType;
  value: number;
};
export type HistoryTab = 'Calendar' | 'All Habits' | 'Achievements';

export interface HabitItem {
  id: string;
  title: string;
  timeOfDay: TimeOfDay;
  completedDates: string[];
  streakCount: number;
  iconName: string;
  note?: string;
  reminderEnabled?: boolean;
  reminderTime?: string;
  archived?: boolean;
  archivedAt?: string;
  frequency?: HabitFrequency;
  createdAt?: string;
  habitType?: HabitType;
  color?: string;
  scheduleMode?: HabitScheduleMode;
  selectedWeekdays?: number[];
  quotaCount?: number;
  endDate?: string;
  targetDate?: string;
  goalMode?: HabitGoalMode;
  goalTarget?: number;
  goalUnit?: 'MINUTES' | 'REPS';
  motivationalText?: string;
  progressEntries?: HabitProgressEntry[];
}

export type UserStats = {
  currentStreak: number;
  bestStreak: number;
  habitsFinishedTotal: number;
  perfectDays: number;
  unlockedAchievements: string[];
};

export type AchievementCategory =
  | 'HABITS_FINISHED'
  | 'PERFECT_DAYS'
  | 'BEST_STREAK';

export type AchievementUnlock = {
  id: string;
  unlockedAt: string;
};

export type Celebration = {
  id: string;
  title: string;
  subtitle: string;
};

export type JourneyId =
  | 'walk'
  | 'sleep'
  | 'sugar'
  | 'meditation'
  | 'confidence'
  | 'fasting'
  | 'phone'
  | 'morning'
  | 'office';

export type JourneyTask = {
  id: string;
  title: string;
  titleKey: TranslationKey;
  subtitle: string;
  subtitleKey: TranslationKey;
  iconName: string;
};

export interface Journey {
  id: JourneyId;
  title: string;
  titleKey: TranslationKey;
  duration: string;
  durationDays: number;
  description: string;
  descriptionKey: TranslationKey;
  habits: JourneyTask[];
  colors: [string, string];
}

export type JourneyTaskCompletion = {
  taskId: string;
  dateKey: string;
};

export type ActiveJourneyItem = {
  id: string;
  journeyId: JourneyId;
  startedDateKey: string;
  isActive: boolean;
  removedDateKey?: string;
  taskCompletions: JourneyTaskCompletion[];
};

export type RootStackParamList = {
  Onboarding: undefined;
  Splash: undefined;
  Main: undefined;
};

export type MainTabParamList = {
  Today: NavigatorScreenParams<TodayStackParamList> | undefined;
  Journey: undefined;
  History: { initialTab?: HistoryTab; tabRequestId?: number } | undefined;
  Me: undefined;
};

export type OnboardingStackParamList = {
  WakeTime: undefined;
  BedTime: undefined;
  Goals: undefined;
  FirstHabit: undefined;
  PlanGenerator: undefined;
  ValueProposition: undefined;
};

export type TodayStackParamList = {
  TodayHome:
    | {
        toastMessage?: string;
        toastRequestId?: number;
        dateFocusRequestId?: number;
      }
    | undefined;
  CreateHabit: { habitId?: string } | undefined;
  HabitDetail: { habitId: string };
};

export type JourneyStackParamList = {
  JourneyHome: { toastMessage?: string; toastRequestId?: number } | undefined;
  JourneyDetail: { journeyId: JourneyId };
  ActiveJourney: { activeJourneyId: string };
};

export type MeStackParamList = {
  MeHome: undefined;
  Premium: undefined;
  Notifications: undefined;
  GeneralSettings: undefined;
  Language: undefined;
  Feedback: undefined;
};
