import type { SQLiteDatabase } from 'expo-sqlite';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  Timestamp,
  writeBatch,
  type DocumentData,
  type DocumentReference,
  type Firestore,
} from 'firebase/firestore';

import type { CloudBackupMetadata } from '../types/cloud';
import { firebaseDb } from './firebase';

const CLOUD_SCHEMA_VERSION = 1;
const MAX_BATCH_WRITES = 400;

const collectionNames = [
  'transactions',
  'savings_entries',
  'savings_goals',
  'savings_goal_entries',
  'planned_commitments',
  'monthly_budgets',
  'app_settings',
] as const;

type BackupCollectionName = (typeof collectionNames)[number];

type BackupRecord = Record<string, unknown>;

type BackupSnapshot = Record<BackupCollectionName, BackupRecord[]>;

function requireFirestore(): Firestore {
  if (!firebaseDb) {
    throw new Error('Firebase is not configured yet.');
  }

  return firebaseDb;
}

async function loadLocalSnapshot(db: SQLiteDatabase): Promise<BackupSnapshot> {
  const [
    transactions,
    savingsEntries,
    savingsGoals,
    savingsGoalEntries,
    plannedCommitments,
    monthlyBudgets,
    appSettings,
  ] = await Promise.all([
    db.getAllAsync<BackupRecord>('SELECT * FROM transactions ORDER BY id ASC'),
    db.getAllAsync<BackupRecord>('SELECT * FROM savings_entries ORDER BY id ASC'),
    db.getAllAsync<BackupRecord>('SELECT * FROM savings_goals ORDER BY id ASC'),
    db.getAllAsync<BackupRecord>('SELECT * FROM savings_goal_entries ORDER BY id ASC'),
    db.getAllAsync<BackupRecord>('SELECT * FROM planned_commitments ORDER BY id ASC'),
    db.getAllAsync<BackupRecord>('SELECT * FROM monthly_budgets ORDER BY id ASC'),
    db.getAllAsync<BackupRecord>(
      `SELECT key, value
       FROM app_settings
       WHERE key NOT LIKE 'notification_%'
         AND key != 'notifications_enabled'
       ORDER BY key ASC`
    ),
  ]);

  return {
    transactions,
    savings_entries: savingsEntries,
    savings_goals: savingsGoals,
    savings_goal_entries: savingsGoalEntries,
    planned_commitments: plannedCommitments,
    monthly_budgets: monthlyBudgets,
    app_settings: appSettings,
  };
}

function documentIdForRecord(
  collectionName: BackupCollectionName,
  record: BackupRecord,
  index: number
): string {
  if (collectionName === 'app_settings') {
    return String(record.key ?? index);
  }

  return String(record.id ?? index);
}

async function commitDeleteRefs(
  db: Firestore,
  refs: DocumentReference<DocumentData>[]
) {
  for (let i = 0; i < refs.length; i += MAX_BATCH_WRITES) {
    const batch = writeBatch(db);
    const chunk = refs.slice(i, i + MAX_BATCH_WRITES);

    for (const ref of chunk) {
      batch.delete(ref);
    }

    await batch.commit();
  }
}

async function replaceRemoteCollection(
  db: Firestore,
  uid: string,
  collectionName: BackupCollectionName,
  records: BackupRecord[]
) {
  const remoteCollection = collection(db, 'users', uid, collectionName);
  const existing = await getDocs(remoteCollection);

  await commitDeleteRefs(
    db,
    existing.docs.map((snapshot) => snapshot.ref)
  );

  for (let i = 0; i < records.length; i += MAX_BATCH_WRITES) {
    const batch = writeBatch(db);
    const chunk = records.slice(i, i + MAX_BATCH_WRITES);

    chunk.forEach((record, chunkIndex) => {
      const absoluteIndex = i + chunkIndex;
      const id = documentIdForRecord(
        collectionName,
        record,
        absoluteIndex
      );

      batch.set(doc(remoteCollection, id), record);
    });

    await batch.commit();
  }
}

export async function createCloudBackup(
  sqliteDb: SQLiteDatabase,
  uid: string
): Promise<CloudBackupMetadata> {
  const db = requireFirestore();
  const snapshot = await loadLocalSnapshot(sqliteDb);

  for (const collectionName of collectionNames) {
    await replaceRemoteCollection(
      db,
      uid,
      collectionName,
      snapshot[collectionName]
    );
  }

  const counts = Object.fromEntries(
    collectionNames.map((name) => [name, snapshot[name].length])
  );

  await writeBatch(db)
    .set(doc(db, 'users', uid, 'meta', 'backup'), {
      schemaVersion: CLOUD_SCHEMA_VERSION,
      updatedAt: serverTimestamp(),
      counts,
    })
    .commit();

  return {
    exists: true,
    updatedAt: new Date(),
    schemaVersion: CLOUD_SCHEMA_VERSION,
    counts,
  };
}

