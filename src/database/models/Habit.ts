import { Model } from '@nozbe/watermelondb';
import type { Associations } from '@nozbe/watermelondb/Model';
import type Query from '@nozbe/watermelondb/Query';
import { children, field, text } from '@nozbe/watermelondb/decorators';
import type {
  HabitFrequency,
  HabitGoalMode,
  HabitScheduleMode,
  HabitType,
  TimeOfDay,
} from '../../types/models';
import type HabitCompletion from './HabitCompletion';

export default class Habit extends Model {
  static table = 'habits' as const;

  static associations: Associations = {
    habit_completions: {
      type: 'has_many',
      foreignKey: 'habit_id',
    },
  };

  @text('title') title!: string;
  @field('time_of_day') timeOfDay!: TimeOfDay;
  @field('frequency') frequency!: HabitFrequency;
  @field('icon_name') iconName!: string;
  @text('note') note!: string | null;
  @field('is_reminder_enabled') isReminderEnabled!: boolean;
  @field('reminder_time') reminderTime!: string | null;
  @field('is_archived') isArchived!: boolean;
  @field('archived_date_key') archivedDateKey!: string | null;
  @field('created_date_key') createdDateKey!: string;
  @field('habit_type') habitType!: HabitType | null;
  @field('color') color!: string | null;
  @field('schedule_mode') scheduleMode!: HabitScheduleMode | null;
  @field('selected_weekdays') selectedWeekdays!: string | null;
  @field('quota_count') quotaCount!: number | null;
  @field('end_date_key') endDateKey!: string | null;
  @field('target_date_key') targetDateKey!: string | null;
  @field('goal_mode') goalMode!: HabitGoalMode | null;
  @field('goal_target') goalTarget!: number | null;
  @field('goal_unit') goalUnit!: 'MINUTES' | 'REPS' | null;
  @field('motivational_text') motivationalText!: string | null;
  @children('habit_completions') completions!: Query<HabitCompletion>;
}
