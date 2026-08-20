export type AffordabilityStatus =
  | 'comfortable'
  | 'possible'
  | 'risky'
  | 'not-recommended';

export type AffordabilityResult = {
  status: AffordabilityStatus;
  remainingSafeCents: number;
  purchaseUsesReservedSavings: boolean;
  purchaseExceedsBalance: boolean;
  safeSpendUsagePercent: number;
};

export function evaluatePurchase(
  purchaseCents: number,
  balanceCents: number,
  safeToSpendCents: number,
  reservedSavingsCents: number
): AffordabilityResult {
  const remainingSafeCents = safeToSpendCents - purchaseCents;
  const purchaseExceedsBalance = purchaseCents > balanceCents;
  const purchaseUsesReservedSavings = purchaseCents > safeToSpendCents;

  const safeSpendUsagePercent =
    safeToSpendCents > 0
      ? Math.round((purchaseCents / safeToSpendCents) * 100)
      : purchaseCents > 0
        ? 100
        : 0;

  let status: AffordabilityStatus = 'comfortable';

  if (purchaseExceedsBalance) {
    status = 'not-recommended';
  } else if (purchaseUsesReservedSavings) {
    status = 'risky';
  } else if (safeSpendUsagePercent >= 70) {
    status = 'possible';
  }

  return {
    status,
    remainingSafeCents,
    purchaseUsesReservedSavings,
    purchaseExceedsBalance,
    safeSpendUsagePercent,
  };
}

export function calculateGoalDelayWeeks(
  purchaseCents: number,
  weeklySavingsCents: number
): number | null {
  if (purchaseCents <= 0 || weeklySavingsCents <= 0) {
    return null;
  }

  return Math.ceil(purchaseCents / weeklySavingsCents);
}
