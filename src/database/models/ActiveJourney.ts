import { Model, Query } from '@nozbe/watermelondb';
import { children, field } from '@nozbe/watermelondb/decorators';
import JourneyTaskCompletion from './JourneyTaskCompletion';

export default class ActiveJourney extends Model {
  static table = 'active_journeys';

  static associations = {
    journey_task_completions: {
      type: 'has_many' as const,
      foreignKey: 'active_journey_id',
    },
  };

  @field('journey_id') journeyId!: string;
  @field('started_date_key') startedDateKey!: string;
  @field('is_active') isActive!: boolean;
  @field('removed_date_key') removedDateKey!: string | null;
  @children('journey_task_completions')
  taskCompletions!: Query<JourneyTaskCompletion>;
}
