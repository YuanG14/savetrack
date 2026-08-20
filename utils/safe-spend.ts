import type { Commitment } from '../types/safe-spend';

export function getDaysUntilDate(value: string | null): number | null {
  if (!value) return null;

  const [year, month, day] = value.split('-').map(Number);
  const target = new Date(year, month - 1, day);
  const today = new Date();

  target.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);

  const diff = Math.ceil(
    (target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  return Math.max(0, diff);
}

export function isDateOnOrBefore(value: string, limit: string): boolean {
  return value <= limit;
}

export function getCommitmentsBeforeDate(
  commitments: Commitment[],
  nextIncomeDate: string | null
): Commitment[] {
  if (!nextIncomeDate) return commitments;

  return commitments.filter((item) =>
    isDateOnOrBefore(item.dueDate, nextIncomeDate)
  );
}

export function calculateSafeToSpend(
  balanceCents: number,
  reservedSavingsCents: number,
  commitmentCents: number
): number {
  return balanceCents - reservedSavingsCents - commitmentCents;
}

export function calculateDailySafeToSpend(
  safeToSpendCents: number,
  daysUntilIncome: number | null
): number | null {
  if (daysUntilIncome === null) return null;

  const divisor = Math.max(1, daysUntilIncome);
  return Math.floor(safeToSpendCents / divisor);
}
