import { Ban, ListTodo, Repeat2 } from 'lucide-react-native';
import type { ViewStyle } from 'react-native';
import type { TranslationKey } from '../../../../localization';
import type {
  HabitType,
  HabitGoalMode,
  HabitScheduleMode,
  TimeOfDay,
} from '../../../../types/models';

export const timeOptions: { value: TimeOfDay; labelKey: TranslationKey }[] = [
  { value: 'ANYTIME', labelKey: 'habit_time_anytime' },
  { value: 'MORNING', labelKey: 'habit_time_morning' },
  { value: 'AFTERNOON', labelKey: 'habit_time_afternoon' },
  { value: 'EVENING', labelKey: 'habit_time_evening' },
];

export const habitTypes: {
  value: HabitType;
  labelKey: TranslationKey;
  icon: typeof Repeat2;
  descriptionKey: TranslationKey;
}[] = [
  {
    value: 'REGULAR',
    labelKey: 'habit_type_regular',
    icon: Repeat2,
    descriptionKey: 'habit_type_regular_description',
  },
  {
    value: 'NEGATIVE',
    labelKey: 'habit_type_negative',
    icon: Ban,
    descriptionKey: 'habit_type_negative_description',
  },
  {
    value: 'ONE_TIME',
    labelKey: 'habit_type_one_time',
    icon: ListTodo,
    descriptionKey: 'habit_type_one_time_description',
  },
];

export const scheduleLabelKeys: Record<HabitScheduleMode, TranslationKey> = {
  EVERYDAY: 'habit_schedule_everyday',
  WEEKDAYS: 'habit_schedule_weekdays',
  SPECIFIC_DAYS: 'habit_schedule_specific',
  WEEKLY_QUOTA: 'habit_schedule_weekly',
  MONTHLY_QUOTA: 'habit_schedule_monthly',
  YEARLY_QUOTA: 'habit_schedule_yearly',
  ONE_TIME: 'habit_schedule_one_time',
};

export const scheduleModes: HabitScheduleMode[] = [
  'EVERYDAY',
  'WEEKDAYS',
  'SPECIFIC_DAYS',
  'WEEKLY_QUOTA',
  'MONTHLY_QUOTA',
  'YEARLY_QUOTA',
];
export const goalModeLabelKeys: Record<HabitGoalMode, TranslationKey> = {
  OFF: 'habit_goal_off',
  DURATION: 'habit_goal_duration',
  REPEAT: 'habit_goal_repeat',
};
export const weekdayLabelKeys: TranslationKey[] = [
  'weekday_sun',
  'weekday_mon',
  'weekday_tue',
  'weekday_wed',
  'weekday_thu',
  'weekday_fri',
  'weekday_sat',
];
export const weekdayAccessibilityKeys: TranslationKey[] = [
  'weekday_sunday',
  'weekday_monday',
  'weekday_tuesday',
  'weekday_wednesday',
  'weekday_thursday',
  'weekday_friday',
  'weekday_saturday',
];
export const iconLabelKeys: Record<string, TranslationKey> = {
  Droplets: 'habit_icon_water',
  Footprints: 'habit_icon_walking',
  BookOpen: 'habit_icon_reading',
  Brain: 'habit_icon_meditation',
  Moon: 'habit_icon_night',
  Dumbbell: 'habit_icon_exercise',
  Pill: 'habit_icon_medicine',
  AlarmClock: 'habit_icon_alarm',
  Utensils: 'habit_icon_food',
  BedDouble: 'habit_icon_sleep',
  Activity: 'habit_icon_running',
  BicepsFlexed: 'habit_icon_gym',
  HeartPulse: 'habit_icon_health',
  GraduationCap: 'habit_icon_study',
  BriefcaseBusiness: 'habit_icon_work',
  SprayCan: 'habit_icon_cleaning',
  NotebookPen: 'habit_icon_journaling',
};
export const colorLabelKeys: Record<string, TranslationKey> = {
  blue: 'habit_color_blue',
  green: 'habit_color_green',
  amber: 'habit_color_amber',
  indigo: 'habit_color_indigo',
  red: 'habit_color_red',
  sky: 'habit_color_sky',
  coral: 'habit_color_coral',
  teal: 'habit_color_teal',
};

export function backgroundColorStyle(backgroundColor: string): ViewStyle {
  return { backgroundColor };
}

export type ScheduleDraft = {
  mode: HabitScheduleMode;
  weekdays: number[];
  quota: number;
};
