export const BACKUP_FILE_NAME = 'mindset_tracker_backup.json';
export const BACKUP_MIME_TYPE = 'application/json';
export const BACKUP_VERSION = 1 as const;
export const DRIVE_APP_DATA_SCOPE =
  'https://www.googleapis.com/auth/drive.appdata';
export const DRIVE_API_BASE_URL = 'https://www.googleapis.com/drive/v3';
export const DRIVE_UPLOAD_BASE_URL =
  'https://www.googleapis.com/upload/drive/v3';
export const MAX_BACKUP_BYTES = 10 * 1024 * 1024;
export const AUTO_SYNC_DEBOUNCE_MS = 3000;
export const DRIVE_REQUEST_TIMEOUT_MS = 30000;
