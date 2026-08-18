export type TimeOfDay = 'MORNING' | 'AFTERNOON' | 'EVENING' | 'ANYTIME';

export interface HabitItem {
  id: string;
  title: string;
  timeOfDay: TimeOfDay;
  completedDates: string[];
  streakCount: number;
  iconName: string;
  note?: string;
  reminderEnabled?: boolean;
  archived?: boolean;
}

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
  CreateHabit: {habitId?: string} | undefined;
  HabitDetail: {habitId: string};
};

export type JourneyStackParamList = {
  JourneyHome: undefined;
  JourneyDetail: {journeyId: string};
};

export type MeStackParamList = {
  MeHome: undefined;
  Premium: undefined;
  Notifications: undefined;
  GeneralSettings: undefined;
  Language: undefined;
  Feedback: undefined;
};
