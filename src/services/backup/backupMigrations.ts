import { BACKUP_VERSION } from './backupConstants';
import { BackupValidationError } from './backupValidationError';

type BackupMigration = (backup: Record<string, unknown>) => unknown;

// Register migrations by their source version (for example, 1: migrateV1ToV2)
// when the backup contract advances. Version 1 is current, so no migration is
// required yet.
const migrations: Readonly<Partial<Record<number, BackupMigration>>> = {};

function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function migrateBackupToCurrent(value: unknown): unknown {
  if (!isObject(value) || !Number.isInteger(value.backupVersion)) return value;

  let migrated: unknown = value;
  let version = value.backupVersion as number;
  if (version > BACKUP_VERSION || version < 1) {
    throw new BackupValidationError(
      'incompatible_backup',
      'Backup version is not supported.',
    );
  }

  while (version < BACKUP_VERSION) {
    const migration = migrations[version];
    if (!migration || !isObject(migrated)) {
      throw new BackupValidationError(
        'incompatible_backup',
        'Backup version cannot be migrated.',
      );
    }
    migrated = migration(migrated);
    if (!isObject(migrated) || migrated.backupVersion !== version + 1) {
      throw new BackupValidationError(
        'incompatible_backup',
        'Backup migration produced an invalid version.',
      );
    }
    version += 1;
  }

  return migrated;
}
