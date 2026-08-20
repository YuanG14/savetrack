export type Commitment = {
  id: number;
  name: string;
  amountCents: number;
  dueDate: string;
  category: string;
  createdAt: string;
  updatedAt: string;
};

export type CommitmentInput = {
  name: string;
  amountCents: number;
  dueDate: string;
  category: string;
};

export type CommitmentRow = {
  id: number;
  name: string;
  amount_cents: number;
  due_date: string;
  category: string;
  created_at: string;
  updated_at: string;
};
