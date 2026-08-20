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
  Transaction,
  TransactionInput,
  TransactionRow,
} from '../types/transaction';

type TransactionContextValue = {
  transactions: Transaction[];
  loading: boolean;
  refreshTransactions: () => Promise<void>;
  addTransaction: (input: TransactionInput) => Promise<number>;
  updateTransaction: (id: number, input: TransactionInput) => Promise<void>;
  deleteTransaction: (id: number) => Promise<void>;
};

const TransactionContext = createContext<TransactionContextValue | null>(null);

function mapRow(row: TransactionRow): Transaction {
  return {
    id: row.id,
    type: row.type,
    amountCents: row.amount_cents,
    category: row.category,
    note: row.note,
    transactionDate: row.transaction_date,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function TransactionProvider({ children }: PropsWithChildren) {
  const db = useSQLiteContext();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshTransactions = useCallback(async () => {
    const rows = await db.getAllAsync<TransactionRow>(
      `SELECT
        id,
        type,
        amount_cents,
        category,
        note,
        transaction_date,
        created_at,
        updated_at
       FROM transactions
       ORDER BY transaction_date DESC, id DESC`
    );

    setTransactions(rows.map(mapRow));
  }, [db]);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      try {
        const rows = await db.getAllAsync<TransactionRow>(
          `SELECT
            id,
            type,
            amount_cents,
            category,
            note,
            transaction_date,
            created_at,
            updated_at
           FROM transactions
           ORDER BY transaction_date DESC, id DESC`
        );

        if (mounted) {
          setTransactions(rows.map(mapRow));
        }
      } catch (error) {
        console.error('Failed to load transactions:', error);
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

  const addTransaction = useCallback(
    async (input: TransactionInput) => {
      const now = new Date().toISOString();

      const result = await db.runAsync(
        `INSERT INTO transactions
          (type, amount_cents, category, note, transaction_date, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        input.type,
        input.amountCents,
        input.category,
        input.note || null,
        input.transactionDate,
        now,
        now
      );

      await refreshTransactions();
      return result.lastInsertRowId;
    },
    [db, refreshTransactions]
  );

  const updateTransaction = useCallback(
    async (id: number, input: TransactionInput) => {
      const now = new Date().toISOString();

      await db.runAsync(
        `UPDATE transactions
         SET
          type = ?,
          amount_cents = ?,
          category = ?,
          note = ?,
          transaction_date = ?,
          updated_at = ?
         WHERE id = ?`,
        input.type,
        input.amountCents,
        input.category,
        input.note || null,
        input.transactionDate,
        now,
        id
      );

      await refreshTransactions();
    },
    [db, refreshTransactions]
  );

  const deleteTransaction = useCallback(
    async (id: number) => {
      await db.runAsync('DELETE FROM transactions WHERE id = ?', id);
      await refreshTransactions();
    },
    [db, refreshTransactions]
  );

  const value = useMemo<TransactionContextValue>(
    () => ({
      transactions,
      loading,
      refreshTransactions,
      addTransaction,
      updateTransaction,
      deleteTransaction,
    }),
    [
      addTransaction,
      deleteTransaction,
      loading,
      refreshTransactions,
      transactions,
      updateTransaction,
    ]
  );

  return (
    <TransactionContext.Provider value={value}>
      {children}
    </TransactionContext.Provider>
  );
}

export function useTransactions() {
  const context = useContext(TransactionContext);

  if (!context) {
    throw new Error(
      'useTransactions must be used inside TransactionProvider.'
    );
  }

  return context;
}
