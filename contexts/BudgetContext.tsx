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

import type { Budget, BudgetInput, BudgetRow } from '../types/budget';

type BudgetContextValue = {
  budgets: Budget[];
  loading: boolean;
  refreshBudgets: () => Promise<void>;
  addBudget: (input: BudgetInput) => Promise<number>;
  updateBudget: (id: number, input: BudgetInput) => Promise<void>;
  deleteBudget: (id: number) => Promise<void>;
};

const BudgetContext = createContext<BudgetContextValue | null>(null);

function mapRow(row: BudgetRow): Budget {
  return {
    id: row.id,
    category: row.category,
    limitCents: row.limit_cents,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function BudgetProvider({ children }: PropsWithChildren) {
  const db = useSQLiteContext();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshBudgets = useCallback(async () => {
    const rows = await db.getAllAsync<BudgetRow>(
      `SELECT
        id,
        category,
        limit_cents,
        created_at,
        updated_at
       FROM monthly_budgets
       ORDER BY category ASC`
    );

    setBudgets(rows.map(mapRow));
  }, [db]);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);

      try {
        const rows = await db.getAllAsync<BudgetRow>(
          `SELECT
            id,
            category,
            limit_cents,
            created_at,
            updated_at
           FROM monthly_budgets
           ORDER BY category ASC`
        );

        if (mounted) {
          setBudgets(rows.map(mapRow));
        }
      } catch (error) {
        console.error('Failed to load budgets:', error);
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

  const addBudget = useCallback(
    async (input: BudgetInput) => {
      const now = new Date().toISOString();

      const result = await db.runAsync(
        `INSERT INTO monthly_budgets
          (category, limit_cents, created_at, updated_at)
         VALUES (?, ?, ?, ?)`,
        input.category,
        input.limitCents,
        now,
        now
      );

      await refreshBudgets();
      return result.lastInsertRowId;
    },
    [db, refreshBudgets]
  );

  const updateBudget = useCallback(
    async (id: number, input: BudgetInput) => {
      await db.runAsync(
        `UPDATE monthly_budgets
         SET
          category = ?,
          limit_cents = ?,
          updated_at = ?
         WHERE id = ?`,
        input.category,
        input.limitCents,
        new Date().toISOString(),
        id
      );

      await refreshBudgets();
    },
    [db, refreshBudgets]
  );

  const deleteBudget = useCallback(
    async (id: number) => {
      await db.runAsync('DELETE FROM monthly_budgets WHERE id = ?', id);
      await refreshBudgets();
    },
    [db, refreshBudgets]
  );

  const value = useMemo<BudgetContextValue>(
    () => ({
      budgets,
      loading,
      refreshBudgets,
      addBudget,
      updateBudget,
      deleteBudget,
    }),
    [
      budgets,
      loading,
      refreshBudgets,
      addBudget,
      updateBudget,
      deleteBudget,
    ]
  );

  return (
    <BudgetContext.Provider value={value}>
      {children}
    </BudgetContext.Provider>
  );
}

export function useBudgets() {
  const context = useContext(BudgetContext);

  if (!context) {
    throw new Error('useBudgets must be used inside BudgetProvider.');
  }

  return context;
}
