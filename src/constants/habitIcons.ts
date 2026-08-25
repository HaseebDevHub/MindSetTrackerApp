import {
  Activity,
  AlarmClock,
  BedDouble,
  BicepsFlexed,
  BookOpen,
  Brain,
  BriefcaseBusiness,
  Droplets,
  Dumbbell,
  Footprints,
  GraduationCap,
  HeartPulse,
  Moon,
  NotebookPen,
  Pill,
  Sparkles,
  SprayCan,
  Utensils,
  type LucideIcon,
} from 'lucide-react-native';

export type HabitIconOption = {
  id: string;
  label: string;
  icon: LucideIcon;
};

export const DEFAULT_HABIT_ICON_ID = 'Droplets';

export const HABIT_ICONS: HabitIconOption[] = [
  { id: 'Droplets', label: 'Water and hydration', icon: Droplets },
  { id: 'Footprints', label: 'Walking', icon: Footprints },
  { id: 'BookOpen', label: 'Reading', icon: BookOpen },
  { id: 'Brain', label: 'Meditation', icon: Brain },
  { id: 'Moon', label: 'Night routine', icon: Moon },
  { id: 'Dumbbell', label: 'Exercise and workout', icon: Dumbbell },
  { id: 'Pill', label: 'Medicine and medication', icon: Pill },
  { id: 'AlarmClock', label: 'Wake-up and alarm', icon: AlarmClock },
  { id: 'Utensils', label: 'Food and meals', icon: Utensils },
  { id: 'BedDouble', label: 'Sleep', icon: BedDouble },
  { id: 'Activity', label: 'Running', icon: Activity },
  { id: 'BicepsFlexed', label: 'Gym', icon: BicepsFlexed },
  { id: 'HeartPulse', label: 'Heart and health', icon: HeartPulse },
  { id: 'GraduationCap', label: 'Study and learning', icon: GraduationCap },
  { id: 'BriefcaseBusiness', label: 'Work', icon: BriefcaseBusiness },
  { id: 'SprayCan', label: 'Cleaning', icon: SprayCan },
  { id: 'NotebookPen', label: 'Journaling', icon: NotebookPen },
];

const habitIconsById = new Map(HABIT_ICONS.map(({ id, icon }) => [id, icon]));

export function getHabitIcon(id: string): LucideIcon {
  return habitIconsById.get(id) ?? Sparkles;
}
