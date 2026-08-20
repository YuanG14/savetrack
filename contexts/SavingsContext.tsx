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
  SavingsEntry,
  SavingsEntryInput,
  SavingsEntryRow,
} from '../types/savings';

type SavingsContextValue = {
  entries: SavingsEntry[];
  loading: boolean;
  currentSavingsCents: number;
  monthlyTargetCents: number;
  refreshSavings: () => Promise<void>;
  addSavingsEntry: (input: SavingsEntryInput) => Promise<number>;
  saveMonthlyTarget: (amountCents: number) => Promise<void>;
};

const SavingsContext = createContext<SavingsContextValue | null>(null);

function mapRow(row: SavingsEntryRow): SavingsEntry {
  return {
    id: row.id,
    type: row.type,
    amountCents: row.amount_cents,
    note: row.note,
    entryDate: row.entry_date,
    createdAt: row.created_at,
  };
}

export function SavingsProvider({ children }: PropsWithChildren) {
  const db = useSQLiteContext();
  const [entries, setEntries] = useState<SavingsEntry[]>([]);
  const [monthlyTargetCents, setMonthlyTargetCents] = useState(0);
  const [loading, setLoading] = useState(true);

  const refreshSavings = useCallback(async () => {
    const rows = await db.getAllAsync<SavingsEntryRow>(
      `SELECT
        id,
        type,
        amount_cents,
        note,
        entry_date,
        created_at
       FROM savings_entries
       ORDER BY entry_date DESC, id DESC`
    );

    const targetRow = await db.getFirstAsync<{ value: string }>(
      `SELECT value
       FROM app_settings
       WHERE key = 'monthly_savings_target_cents'`
    );

    setEntries(rows.map(mapRow));
    setMonthlyTargetCents(
      targetRow ? Number.parseInt(targetRow.value, 10) || 0 : 0
    );
  }, [db]);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);

      try {
        const rows = await db.getAllAsync<SavingsEntryRow>(
          `SELECT
            id,
            type,
            amount_cents,
            note,
            entry_date,
            created_at
           FROM savings_entries
           ORDER BY entry_date DESC, id DESC`
        );

        const targetRow = await db.getFirstAsync<{ value: string }>(
          `SELECT value
           FROM app_settings
           WHERE key = 'monthly_savings_target_cents'`
        );

        if (mounted) {
          setEntries(rows.map(mapRow));
          setMonthlyTargetCents(
            targetRow ? Number.parseInt(targetRow.value, 10) || 0 : 0
          );
        }
      } catch (error) {
        console.error('Failed to load savings:', error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, [db]);

  const currentSavingsCents = useMemo(
    () =>
      entries.reduce(
        (sum, entry) =>
          entry.type === 'deposit'
            ? sum + entry.amountCents
            : sum - entry.amountCents,
        0
      ),
    [entries]
  );

  const addSavingsEntry = useCallback(
    async (input: SavingsEntryInput) => {
      const result = await db.runAsync(
        `INSERT INTO savings_entries
          (type, amount_cents, note, entry_date, created_at)
         VALUES (?, ?, ?, ?, ?)`,
        input.type,
        input.amountCents,
        input.note || null,
        input.entryDate,
        new Date().toISOString()
      );

      await refreshSavings();
      return result.lastInsertRowId;
    },
    [db, refreshSavings]
  );

  const saveMonthlyTarget = useCallback(
    async (amountCents: number) => {
      await db.runAsync(
        `INSERT INTO app_settings (key, value)
         VALUES ('monthly_savings_target_cents', ?)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
        String(amountCents)
      );

      await refreshSavings();
    },
    [db, refreshSavings]
  );

  const value = useMemo<SavingsContextValue>(
    () => ({
      entries,
      loading,
      currentSavingsCents,
      monthlyTargetCents,
      refreshSavings,
      addSavingsEntry,
      saveMonthlyTarget,
    }),
    [
      entries,
      loading,
      currentSavingsCents,
      monthlyTargetCents,
      refreshSavings,
      addSavingsEntry,
      saveMonthlyTarget,
    ]
  );

  return (
    <SavingsContext.Provider value={value}>
      {children}
    </SavingsContext.Provider>
  );
}

export function useSavings() {
  const context = useContext(SavingsContext);

  if (!context) {
    throw new Error('useSavings must be used inside SavingsProvider.');
  }

  return context;
}
