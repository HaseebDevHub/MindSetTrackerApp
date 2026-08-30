import { Model } from '@nozbe/watermelondb';
import type { Associations } from '@nozbe/watermelondb/Model';
import type Query from '@nozbe/watermelondb/Query';
import { children, field, text } from '@nozbe/watermelondb/decorators';
import type { HabitFrequency, TimeOfDay } from '../../types/models';
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
  @field('created_date_key') createdDateKey!: string;
  @children('habit_completions') completions!: Query<HabitCompletion>;
}