async function loadRemoteCollection(
  db: Firestore,
  uid: string,
  collectionName: BackupCollectionName
): Promise<BackupRecord[]> {
  const snapshot = await getDocs(
    collection(db, 'users', uid, collectionName)
  );

  return snapshot.docs.map((item) => item.data() as BackupRecord);
}

export async function getCloudBackupMetadata(
  uid: string
): Promise<CloudBackupMetadata> {
  const db = requireFirestore();
  const snapshot = await getDoc(doc(db, 'users', uid, 'meta', 'backup'));

  if (!snapshot.exists()) {
    return {
      exists: false,
      updatedAt: null,
      schemaVersion: CLOUD_SCHEMA_VERSION,
      counts: {},
    };
  }

  const data = snapshot.data() as {
    schemaVersion?: number;
    updatedAt?: Timestamp;
    counts?: Record<string, number>;
  };

  return {
    exists: true,
    updatedAt:
      data.updatedAt instanceof Timestamp
        ? data.updatedAt.toDate()
        : null,
    schemaVersion: data.schemaVersion ?? CLOUD_SCHEMA_VERSION,
    counts: data.counts ?? {},
  };
}

export async function restoreCloudBackup(
  sqliteDb: SQLiteDatabase,
  uid: string
): Promise<CloudBackupMetadata> {
  const db = requireFirestore();
  const metadata = await getCloudBackupMetadata(uid);

  if (!metadata.exists) {
    throw new Error('No cloud backup exists for this account yet.');
  }

  const loadedEntries = await Promise.all(
    collectionNames.map(async (name) => [
      name,
      await loadRemoteCollection(db, uid, name),
    ] as const)
  );

  const remote = Object.fromEntries(loadedEntries) as BackupSnapshot;

  await sqliteDb.withTransactionAsync(async () => {
    await sqliteDb.execAsync(`
      DELETE FROM savings_goal_entries;
      DELETE FROM savings_goals;
      DELETE FROM savings_entries;
      DELETE FROM planned_commitments;
      DELETE FROM monthly_budgets;
      DELETE FROM transactions;
      DELETE FROM app_settings
      WHERE key NOT LIKE 'notification_%'
        AND key != 'notifications_enabled';
      DELETE FROM budget_notification_state;
    `);

    for (const row of remote.transactions) {
      await sqliteDb.runAsync(
        `INSERT INTO transactions
          (id, type, amount_cents, category, note, transaction_date, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        Number(row.id),
        String(row.type),
        Number(row.amount_cents),
        String(row.category),
        row.note == null ? null : String(row.note),
        String(row.transaction_date),
        String(row.created_at),
        String(row.updated_at)
      );
    }

    for (const row of remote.savings_entries) {
      await sqliteDb.runAsync(
        `INSERT INTO savings_entries
          (id, type, amount_cents, note, entry_date, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        Number(row.id),
        String(row.type),
        Number(row.amount_cents),
        row.note == null ? null : String(row.note),
        String(row.entry_date),
        String(row.created_at)
      );
    }

    for (const row of remote.savings_goals) {
      await sqliteDb.runAsync(
        `INSERT INTO savings_goals
          (id, name, target_amount_cents, target_date, priority, emoji, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        Number(row.id),
        String(row.name),
        Number(row.target_amount_cents),
        row.target_date == null ? null : String(row.target_date),
        String(row.priority),
        String(row.emoji),
        String(row.created_at),
        String(row.updated_at)
      );
    }

    for (const row of remote.savings_goal_entries) {
      await sqliteDb.runAsync(
        `INSERT INTO savings_goal_entries
          (id, goal_id, type, amount_cents, created_at)
         VALUES (?, ?, ?, ?, ?)`,
        Number(row.id),
        Number(row.goal_id),
        String(row.type),
        Number(row.amount_cents),
        String(row.created_at)
      );
    }

    for (const row of remote.planned_commitments) {
      await sqliteDb.runAsync(
        `INSERT INTO planned_commitments
          (id, name, amount_cents, due_date, category, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        Number(row.id),
        String(row.name),
        Number(row.amount_cents),
        String(row.due_date),
        String(row.category),
        String(row.created_at),
        String(row.updated_at)
      );
    }

    for (const row of remote.monthly_budgets) {
      await sqliteDb.runAsync(
        `INSERT INTO monthly_budgets
          (id, category, limit_cents, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?)`,
        Number(row.id),
        String(row.category),
        Number(row.limit_cents),
        String(row.created_at),
        String(row.updated_at)
      );
    }

    for (const row of remote.app_settings) {
      await sqliteDb.runAsync(
        `INSERT INTO app_settings (key, value)
         VALUES (?, ?)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
        String(row.key),
        String(row.value)
      );
    }
  });

  return metadata;
}
