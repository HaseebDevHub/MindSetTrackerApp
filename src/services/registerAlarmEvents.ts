import notifee, { type Event } from '@notifee/react-native';
import {
  handleHabitAlarmEvent,
  reconcileHabitAlerts,
} from './habitAlarmService';

// Registered at JS entry, not in a screen: notification actions also run headlessly.
async function onEvent(event: Event) {
  try {
    await handleHabitAlarmEvent(event);
  } catch {
    if (__DEV__)
      console.warn(
        '[habit alarms] Action or reconciliation failed; retry on next foreground.',
      );
  }
}
notifee.onBackgroundEvent(onEvent);
notifee.onForegroundEvent(event => {
  onEvent(event);
});

export async function refreshAlarmsAfterClockChange() {
  try {
    await reconcileHabitAlerts();
  } catch {
    if (__DEV__)
      console.warn(
        '[habit alarms] Clock reconciliation failed; retry on next foreground.',
      );
  }
}
