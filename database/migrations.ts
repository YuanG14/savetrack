import type { SQLiteDatabase } from 'expo-sqlite';

const DATABASE_VERSION = 5;

export async function migrateDbIfNeeded(db: SQLiteDatabase) {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
  `);

  const versionRow = await db.getFirstAsync<{ user_version: number }>(
    'PRAGMA user_version'
  );

  let currentDbVersion = versionRow?.user_version ?? 0;

  if (currentDbVersion >= DATABASE_VERSION) {
    return;
  }

  if (currentDbVersion === 0) {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
        amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
        category TEXT NOT NULL,
        note TEXT,
        transaction_date TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_transactions_date
      ON transactions(transaction_date DESC);

      CREATE INDEX IF NOT EXISTS idx_transactions_type
      ON transactions(type);
    `);

    currentDbVersion = 1;
  }

  if (currentDbVersion < 2) {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS savings_entries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL CHECK (type IN ('deposit', 'withdrawal')),
        amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
        note TEXT,
        entry_date TEXT NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_savings_entries_date
      ON savings_entries(entry_date DESC);

      CREATE TABLE IF NOT EXISTS app_settings (
        key TEXT PRIMARY KEY NOT NULL,
        value TEXT NOT NULL
      );
    `);

    currentDbVersion = 2;
  }

  if (currentDbVersion < 3) {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS savings_goals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        target_amount_cents INTEGER NOT NULL CHECK (target_amount_cents > 0),
        target_date TEXT,
        priority TEXT NOT NULL CHECK (priority IN ('high', 'medium', 'low')),
        emoji TEXT NOT NULL DEFAULT '🎯',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS savings_goal_entries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        goal_id INTEGER NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('contribution', 'release')),
        amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
        created_at TEXT NOT NULL,
        FOREIGN KEY (goal_id) REFERENCES savings_goals(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_savings_goal_entries_goal
      ON savings_goal_entries(goal_id);

      CREATE INDEX IF NOT EXISTS idx_savings_goals_priority
      ON savings_goals(priority);
    `);

    currentDbVersion = 3;
  }

  if (currentDbVersion < 4) {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS planned_commitments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
        due_date TEXT NOT NULL,
        category TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_planned_commitments_due_date
      ON planned_commitments(due_date ASC);
    `);

    currentDbVersion = 4;
  }

  if (currentDbVersion < 5) {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS monthly_budgets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        category TEXT NOT NULL UNIQUE,
        limit_cents INTEGER NOT NULL CHECK (limit_cents > 0),
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_monthly_budgets_category
      ON monthly_budgets(category);
    `);

    currentDbVersion = 5;
  }

  await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
}
