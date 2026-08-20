import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CategoryBreakdown } from '../../components/insights/CategoryBreakdown';
import { InsightCard } from '../../components/insights/InsightCard';
import { MonthlyCashFlowChart } from '../../components/insights/MonthlyCashFlowChart';
import { Colors } from '../../constants/theme';
import { useBudgets } from '../../contexts/BudgetContext';
import { useGoals } from '../../contexts/GoalContext';
import { useSafeSpend } from '../../contexts/SafeSpendContext';
import { useSavings } from '../../contexts/SavingsContext';
import { useTransactions } from '../../contexts/TransactionContext';
import {
  calculateBudgetProgress,
  getTotalBudgetSummary,
} from '../../utils/budget';
import {
  type AnalyticsRange,
  buildCategoryAnalytics,
  buildMonthlyAnalytics,
  buildRuleBasedInsights,
  filterTransactionsByRange,
  getAverageMonthlyExpenses,
  getSavingsRate,
} from '../../utils/analytics';
import { formatCurrencyFromCents } from '../../utils/currency';
import {
  calculateSafeToSpend,
  getCommitmentsBeforeDate,
} from '../../utils/safe-spend';

const ranges: { key: AnalyticsRange; label: string }[] = [
  { key: '3m', label: '3M' },
  { key: '6m', label: '6M' },
  { key: 'all', label: 'All' },
];

