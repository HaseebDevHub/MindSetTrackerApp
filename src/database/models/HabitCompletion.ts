import { Model } from '@nozbe/watermelondb';
import type { Associations } from '@nozbe/watermelondb/Model';
import type Relation from '@nozbe/watermelondb/Relation';
import { field, immutableRelation } from '@nozbe/watermelondb/decorators';
import type Habit from './Habit';

export default class HabitCompletion extends Model {
  static table = 'habit_completions' as const;

  static associations: Associations = {
    habits: {
      type: 'belongs_to',
      key: 'habit_id',
    },
  };

  @field('habit_id') habitId!: string;
  @field('date_key') dateKey!: string;
  @immutableRelation('habits', 'habit_id') habit!: Relation<Habit>;
}
