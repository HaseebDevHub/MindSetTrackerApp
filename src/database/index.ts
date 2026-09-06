import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';
import { Platform } from 'react-native';

import migrations from './migrations';
import ActiveJourney from './models/ActiveJourney';
import Habit from './models/Habit';
import HabitCompletion from './models/HabitCompletion';
import JourneyTaskCompletion from './models/JourneyTaskCompletion';
import schema from './schema';

const adapter = new SQLiteAdapter({
  schema,
  migrations,
  dbName: 'mindset_tracker',
  jsi: Platform.OS === 'ios',
  onSetUpError: error => {
    console.error('WatermelonDB setup failed:', error);
  },
});

export const database = new Database({
  adapter,
  modelClasses: [
    Habit,
    HabitCompletion,
    ActiveJourney,
    JourneyTaskCompletion,
  ],
});

export default database;
