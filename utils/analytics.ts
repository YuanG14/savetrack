import type { SavingsEntry } from '../types/savings';
import type { Transaction } from '../types/transaction';

export type AnalyticsRange = '3m' | '6m' | 'all';

export type MonthlyAnalytics = {
  key: string;
  label: string;
  incomeCents: number;
  expenseCents: number;
  netCents: number;
};

export type CategoryAnalytics = {
  category: string;
  amountCents: number;
  percent: number;
};

export type InsightItem = {
  id: string;
  title: string;
  body: string;
  tone: 'positive' | 'warning' | 'neutral';
};

function monthKeyFromDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

function formatMonthLabel(key: string): string {
  const [year, month] = key.split('-').map(Number);
  return new Intl.DateTimeFormat('en-PH', {
    month: 'short',
  }).format(new Date(year, month - 1, 1));
}

export function getRangeStartKey(range: AnalyticsRange): string | null {
  if (range === 'all') return null;

  const now = new Date();
  const months = range === '3m' ? 3 : 6;
  const start = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);

  return monthKeyFromDate(start);
}

export function filterTransactionsByRange(
  transactions: Transaction[],
  range: AnalyticsRange
): Transaction[] {
  const startKey = getRangeStartKey(range);

  if (!startKey) return transactions;

  return transactions.filter(
    (transaction) => transaction.transactionDate.slice(0, 7) >= startKey
  );
}

export function buildMonthlyAnalytics(
  transactions: Transaction[],
  range: AnalyticsRange
): MonthlyAnalytics[] {
  const grouped = new Map<string, MonthlyAnalytics>();

  for (const transaction of filterTransactionsByRange(transactions, range)) {
    const key = transaction.transactionDate.slice(0, 7);
    const current =
      grouped.get(key) ??
      {
        key,
        label: formatMonthLabel(key),
        incomeCents: 0,
        expenseCents: 0,
        netCents: 0,
      };

    if (transaction.type === 'income') {
      current.incomeCents += transaction.amountCents;
    } else {
      current.expenseCents += transaction.amountCents;
    }

    current.netCents = current.incomeCents - current.expenseCents;
    grouped.set(key, current);
  }

  return [...grouped.values()].sort((a, b) => a.key.localeCompare(b.key));
}

export function buildCategoryAnalytics(
  transactions: Transaction[],
  range: AnalyticsRange
): CategoryAnalytics[] {
  const expenses = filterTransactionsByRange(transactions, range).filter(
    (transaction) => transaction.type === 'expense'
  );

  const totalExpenseCents = expenses.reduce(
    (sum, transaction) => sum + transaction.amountCents,
    0
  );

  const grouped = new Map<string, number>();

  for (const expense of expenses) {
    grouped.set(
      expense.category,
      (grouped.get(expense.category) ?? 0) + expense.amountCents
    );
  }

  return [...grouped.entries()]
    .map(([category, amountCents]) => ({
      category,
      amountCents,
      percent:
        totalExpenseCents > 0
          ? Math.round((amountCents / totalExpenseCents) * 100)
          : 0,
    }))
    .sort((a, b) => b.amountCents - a.amountCents);
}

export function getSavingsRate(
  transactions: Transaction[],
  savingsEntries: SavingsEntry[]
): number {
  const now = new Date();
  const monthKey = monthKeyFromDate(now);

  const incomeCents = transactions
    .filter(
      (transaction) =>
        transaction.type === 'income' &&
        transaction.transactionDate.startsWith(monthKey)
    )
    .reduce((sum, transaction) => sum + transaction.amountCents, 0);

  const netSavingsCents = savingsEntries
    .filter((entry) => entry.entryDate.startsWith(monthKey))
    .reduce(
      (sum, entry) =>
        entry.type === 'deposit'
          ? sum + entry.amountCents
          : sum - entry.amountCents,
      0
    );

  if (incomeCents <= 0) return 0;

  return Math.round((netSavingsCents / incomeCents) * 100);
}

export function getAverageMonthlyExpenses(
  monthly: MonthlyAnalytics[]
): number {
  if (monthly.length === 0) return 0;

  const total = monthly.reduce(
    (sum, item) => sum + item.expenseCents,
    0
  );

  return Math.round(total / monthly.length);
}

export function buildRuleBasedInsights(args: {
  monthly: MonthlyAnalytics[];
  categories: CategoryAnalytics[];
  savingsRate: number;
  safeToSpendCents: number;
  reservedSavingsCents: number;
  commitmentCents: number;
}): InsightItem[] {
  const {
    monthly,
    categories,
    savingsRate,
    safeToSpendCents,
    reservedSavingsCents,
    commitmentCents,
  } = args;

  const insights: InsightItem[] = [];
  const latest = monthly.at(-1);
  const previous = monthly.at(-2);
  const topCategory = categories[0];

  if (latest && previous && previous.expenseCents > 0) {
    const change = Math.round(
      ((latest.expenseCents - previous.expenseCents) /
        previous.expenseCents) *
        100
    );

    if (change <= -10) {
      insights.push({
        id: 'expense-down',
        title: 'Spending is trending down',
        body: `Your expenses are about ${Math.abs(
          change
        )}% lower than the previous month.`,
        tone: 'positive',
      });
    } else if (change >= 10) {
      insights.push({
        id: 'expense-up',
        title: 'Spending increased',
        body: `Your expenses are about ${change}% higher than the previous month.`,
        tone: 'warning',
      });
    }
  }

  if (topCategory) {
    insights.push({
      id: 'top-category',
      title: `${topCategory.category} is your biggest expense`,
      body: `It accounts for about ${topCategory.percent}% of spending in the selected period.`,
      tone: topCategory.percent >= 40 ? 'warning' : 'neutral',
    });
  }

  if (savingsRate >= 20) {
    insights.push({
      id: 'savings-rate-good',
      title: 'Strong savings rate',
      body: `You are saving about ${savingsRate}% of this month's recorded income.`,
      tone: 'positive',
    });
  } else if (savingsRate > 0 && savingsRate < 10) {
    insights.push({
      id: 'savings-rate-low',
      title: 'Savings rate is currently low',
      body: `You are saving about ${savingsRate}% of this month's recorded income.`,
      tone: 'warning',
    });
  }

  if (safeToSpendCents < 0) {
    insights.push({
      id: 'safe-negative',
      title: 'Protected money is under pressure',
      body:
        'Your reserved savings and upcoming commitments are greater than your current available balance.',
      tone: 'warning',
    });
  } else if (safeToSpendCents > 0 && commitmentCents > safeToSpendCents) {
    insights.push({
      id: 'commitment-heavy',
      title: 'Upcoming commitments are significant',
      body:
        'A large portion of your available money is already assigned to upcoming obligations.',
      tone: 'warning',
    });
  }

  if (reservedSavingsCents > 0 && safeToSpendCents > 0) {
    insights.push({
      id: 'savings-protected',
      title: 'Your savings are being protected',
      body:
        'Safe-to-Spend keeps reserved savings separate from money you can freely use.',
      tone: 'positive',
    });
  }

  if (insights.length === 0) {
    insights.push({
      id: 'need-data',
      title: 'Keep tracking',
      body:
        'Add more transactions and savings activity to unlock stronger trends and comparisons.',
      tone: 'neutral',
    });
  }

  return insights.slice(0, 4);
}
