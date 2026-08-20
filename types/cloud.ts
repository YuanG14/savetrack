export type CloudBackupMetadata = {
  exists: boolean;
  updatedAt: Date | null;
  schemaVersion: number;
  counts: Record<string, number>;
};

export type CloudActionState = 'idle' | 'backing-up' | 'restoring';
