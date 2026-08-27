export type TimeOfDay = 'MORNING' | 'AFTERNOON' | 'EVENING' | 'ANYTIME';
export type TodayFilter = 'ALL' | Exclude<TimeOfDay, 'ANYTIME'>;
export type HabitFrequency = 'EVERYDAY' | 'WEEKDAYS';
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
  frequency?: HabitFrequency;
  createdAt?: string;
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

export interface Journey {
  id: string;
  title: string;
  duration: string;
  description: string;
  habits: string[];
  colors: [string, string];
}

export type RootStackParamList = {
  Onboarding: undefined;
  Main: undefined;
};

export type MainTabParamList = {
  Today: undefined;
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
  TodayHome: undefined;
  CreateHabit: { habitId?: string } | undefined;
  HabitDetail: { habitId: string };
};

export type JourneyStackParamList = {
  JourneyHome: undefined;
  JourneyDetail: { journeyId: string };
};

export type MeStackParamList = {
  MeHome: undefined;
  Premium: undefined;
  Notifications: undefined;
  GeneralSettings: undefined;
  Language: undefined;
  Feedback: undefined;
};
