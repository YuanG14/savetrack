export type TransactionType = 'income' | 'expense';
export type TransactionFilter = 'all' | TransactionType;

export type Transaction = {
  id: number;
  type: TransactionType;
  amountCents: number;
  category: string;
  note: string | null;
  transactionDate: string;
  createdAt: string;
  updatedAt: string;
};

export type TransactionInput = {
  type: TransactionType;
  amountCents: number;
  category: string;
  note: string;
  transactionDate: string;
};

export type TransactionRow = {
  id: number;
  type: TransactionType;
  amount_cents: number;
  category: string;
  note: string | null;
  transaction_date: string;
  created_at: string;
  updated_at: string;
};
