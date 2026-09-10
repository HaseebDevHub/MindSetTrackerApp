import notifee, {
  AndroidDefaults,
  AndroidCategory,
  AndroidImportance,
  AndroidVisibility,
  type Notification,
} from '@notifee/react-native';
import { Platform } from 'react-native';
import { t, getSelectedLanguage, type AppLanguage } from '../localization';
import {
  ALARM_ACTIVITY,
  ALARM_CATEGORY_ID,
  ALARM_CHANNEL_ID,
  ALARM_DISMISS,
  ALARM_SNOOZE,
  NOTIFICATION_SMALL_ICON,
} from '../utils/habitAlerts';
import { alarmNative } from './alarmNative';

export async function ensureAlarmSupport(language = getSelectedLanguage()) {
  if (Platform.OS === 'android') {
    await alarmNative.ensureAlarmChannel(
      ALARM_CHANNEL_ID,
      t('habit_alarm_channel', undefined, language),
    );
    return alarmNative.canUseFullScreenIntent();
  }
  const categories = await notifee.getNotificationCategories();
  await notifee.setNotificationCategories([
    ...categories.filter(item => item.id !== ALARM_CATEGORY_ID),
    {
      id: ALARM_CATEGORY_ID,
      actions: [
        {
          id: ALARM_SNOOZE,
          title: t('habit_alarm_snooze', undefined, language),
        },
        {
          id: ALARM_DISMISS,
          title: t('habit_alarm_dismiss', undefined, language),
        },
      ],
    },
  ]);
  return false;
}

export function asAlarmNotification(
  notification: Notification,
  fullScreen: boolean,
  language: AppLanguage = getSelectedLanguage(),
): Notification {
  const launch = { id: 'default', launchActivity: ALARM_ACTIVITY };
  return {
    ...notification,
    android: {
      channelId: ALARM_CHANNEL_ID,
      smallIcon: NOTIFICATION_SMALL_ICON,
      importance: AndroidImportance.HIGH,
      category: AndroidCategory.ALARM,
      visibility: AndroidVisibility.PUBLIC,
      loopSound: true,
      // Pre-channel Android devices use this system URI directly.
      sound: 'content://settings/system/alarm_alert',
      defaults: [AndroidDefaults.LIGHTS],
      vibrationPattern: [700, 350, 700, 350],
      ongoing: true,
      autoCancel: false,
      // A bounded ring prevents an unattended alarm from sounding indefinitely.
      timeoutAfter: 5 * 60 * 1000,
      pressAction: launch,
      ...(fullScreen ? { fullScreenAction: launch } : {}),
      actions: [
        {
          title: t('habit_alarm_snooze', undefined, language),
          pressAction: { id: ALARM_SNOOZE },
        },
        {
          title: t('habit_alarm_dismiss', undefined, language),
          pressAction: { id: ALARM_DISMISS },
        },
      ],
    },
    ios: {
      sound: 'default',
      interruptionLevel: 'timeSensitive',
      categoryId: ALARM_CATEGORY_ID,
    },
  };
}
