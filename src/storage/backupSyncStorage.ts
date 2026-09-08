import type { BackupPreferences, DriveBackupMetadata } from '../services/backup/backupTypes';
import { storage } from './storage';
import { STORAGE_KEYS } from './storageKeys';

export type BackupAccountMetadata = {
  lastSuccessfulSyncAt?: string;
  lastBackupFileId?: string;
  lastRemoteModifiedTime?: string;
  lastRemoteChecksum?: string;
  lastSyncedLocalRevision: number;
};

type StoredAccountMetadata = Record<string, BackupAccountMetadata>;

type RestoreJournal = {
  preferences: BackupPreferences;
};

function parseObject(value: string | undefined): Record<string, unknown> {
  if (!value) return {};
  try {
    const parsed: unknown = JSON.parse(value);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}

function isAccountMetadata(value: unknown): value is BackupAccountMetadata {
  if (!value || typeof value !== 'object') return false;
  const item = value as Partial<BackupAccountMetadata>;
  return (
    typeof item.lastSyncedLocalRevision === 'number' &&
    Number.isFinite(item.lastSyncedLocalRevision) &&
    (item.lastSuccessfulSyncAt === undefined ||
      typeof item.lastSuccessfulSyncAt === 'string') &&
    (item.lastBackupFileId === undefined ||
      typeof item.lastBackupFileId === 'string') &&
    (item.lastRemoteModifiedTime === undefined ||
      typeof item.lastRemoteModifiedTime === 'string') &&
    (item.lastRemoteChecksum === undefined ||
      typeof item.lastRemoteChecksum === 'string')
  );
}

function readAccounts(): StoredAccountMetadata {
  const parsed = parseObject(
    storage.getString(STORAGE_KEYS.BACKUP_ACCOUNT_METADATA),
  );
  return Object.fromEntries(
    Object.entries(parsed).filter((entry): entry is [string, BackupAccountMetadata] =>
      isAccountMetadata(entry[1]),
    ),
  );
}

export const backupSyncStorage = {
  getLocalRevision() {
    const revision = storage.getNumber(STORAGE_KEYS.BACKUP_LOCAL_REVISION);
    return typeof revision === 'number' && Number.isFinite(revision)
      ? revision
      : 0;
  },

  incrementLocalRevision() {
    const revision = this.getLocalRevision() + 1;
    storage.setNumber(STORAGE_KEYS.BACKUP_LOCAL_REVISION, revision);
    return revision;
  },

  getAccount(userId: string): BackupAccountMetadata | undefined {
    return readAccounts()[userId];
  },

  setAccount(
    userId: string,
    metadata: BackupAccountMetadata,
  ): boolean {
    const accounts = readAccounts();
    accounts[userId] = metadata;
    return storage.setString(
      STORAGE_KEYS.BACKUP_ACCOUNT_METADATA,
      JSON.stringify(accounts),
    );
  },

  recordSuccessfulSync(
    userId: string,
    remote: DriveBackupMetadata,
    localRevision: number,
    syncedAt: string,
  ) {
    return this.setAccount(userId, {
      lastSuccessfulSyncAt: syncedAt,
      lastBackupFileId: remote.id,
      lastRemoteModifiedTime: remote.modifiedTime,
      lastRemoteChecksum: remote.md5Checksum,
      lastSyncedLocalRevision: localRevision,
    });
  },

  setRestoreJournal(preferences: BackupPreferences) {
    const journal: RestoreJournal = { preferences };
    return storage.setString(
      STORAGE_KEYS.BACKUP_RESTORE_JOURNAL,
      JSON.stringify(journal),
    );
  },

  getRestoreJournal(): RestoreJournal | undefined {
    const parsed = parseObject(
      storage.getString(STORAGE_KEYS.BACKUP_RESTORE_JOURNAL),
    );
    return parsed.preferences && typeof parsed.preferences === 'object'
      ? (parsed as RestoreJournal)
      : undefined;
  },

  clearRestoreJournal() {
    return storage.remove(STORAGE_KEYS.BACKUP_RESTORE_JOURNAL);
  },
};
