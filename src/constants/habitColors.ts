export type HabitColorOption = {
  id: string;
  value: string;
  label: string;
};

export const HABIT_COLORS: HabitColorOption[] = [
  { id: 'blue', value: '#3B82F6', label: 'Blue' },
  { id: 'green', value: '#16A34A', label: 'Green' },
  { id: 'amber', value: '#F59E0B', label: 'Amber' },
  { id: 'indigo', value: '#4F46E5', label: 'Indigo' },
  { id: 'red', value: '#DC4446', label: 'Red' },
  { id: 'sky', value: '#38A9DC', label: 'Sky blue' },
  { id: 'coral', value: '#FF754B', label: 'Coral' },
  { id: 'teal', value: '#2FA7B7', label: 'Teal' },
];

export const DEFAULT_HABIT_COLOR = HABIT_COLORS[0].value;

const validColors = new Set(HABIT_COLORS.map(option => option.value));

export function normalizeHabitColor(value: unknown) {
  return typeof value === 'string' && validColors.has(value)
    ? value
    : DEFAULT_HABIT_COLOR;
}
