export type SavingsEntryType = 'deposit' | 'withdrawal';

export type SavingsEntry = {
  id: number;
  type: SavingsEntryType;
  amountCents: number;
  note: string | null;
  entryDate: string;
  createdAt: string;
};

export type SavingsEntryInput = {
  type: SavingsEntryType;
  amountCents: number;
  note: string;
  entryDate: string;
};

export type SavingsEntryRow = {
  id: number;
  type: SavingsEntryType;
  amount_cents: number;
  note: string | null;
  entry_date: string;
  created_at: string;
};
