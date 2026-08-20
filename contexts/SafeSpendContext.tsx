import { useSQLiteContext } from 'expo-sqlite';
import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import type {
  Commitment,
  CommitmentInput,
  CommitmentRow,
} from '../types/safe-spend';

type SafeSpendContextValue = {
  commitments: Commitment[];
  loading: boolean;
  nextIncomeDate: string | null;
  expectedIncomeCents: number;
  refreshSafeSpend: () => Promise<void>;
  saveIncomePlan: (
    nextIncomeDate: string | null,
    expectedIncomeCents: number
  ) => Promise<void>;
  addCommitment: (input: CommitmentInput) => Promise<number>;
  updateCommitment: (id: number, input: CommitmentInput) => Promise<void>;
  deleteCommitment: (id: number) => Promise<void>;
};

const SafeSpendContext = createContext<SafeSpendContextValue | null>(null);

function mapRow(row: CommitmentRow): Commitment {
  return {
    id: row.id,
    name: row.name,
    amountCents: row.amount_cents,
    dueDate: row.due_date,
    category: row.category,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function SafeSpendProvider({ children }: PropsWithChildren) {
  const db = useSQLiteContext();
  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [nextIncomeDate, setNextIncomeDate] = useState<string | null>(null);
  const [expectedIncomeCents, setExpectedIncomeCents] = useState(0);
  const [loading, setLoading] = useState(true);

  const refreshSafeSpend = useCallback(async () => {
    const rows = await db.getAllAsync<CommitmentRow>(
      `SELECT
        id,
        name,
        amount_cents,
        due_date,
        category,
        created_at,
        updated_at
       FROM planned_commitments
       ORDER BY due_date ASC, id ASC`
    );

    const settings = await db.getAllAsync<{ key: string; value: string }>(
      `SELECT key, value
       FROM app_settings
       WHERE key IN ('next_income_date', 'expected_income_cents')`
    );

    const settingMap = new Map(settings.map((row) => [row.key, row.value]));

    setCommitments(rows.map(mapRow));
    setNextIncomeDate(settingMap.get('next_income_date') || null);
    setExpectedIncomeCents(
      Number.parseInt(settingMap.get('expected_income_cents') || '0', 10) || 0
    );
  }, [db]);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      try {
        const rows = await db.getAllAsync<CommitmentRow>(
          `SELECT
            id,
            name,
            amount_cents,
            due_date,
            category,
            created_at,
            updated_at
           FROM planned_commitments
           ORDER BY due_date ASC, id ASC`
        );

        const settings = await db.getAllAsync<{ key: string; value: string }>(
          `SELECT key, value
           FROM app_settings
           WHERE key IN ('next_income_date', 'expected_income_cents')`
        );

        if (!mounted) return;

        const settingMap = new Map(settings.map((row) => [row.key, row.value]));

        setCommitments(rows.map(mapRow));
        setNextIncomeDate(settingMap.get('next_income_date') || null);
        setExpectedIncomeCents(
          Number.parseInt(settingMap.get('expected_income_cents') || '0', 10) || 0
        );
      } catch (error) {
        console.error('Failed to load safe-to-spend data:', error);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, [db]);

  const saveIncomePlan = useCallback(
    async (date: string | null, incomeCents: number) => {
      await db.withTransactionAsync(async () => {
        await db.runAsync(
          `INSERT INTO app_settings (key, value)
           VALUES ('next_income_date', ?)
           ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
          date ?? ''
        );

        await db.runAsync(
          `INSERT INTO app_settings (key, value)
           VALUES ('expected_income_cents', ?)
           ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
          String(incomeCents)
        );
      });

      await refreshSafeSpend();
    },
    [db, refreshSafeSpend]
  );

  const addCommitment = useCallback(
    async (input: CommitmentInput) => {
      const now = new Date().toISOString();

      const result = await db.runAsync(
        `INSERT INTO planned_commitments
          (name, amount_cents, due_date, category, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        input.name,
        input.amountCents,
        input.dueDate,
        input.category,
        now,
        now
      );

      await refreshSafeSpend();
      return result.lastInsertRowId;
    },
    [db, refreshSafeSpend]
  );

  const updateCommitment = useCallback(
    async (id: number, input: CommitmentInput) => {
      await db.runAsync(
        `UPDATE planned_commitments
         SET
          name = ?,
          amount_cents = ?,
          due_date = ?,
          category = ?,
          updated_at = ?
         WHERE id = ?`,
        input.name,
        input.amountCents,
        input.dueDate,
        input.category,
        new Date().toISOString(),
        id
      );

      await refreshSafeSpend();
    },
    [db, refreshSafeSpend]
  );

  const deleteCommitment = useCallback(
    async (id: number) => {
      await db.runAsync('DELETE FROM planned_commitments WHERE id = ?', id);
      await refreshSafeSpend();
    },
    [db, refreshSafeSpend]
  );

  const value = useMemo<SafeSpendContextValue>(
    () => ({
      commitments,
      loading,
      nextIncomeDate,
      expectedIncomeCents,
      refreshSafeSpend,
      saveIncomePlan,
      addCommitment,
      updateCommitment,
      deleteCommitment,
    }),
    [
      commitments,
      loading,
      nextIncomeDate,
      expectedIncomeCents,
      refreshSafeSpend,
      saveIncomePlan,
      addCommitment,
      updateCommitment,
      deleteCommitment,
    ]
  );

  return (
    <SafeSpendContext.Provider value={value}>
      {children}
    </SafeSpendContext.Provider>
  );
}

export function useSafeSpend() {
  const context = useContext(SafeSpendContext);

  if (!context) {
    throw new Error('useSafeSpend must be used inside SafeSpendProvider.');
  }

  return context;
}
