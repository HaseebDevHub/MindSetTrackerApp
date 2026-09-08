let restoreInProgress = false;

export const isBackupRestoreInProgress = () => restoreInProgress;

export async function runWithBackupRestoreGate<T>(action: () => Promise<T>) {
  if (restoreInProgress) throw new Error('A backup restore is already running.');
  restoreInProgress = true;
  try {
    return await action();
  } finally {
    restoreInProgress = false;
  }
}
