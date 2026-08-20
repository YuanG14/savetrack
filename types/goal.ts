export type GoalPriority = 'high' | 'medium' | 'low';
export type GoalEntryType = 'contribution' | 'release';

export type GoalEntry = {
  id: number;
  goalId: number;
  type: GoalEntryType;
  amountCents: number;
  createdAt: string;
};

export type SavingsGoal = {
  id: number;
  name: string;
  targetAmountCents: number;
  targetDate: string | null;
  priority: GoalPriority;
  emoji: string;
  allocatedCents: number;
  createdAt: string;
  updatedAt: string;
  entries: GoalEntry[];
};

export type GoalInput = {
  name: string;
  targetAmountCents: number;
  targetDate: string | null;
  priority: GoalPriority;
  emoji: string;
};

export type GoalEntryInput = {
  type: GoalEntryType;
  amountCents: number;
};

export type GoalRow = {
  id: number;
  name: string;
  target_amount_cents: number;
  target_date: string | null;
  priority: GoalPriority;
  emoji: string;
  allocated_cents: number;
  created_at: string;
  updated_at: string;
};

export type GoalEntryRow = {
  id: number;
  goal_id: number;
  type: GoalEntryType;
  amount_cents: number;
  created_at: string;
};
