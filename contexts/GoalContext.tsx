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
  GoalEntry,
  GoalEntryInput,
  GoalEntryRow,
  GoalInput,
  GoalRow,
  SavingsGoal,
} from '../types/goal';

type GoalContextValue = {
  goals: SavingsGoal[];
  loading: boolean;
  totalAllocatedCents: number;
  refreshGoals: () => Promise<void>;
  createGoal: (input: GoalInput) => Promise<number>;
  updateGoal: (id: number, input: GoalInput) => Promise<void>;
  deleteGoal: (id: number) => Promise<void>;
  allocateToGoal: (goalId: number, input: GoalEntryInput) => Promise<number>;
};

const GoalContext = createContext<GoalContextValue | null>(null);

export function GoalProvider({ children }: PropsWithChildren) {
  const db = useSQLiteContext();
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [loading, setLoading] = useState(true);

  const loadGoals = useCallback(async () => {
    const goalRows = await db.getAllAsync<GoalRow>(
      `SELECT
        g.id,
        g.name,
        g.target_amount_cents,
        g.target_date,
        g.priority,
        g.emoji,
        g.created_at,
        g.updated_at,
        COALESCE(SUM(
          CASE
            WHEN e.type = 'contribution' THEN e.amount_cents
            WHEN e.type = 'release' THEN -e.amount_cents
            ELSE 0
          END
        ), 0) AS allocated_cents
       FROM savings_goals g
       LEFT JOIN savings_goal_entries e ON e.goal_id = g.id
       GROUP BY g.id
       ORDER BY
         CASE g.priority
           WHEN 'high' THEN 1
           WHEN 'medium' THEN 2
           ELSE 3
         END,
         g.created_at DESC`
    );

    const entryRows = await db.getAllAsync<GoalEntryRow>(
      `SELECT
        id,
        goal_id,
        type,
        amount_cents,
        created_at
       FROM savings_goal_entries
       ORDER BY created_at DESC, id DESC`
    );

    const entriesByGoal = new Map<number, GoalEntry[]>();

    for (const row of entryRows) {
      const entry: GoalEntry = {
        id: row.id,
        goalId: row.goal_id,
        type: row.type,
        amountCents: row.amount_cents,
        createdAt: row.created_at,
      };

      const current = entriesByGoal.get(row.goal_id) ?? [];
      current.push(entry);
      entriesByGoal.set(row.goal_id, current);
    }

    setGoals(
      goalRows.map((row) => ({
        id: row.id,
        name: row.name,
        targetAmountCents: row.target_amount_cents,
        targetDate: row.target_date,
        priority: row.priority,
        emoji: row.emoji,
        allocatedCents: row.allocated_cents,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        entries: entriesByGoal.get(row.id) ?? [],
      }))
    );
  }, [db]);

  useEffect(() => {
    let mounted = true;

    async function run() {
      setLoading(true);
      try {
        const goalRows = await db.getAllAsync<GoalRow>(
          `SELECT
            g.id,
            g.name,
            g.target_amount_cents,
            g.target_date,
            g.priority,
            g.emoji,
            g.created_at,
            g.updated_at,
            COALESCE(SUM(
              CASE
                WHEN e.type = 'contribution' THEN e.amount_cents
                WHEN e.type = 'release' THEN -e.amount_cents
                ELSE 0
              END
            ), 0) AS allocated_cents
           FROM savings_goals g
           LEFT JOIN savings_goal_entries e ON e.goal_id = g.id
           GROUP BY g.id
           ORDER BY
             CASE g.priority
               WHEN 'high' THEN 1
               WHEN 'medium' THEN 2
               ELSE 3
             END,
             g.created_at DESC`
        );

        const entryRows = await db.getAllAsync<GoalEntryRow>(
          `SELECT id, goal_id, type, amount_cents, created_at
           FROM savings_goal_entries
           ORDER BY created_at DESC, id DESC`
        );

        if (!mounted) return;

        const entriesByGoal = new Map<number, GoalEntry[]>();

        for (const row of entryRows) {
          const entry: GoalEntry = {
            id: row.id,
            goalId: row.goal_id,
            type: row.type,
            amountCents: row.amount_cents,
            createdAt: row.created_at,
          };
          const current = entriesByGoal.get(row.goal_id) ?? [];
          current.push(entry);
          entriesByGoal.set(row.goal_id, current);
        }

        setGoals(
          goalRows.map((row) => ({
            id: row.id,
            name: row.name,
            targetAmountCents: row.target_amount_cents,
            targetDate: row.target_date,
            priority: row.priority,
            emoji: row.emoji,
            allocatedCents: row.allocated_cents,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            entries: entriesByGoal.get(row.id) ?? [],
          }))
        );
      } catch (error) {
        console.error('Failed to load goals:', error);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    run();

    return () => {
      mounted = false;
    };
  }, [db]);

  const createGoal = useCallback(
    async (input: GoalInput) => {
      const now = new Date().toISOString();

      const result = await db.runAsync(
        `INSERT INTO savings_goals
          (name, target_amount_cents, target_date, priority, emoji, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        input.name,
        input.targetAmountCents,
        input.targetDate,
        input.priority,
        input.emoji,
        now,
        now
      );

      await loadGoals();
      return result.lastInsertRowId;
    },
    [db, loadGoals]
  );

  const updateGoal = useCallback(
    async (id: number, input: GoalInput) => {
      await db.runAsync(
        `UPDATE savings_goals
         SET
          name = ?,
          target_amount_cents = ?,
          target_date = ?,
          priority = ?,
          emoji = ?,
          updated_at = ?
         WHERE id = ?`,
        input.name,
        input.targetAmountCents,
        input.targetDate,
        input.priority,
        input.emoji,
        new Date().toISOString(),
        id
      );

      await loadGoals();
    },
    [db, loadGoals]
  );

  const deleteGoal = useCallback(
    async (id: number) => {
      await db.runAsync('DELETE FROM savings_goals WHERE id = ?', id);
      await loadGoals();
    },
    [db, loadGoals]
  );

  const allocateToGoal = useCallback(
    async (goalId: number, input: GoalEntryInput) => {
      const result = await db.runAsync(
        `INSERT INTO savings_goal_entries
          (goal_id, type, amount_cents, created_at)
         VALUES (?, ?, ?, ?)`,
        goalId,
        input.type,
        input.amountCents,
        new Date().toISOString()
      );

      await loadGoals();
      return result.lastInsertRowId;
    },
    [db, loadGoals]
  );

  const totalAllocatedCents = useMemo(
    () => goals.reduce((sum, goal) => sum + goal.allocatedCents, 0),
    [goals]
  );

  const value = useMemo<GoalContextValue>(
    () => ({
      goals,
      loading,
      totalAllocatedCents,
      refreshGoals: loadGoals,
      createGoal,
      updateGoal,
      deleteGoal,
      allocateToGoal,
    }),
    [
      goals,
      loading,
      totalAllocatedCents,
      loadGoals,
      createGoal,
      updateGoal,
      deleteGoal,
      allocateToGoal,
    ]
  );

  return <GoalContext.Provider value={value}>{children}</GoalContext.Provider>;
}

export function useGoals() {
  const context = useContext(GoalContext);

  if (!context) {
    throw new Error('useGoals must be used inside GoalProvider.');
  }

  return context;
}
