import type { Budget, BudgetStatus } from '../types/budget';
import type { Transaction } from '../types/transaction';
import { getCurrentMonthKey } from './date';

export type BudgetProgress = Budget & {
  spentCents: number;
  remainingCents: number;
  percentUsed: number;
  status: BudgetStatus;
};

export function getBudgetStatus(percentUsed: number): BudgetStatus {
  if (percentUsed >= 100) return 'over';
  if (percentUsed >= 80) return 'warning';
  return 'good';
}

export function calculateBudgetProgress(
  budgets: Budget[],
  transactions: Transaction[],
  monthKey: string = getCurrentMonthKey()
): BudgetProgress[] {
  const monthlyExpenses = transactions.filter(
    (transaction) =>
      transaction.type === 'expense' &&
      transaction.transactionDate.startsWith(monthKey)
  );

  return budgets.map((budget) => {
    const spentCents = monthlyExpenses
      .filter((transaction) => transaction.category === budget.category)
      .reduce((sum, transaction) => sum + transaction.amountCents, 0);

    const percentUsed =
      budget.limitCents > 0
        ? Math.round((spentCents / budget.limitCents) * 100)
        : 0;

    return {
      ...budget,
      spentCents,
      remainingCents: budget.limitCents - spentCents,
      percentUsed,
      status: getBudgetStatus(percentUsed),
    };
  });
}

export function getTotalBudgetSummary(progress: BudgetProgress[]) {
  const totalLimitCents = progress.reduce(
    (sum, item) => sum + item.limitCents,
    0
  );

  const totalSpentCents = progress.reduce(
    (sum, item) => sum + item.spentCents,
    0
  );

  const remainingCents = totalLimitCents - totalSpentCents;

  const percentUsed =
    totalLimitCents > 0
      ? Math.round((totalSpentCents / totalLimitCents) * 100)
      : 0;

  return {
    totalLimitCents,
    totalSpentCents,
    remainingCents,
    percentUsed,
  };
}
