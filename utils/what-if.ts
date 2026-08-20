import { calculateSavingsPlan } from './planner';

export type WhatIfScenario = {
  extraIncomeCents: number;
  spendingCutCents: number;
  extraExpenseCents: number;
  currentSafeToSpendCents: number;
  currentBalanceCents: number;
  goalRemainingCents: number;
  baselineWeeklySavingsCents: number;
  extraWeeklySavingsCents: number;
  applyMonthlySurplusToGoal: boolean;
};

export type WhatIfResult = {
  netMonthlyChangeCents: number;
  projectedBalanceCents: number;
  projectedSafeToSpendCents: number;
  oneTimeGoalBoostCents: number;
  projectedGoalRemainingCents: number;
  baselineWeeks: number | null;
  projectedWeeks: number | null;
  weeksSaved: number | null;
  projectedGoalDate: string | null;
};

export function calculateWhatIfScenario(
  input: WhatIfScenario
): WhatIfResult {
  const netMonthlyChangeCents =
    input.extraIncomeCents +
    input.spendingCutCents -
    input.extraExpenseCents;

  const projectedBalanceCents =
    input.currentBalanceCents + netMonthlyChangeCents;

  const projectedSafeToSpendCents =
    input.currentSafeToSpendCents + netMonthlyChangeCents;

  const oneTimeGoalBoostCents = input.applyMonthlySurplusToGoal
    ? Math.max(0, netMonthlyChangeCents)
    : 0;

  const projectedGoalRemainingCents = Math.max(
    0,
    input.goalRemainingCents - oneTimeGoalBoostCents
  );

  const baselinePlan =
    input.goalRemainingCents > 0 && input.baselineWeeklySavingsCents > 0
      ? calculateSavingsPlan(
          input.goalRemainingCents,
          0,
          input.baselineWeeklySavingsCents
        )
      : null;

  const simulatedWeeklySavingsCents =
    input.baselineWeeklySavingsCents + input.extraWeeklySavingsCents;

  const projectedPlan =
    projectedGoalRemainingCents > 0 && simulatedWeeklySavingsCents > 0
      ? calculateSavingsPlan(
          projectedGoalRemainingCents,
          0,
          simulatedWeeklySavingsCents
        )
      : projectedGoalRemainingCents === 0
        ? calculateSavingsPlan(0, 0, simulatedWeeklySavingsCents)
        : null;

  const baselineWeeks = baselinePlan ? baselinePlan.weeks : null;
  const projectedWeeks = projectedPlan ? projectedPlan.weeks : null;

  const weeksSaved =
    baselineWeeks !== null && projectedWeeks !== null
      ? Math.max(0, baselineWeeks - projectedWeeks)
      : null;

  return {
    netMonthlyChangeCents,
    projectedBalanceCents,
    projectedSafeToSpendCents,
    oneTimeGoalBoostCents,
    projectedGoalRemainingCents,
    baselineWeeks,
    projectedWeeks,
    weeksSaved,
    projectedGoalDate: projectedPlan?.estimatedDate ?? null,
  };
}
