import { Model, Relation } from '@nozbe/watermelondb';
import { field, relation } from '@nozbe/watermelondb/decorators';
import ActiveJourney from './ActiveJourney';

export default class JourneyTaskCompletion extends Model {
  static table = 'journey_task_completions';

  static associations = {
    active_journeys: {
      type: 'belongs_to' as const,
      key: 'active_journey_id',
    },
  };

  @field('active_journey_id') activeJourneyId!: string;
  @field('task_id') taskId!: string;
  @field('date_key') dateKey!: string;
  @relation('active_journeys', 'active_journey_id')
  activeJourney!: Relation<ActiveJourney>;
}
