export class BackupValidationError extends Error {
  constructor(
    public readonly reason: 'malformed_backup' | 'incompatible_backup',
    message: string,
  ) {
    super(message);
    this.name = 'BackupValidationError';
  }
}
