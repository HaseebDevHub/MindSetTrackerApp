/**
 * @format
 */

import 'react-native-gesture-handler';
import './src/database';
import { AppRegistry } from 'react-native';
import App from './App';
import { AlarmScreen } from './src/screens/alarm/AlarmScreen';
import { refreshAlarmsAfterClockChange } from './src/services/registerAlarmEvents';
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);
AppRegistry.registerComponent('MindsetHabitAlarm', () => AlarmScreen);
AppRegistry.registerHeadlessTask(
  'MindsetAlarmClockChanged',
  () => refreshAlarmsAfterClockChange,
);