export default function InsightsScreen() {
  const { transactions } = useTransactions();
  const {
    entries,
    currentSavingsCents,
  } = useSavings();
  const { goals, totalAllocatedCents } = useGoals();
  const { commitments, nextIncomeDate } = useSafeSpend();
  const { budgets } = useBudgets();

  const [range, setRange] = useState<AnalyticsRange>('6m');

  const analytics = useMemo(() => {
    const filteredTransactions = filterTransactionsByRange(
      transactions,
      range
    );

    const incomeCents = filteredTransactions
      .filter((item) => item.type === 'income')
      .reduce((sum, item) => sum + item.amountCents, 0);

    const expenseCents = filteredTransactions
      .filter((item) => item.type === 'expense')
      .reduce((sum, item) => sum + item.amountCents, 0);

    const allIncomeCents = transactions
      .filter((item) => item.type === 'income')
      .reduce((sum, item) => sum + item.amountCents, 0);

    const allExpenseCents = transactions
      .filter((item) => item.type === 'expense')
      .reduce((sum, item) => sum + item.amountCents, 0);

    const balanceCents = allIncomeCents - allExpenseCents;

    const relevantCommitments = getCommitmentsBeforeDate(
      commitments,
      nextIncomeDate
    );

    const commitmentCents = relevantCommitments.reduce(
      (sum, item) => sum + item.amountCents,
      0
    );

    const safeToSpendCents = calculateSafeToSpend(
      balanceCents,
      currentSavingsCents,
      commitmentCents
    );

    const monthly = buildMonthlyAnalytics(transactions, range);
    const categories = buildCategoryAnalytics(transactions, range);
    const savingsRate = getSavingsRate(transactions, entries);
    const averageExpenseCents = getAverageMonthlyExpenses(monthly);

    const insights = buildRuleBasedInsights({
      monthly,
      categories,
      savingsRate,
      safeToSpendCents,
      reservedSavingsCents: currentSavingsCents,
      commitmentCents,
    });

    return {
      incomeCents,
      expenseCents,
      netCents: incomeCents - expenseCents,
      balanceCents,
      commitmentCents,
      safeToSpendCents,
      monthly,
      categories,
      savingsRate,
      averageExpenseCents,
      insights,
    };
  }, [
    transactions,
    entries,
    currentSavingsCents,
    commitments,
    nextIncomeDate,
    range,
  ]);

  const budgetProgress = useMemo(
    () => calculateBudgetProgress(budgets, transactions),
    [budgets, transactions]
  );

  const budgetSummary = useMemo(
    () => getTotalBudgetSummary(budgetProgress),
    [budgetProgress]
  );

  const overBudgetCount = budgetProgress.filter(
    (item) => item.status === 'over'
  ).length;

  const completedGoals = goals.filter(
    (goal) => goal.allocatedCents >= goal.targetAmountCents
  ).length;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>ANALYTICS</Text>
            <Text style={styles.title}>Insights</Text>
            <Text style={styles.subtitle}>
              Understand where your money goes and how your habits are changing.
            </Text>
          </View>
        </View>

        <View style={styles.rangeRow}>
          {ranges.map((item) => {
            const active = item.key === range;

            return (
              <Pressable
                key={item.key}
                onPress={() => setRange(item.key)}
                style={[
                  styles.rangeButton,
                  active && styles.rangeButtonActive,
                ]}
              >
                <Text
                  style={[
                    styles.rangeText,
                    active && styles.rangeTextActive,
                  ]}
                >
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.heroGrid}>
          <View style={styles.heroCard}>
            <View style={styles.heroIcon}>
              <Ionicons
                name="trending-up-outline"
                size={20}
                color={Colors.primary}
              />
            </View>
            <Text style={styles.heroLabel}>Net cash flow</Text>
            <Text
              style={[
                styles.heroValue,
                analytics.netCents < 0 && styles.dangerText,
              ]}
            >
              {formatCurrencyFromCents(analytics.netCents)}
            </Text>
          </View>

          <View style={styles.heroCard}>
            <View style={[styles.heroIcon, styles.savingsHeroIcon]}>
              <Ionicons
                name="save-outline"
                size={20}
                color={Colors.success}
              />
            </View>
            <Text style={styles.heroLabel}>Savings rate</Text>
            <Text style={styles.heroValue}>{analytics.savingsRate}%</Text>
          </View>
        </View>

        <View style={styles.snapshotCard}>
          <SnapshotRow
            label="Safe to spend"
            value={analytics.safeToSpendCents}
            icon="shield-checkmark-outline"
            negative={analytics.safeToSpendCents < 0}
          />
          <View style={styles.snapshotDivider} />
          <SnapshotRow
            label="Reserved savings"
            value={currentSavingsCents}
            icon="lock-closed-outline"
          />
          <View style={styles.snapshotDivider} />
          <SnapshotRow
            label="Upcoming commitments"
            value={analytics.commitmentCents}
            icon="calendar-outline"
          />
        </View>

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Monthly cash flow</Text>
            <Text style={styles.sectionMeta}>
              Income compared with expenses
            </Text>
          </View>
        </View>

        <View style={styles.chartCard}>
          <MonthlyCashFlowChart data={analytics.monthly} />

          <View style={styles.chartFooter}>
            <View>
              <Text style={styles.chartFooterLabel}>Average monthly spending</Text>
              <Text style={styles.chartFooterValue}>
                {formatCurrencyFromCents(analytics.averageExpenseCents)}
              </Text>
            </View>

            <View style={styles.chartFooterRight}>
              <Text style={styles.chartFooterLabel}>Period net</Text>
              <Text
                style={[
                  styles.chartFooterValue,
                  analytics.netCents < 0 && styles.dangerText,
                ]}
              >
                {formatCurrencyFromCents(analytics.netCents)}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Where you spend</Text>
            <Text style={styles.sectionMeta}>
              Expense category breakdown
            </Text>
          </View>
        </View>

        <View style={styles.categoryCard}>
          <CategoryBreakdown data={analytics.categories} />
        </View>

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Smart observations</Text>
            <Text style={styles.sectionMeta}>
              Rule-based insights from your own data
            </Text>
          </View>
        </View>

        <View style={styles.insightsCard}>
          {analytics.insights.map((insight, index) => (
            <View key={insight.id}>
              <InsightCard insight={insight} />

              {index < analytics.insights.length - 1 ? (
                <View style={styles.insightDivider} />
              ) : null}
            </View>
          ))}
        </View>

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Budget health</Text>
            <Text style={styles.sectionMeta}>
              This month&apos;s category limits
            </Text>
          </View>
        </View>

        <View style={styles.budgetHealthCard}>
          <View style={styles.budgetHealthRow}>
            <View>
              <Text style={styles.budgetHealthLabel}>Total budget</Text>
              <Text style={styles.budgetHealthValue}>
                {formatCurrencyFromCents(budgetSummary.totalLimitCents)}
              </Text>
            </View>

            <View style={styles.budgetHealthRight}>
              <Text style={styles.budgetHealthLabel}>Spent</Text>
              <Text style={styles.budgetHealthValue}>
                {formatCurrencyFromCents(budgetSummary.totalSpentCents)}
              </Text>
            </View>
          </View>

          <View style={styles.budgetTrack}>
            <View
              style={[
                styles.budgetFill,
                {
                  width: `${Math.min(
                    100,
                    Math.max(0, budgetSummary.percentUsed)
                  )}%`,
                  backgroundColor:
                    budgetSummary.percentUsed >= 100
                      ? Colors.danger
                      : budgetSummary.percentUsed >= 80
                        ? Colors.warning
                        : Colors.primary,
                },
              ]}
            />
          </View>

          <View style={styles.budgetHealthFooter}>
            <Text style={styles.budgetHealthMeta}>
              {budgetSummary.percentUsed}% used
            </Text>

            <Text
              style={[
                styles.budgetHealthMeta,
                overBudgetCount > 0 && styles.dangerText,
              ]}
            >
              {overBudgetCount > 0
                ? `${overBudgetCount} over budget`
                : `${formatCurrencyFromCents(
                    budgetSummary.remainingCents
                  )} remaining`}
            </Text>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Goals snapshot</Text>
            <Text style={styles.sectionMeta}>
              Progress across your savings goals
            </Text>
          </View>
        </View>

        <View style={styles.goalsCard}>
          <View style={styles.goalStat}>
            <Text style={styles.goalStatLabel}>Active goals</Text>
            <Text style={styles.goalStatValue}>{goals.length}</Text>
          </View>

          <View style={styles.goalDivider} />

          <View style={styles.goalStat}>
            <Text style={styles.goalStatLabel}>Completed</Text>
            <Text style={styles.goalStatValue}>{completedGoals}</Text>
          </View>

          <View style={styles.goalDivider} />

          <View style={styles.goalStatWide}>
            <Text style={styles.goalStatLabel}>Allocated</Text>
            <Text style={styles.goalAllocatedValue}>
              {formatCurrencyFromCents(totalAllocatedCents)}
            </Text>
          </View>
        </View>

        <View style={styles.disclaimer}>
          <Ionicons
            name="information-circle-outline"
            size={18}
            color={Colors.primary}
          />
          <Text style={styles.disclaimerText}>
            These insights are calculated locally from your SaveTrack data. No paid AI service is being used.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

type SnapshotRowProps = {
  label: string;
  value: number;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  negative?: boolean;
};

function SnapshotRow({
  label,
  value,
  icon,
  negative = false,
}: SnapshotRowProps) {
  return (
    <View style={styles.snapshotRow}>
      <View style={styles.snapshotIcon}>
        <Ionicons name={icon} size={18} color={Colors.primary} />
      </View>

      <Text style={styles.snapshotLabel}>{label}</Text>

      <Text
        style={[
          styles.snapshotValue,
          negative && styles.dangerText,
        ]}
      >
        {formatCurrencyFromCents(value)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 120,
  },
  header: {
    marginBottom: 18,
  },
  eyebrow: {
    color: Colors.primary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 5,
  },
  title: {
    color: Colors.text,
    fontSize: 29,
    fontWeight: '800',
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 6,
    maxWidth: 340,
  },
  rangeRow: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 15,
    padding: 4,
    marginBottom: 16,
  },
  rangeButton: {
    flex: 1,
    minHeight: 38,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rangeButtonActive: {
    backgroundColor: Colors.primary,
  },
  rangeText: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '800',
  },
  rangeTextActive: {
    color: '#FFFFFF',
  },
  heroGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  heroCard: {
    flex: 1,
    minHeight: 128,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 20,
    padding: 16,
  },
  heroIcon: {
    width: 37,
    height: 37,
    borderRadius: 13,
    backgroundColor: Colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  savingsHeroIcon: {
    backgroundColor: Colors.successSoft,
  },
  heroLabel: {
    color: Colors.textSecondary,
    fontSize: 10,
    fontWeight: '700',
  },
  heroValue: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: '800',
    marginTop: 5,
  },
  dangerText: {
    color: Colors.danger,
  },
  snapshotCard: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 20,
    paddingHorizontal: 15,
    marginBottom: 28,
  },
  snapshotRow: {
    minHeight: 59,
    flexDirection: 'row',
    alignItems: 'center',
  },
  snapshotIcon: {
    width: 35,
    height: 35,
    borderRadius: 12,
    backgroundColor: Colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  snapshotLabel: {
    flex: 1,
    color: Colors.textSecondary,
    fontSize: 11,
    marginLeft: 10,
  },
  snapshotValue: {
    color: Colors.text,
    fontSize: 12,
    fontWeight: '800',
  },
  snapshotDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginLeft: 45,
  },
  sectionHeader: {
    marginBottom: 11,
  },
  sectionTitle: {
    color: Colors.text,
    fontSize: 17,
    fontWeight: '800',
  },
  sectionMeta: {
    color: Colors.textMuted,
    fontSize: 10,
    marginTop: 3,
  },
  chartCard: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 21,
    padding: 16,
    marginBottom: 27,
  },
  chartFooter: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 14,
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  chartFooterRight: {
    alignItems: 'flex-end',
  },
  chartFooterLabel: {
    color: Colors.textMuted,
    fontSize: 9,
  },
  chartFooterValue: {
    color: Colors.text,
    fontSize: 13,
    fontWeight: '800',
    marginTop: 3,
  },
  categoryCard: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 21,
    padding: 17,
    marginBottom: 27,
  },
  insightsCard: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 21,
    paddingHorizontal: 16,
    marginBottom: 27,
  },
  insightDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginLeft: 50,
  },
  budgetHealthCard: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 20,
    padding: 16,
    marginBottom: 27,
  },
  budgetHealthRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  budgetHealthRight: {
    alignItems: 'flex-end',
  },
  budgetHealthLabel: {
    color: Colors.textMuted,
    fontSize: 9,
  },
  budgetHealthValue: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '800',
    marginTop: 3,
  },
  budgetTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: '#E2E8F0',
    overflow: 'hidden',
    marginTop: 14,
  },
  budgetFill: {
    height: '100%',
    borderRadius: 999,
  },
  budgetHealthFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  budgetHealthMeta: {
    color: Colors.textMuted,
    fontSize: 9,
    fontWeight: '700',
  },
  goalsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 20,
    padding: 16,
  },
  goalStat: {
    alignItems: 'center',
    minWidth: 55,
  },
  goalStatWide: {
    flex: 1,
    alignItems: 'center',
  },
  goalDivider: {
    width: 1,
    height: 36,
    backgroundColor: Colors.border,
    marginHorizontal: 12,
  },
  goalStatLabel: {
    color: Colors.textMuted,
    fontSize: 9,
  },
  goalStatValue: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: '800',
    marginTop: 3,
  },
  goalAllocatedValue: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '800',
    marginTop: 4,
  },
  disclaimer: {
    backgroundColor: Colors.primarySoft,
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
    marginTop: 14,
  },
  disclaimerText: {
    flex: 1,
    color: Colors.textSecondary,
    fontSize: 10,
    lineHeight: 16,
  },
});
