import { NativeModules, Platform } from 'react-native';

type AlarmNativeModule = {
  canUseFullScreenIntent(): Promise<boolean>;
  openFullScreenSettings(): Promise<void>;
  ensureAlarmChannel(id: string, name: string): Promise<string>;
  closeAlarm(
    notificationId: string | null,
    occurrenceTime: string | null,
  ): Promise<void>;
};

const native = NativeModules.HabitAlarm as AlarmNativeModule | undefined;
export const alarmNative = {
  canUseFullScreenIntent: async () =>
    Platform.OS === 'android' && native
      ? native.canUseFullScreenIntent()
      : false,
  openFullScreenSettings: async () => {
    if (!native) throw new Error('Alarm native module is unavailable');
    await native.openFullScreenSettings();
  },
  ensureAlarmChannel: async (id: string, name: string) => {
    if (!native) throw new Error('Alarm native module is unavailable');
    return native.ensureAlarmChannel(id, name);
  },
  closeAlarm: async (notificationId?: string, occurrenceTime?: string) => {
    if (Platform.OS === 'android')
      await native?.closeAlarm(notificationId ?? null, occurrenceTime ?? null);
  },
};
