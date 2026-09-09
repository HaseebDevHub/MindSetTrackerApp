export const GLOBAL_REMINDER_SLOTS = [
  'morning',
  'afternoon',
  'evening',
] as const;

export type GlobalReminderSlot = (typeof GLOBAL_REMINDER_SLOTS)[number];

export type GlobalReminderTimes = Record<GlobalReminderSlot, string>;

export type NotificationPreferences = {
  version: 1;
  masterEnabled: boolean;
  globalRemindersEnabled: boolean;
  habitRemindersEnabled: boolean;
  times: GlobalReminderTimes;
};

export type NotificationPermissionStatus =
  | 'not_determined'
  | 'authorized'
  | 'provisional'
  | 'denied';

export type NotificationSyncStatus =
  | 'idle'
  | 'syncing'
  | 'scheduled'
  | 'permission_required'
  | 'error';

export type NotificationSyncResult = {
  permissionStatus: NotificationPermissionStatus;
  exactAlarmEnabled: boolean;
  scheduledCount: number;
};
