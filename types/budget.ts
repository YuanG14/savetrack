export type Budget = {
  id: number;
  category: string;
  limitCents: number;
  createdAt: string;
  updatedAt: string;
};

export type BudgetInput = {
  category: string;
  limitCents: number;
};

export type BudgetRow = {
  id: number;
  category: string;
  limit_cents: number;
  created_at: string;
  updated_at: string;
};

export type BudgetStatus = 'good' | 'warning' | 'over';
