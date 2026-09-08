import type {
  AchievementUnlock,
  HabitActionType,
  HabitFrequency,
  HabitGoalMode,
  HabitItem,
  HabitScheduleMode,
  HabitType,
  TimeOfDay,
} from '../../types/models';
import type { OnboardingTarget } from '../../types/onboarding';

export type HabitBackupRecord = {
  id: string;
  title: string;
  timeOfDay: TimeOfDay;
  frequency: HabitFrequency;
  iconName: string;
  note: string | null;
  isReminderEnabled: boolean;
  reminderTime: string | null;
  isArchived: boolean;
  archivedDateKey: string | null;
  createdDateKey: string;
  habitType: HabitType | null;
  color: string | null;
  scheduleMode: HabitScheduleMode | null;
  selectedWeekdays: string | null;
  quotaCount: number | null;
  endDateKey: string | null;
  targetDateKey: string | null;
  goalMode: HabitGoalMode | null;
  goalTarget: number | null;
  goalUnit: 'MINUTES' | 'REPS' | null;
  motivationalText: string | null;
};

export type HabitCompletionBackupRecord = {
  id: string;
  habitId: string;
  dateKey: string;
  actionType: HabitActionType;
  progressValue: number;
};

export type ActiveJourneyBackupRecord = {
  id: string;
  journeyId: string;
  startedDateKey: string;
  isActive: boolean;
  removedDateKey: string | null;
};

export type JourneyTaskCompletionBackupRecord = {
  id: string;
  activeJourneyId: string;
  taskId: string;
  dateKey: string;
};

export type BackupPreferences = {
  onboarding: {
    completed: boolean;
    wakeUpTime?: string;
    dayEndTime?: string;
    targets?: OnboardingTarget[];
    firstHabit?: HabitItem;
  };
  achievements: {
    unlocks: AchievementUnlock[];
    celebratedPerfectDays: string[];
  };
  notificationReminderTime?: string;
  weekStartsOn: 0 | 1;
};

export type MindsetTrackerBackupV1 = {
  backupVersion: 1;
  databaseSchemaVersion: 5;
  exportedAt: string;
  data: {
    habits: HabitBackupRecord[];
    habitCompletions: HabitCompletionBackupRecord[];
    activeJourneys: ActiveJourneyBackupRecord[];
    journeyTaskCompletions: JourneyTaskCompletionBackupRecord[];
    preferences: BackupPreferences;
  };
};

export type MindsetTrackerBackup = MindsetTrackerBackupV1;

export type DriveBackupMetadata = {
  id: string;
  name: string;
  modifiedTime: string;
  size?: number;
  md5Checksum?: string;
};

export type BackupErrorCode =
  | 'not_connected'
  | 'scope_required'
  | 'cancelled'
  | 'offline'
  | 'unauthorized'
  | 'permission_denied'
  | 'not_found'
  | 'malformed_backup'
  | 'incompatible_backup'
  | 'backup_too_large'
  | 'conflict'
  | 'local_read_failed'
  | 'local_write_failed'
  | 'drive_error'
  | 'unknown';

export type BackupResult<T = undefined> =
  | { ok: true; value: T }
  | { ok: false; reason: BackupErrorCode };
