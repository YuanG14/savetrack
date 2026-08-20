import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GoalCard } from '../../components/goals/GoalCard';
import { TransactionRow } from '../../components/transactions/TransactionRow';
import { Colors } from '../../constants/theme';
import { useBudgets } from '../../contexts/BudgetContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { useGoals } from '../../contexts/GoalContext';
import { useSafeSpend } from '../../contexts/SafeSpendContext';
import { useSavings } from '../../contexts/SavingsContext';
import { useSecurity } from '../../contexts/SecurityContext';
import { useTransactions } from '../../contexts/TransactionContext';
import {
  calculateBudgetProgress,
  getTotalBudgetSummary,
} from '../../utils/budget';
import { formatCurrencyFromCents } from '../../utils/currency';
import { getCurrentMonthKey } from '../../utils/date';
import {
  calculateDailySafeToSpend,
  calculateSafeToSpend,
  getCommitmentsBeforeDate,
  getDaysUntilDate,
} from '../../utils/safe-spend';

export default function HomeScreen() {
  const router = useRouter();
  const { transactions, loading: transactionsLoading } = useTransactions();
  const { currentSavingsCents, loading: savingsLoading } = useSavings();
  const {
    goals,
    totalAllocatedCents,
    loading: goalsLoading,
  } = useGoals();
  const {
    commitments,
    nextIncomeDate,
    loading: safeSpendLoading,
  } = useSafeSpend();
  const { budgets, loading: budgetsLoading } = useBudgets();
  const {
    preferences: notificationPreferences,
    permissionState: notificationPermission,
  } = useNotifications();
  const {
    preferences: securityPreferences,
  } = useSecurity();

  const summary = useMemo(() => {
    const monthKey = getCurrentMonthKey();
    const thisMonth = transactions.filter((item) =>
      item.transactionDate.startsWith(monthKey)
    );

    const incomeCents = thisMonth
      .filter((item) => item.type === 'income')
      .reduce((sum, item) => sum + item.amountCents, 0);

    const expenseCents = thisMonth
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

    const daysUntilIncome = getDaysUntilDate(nextIncomeDate);
    const dailyCents = calculateDailySafeToSpend(
      Math.max(0, safeToSpendCents),
      daysUntilIncome
    );

    return {
      incomeCents,
      expenseCents,
      balanceCents,
      commitmentCents,
      safeToSpendCents,
      dailyCents,
      daysUntilIncome,
    };
  }, [transactions, currentSavingsCents, commitments, nextIncomeDate]);

  const recentTransactions = transactions.slice(0, 4);
  const featuredGoal = goals[0];

  const budgetProgress = useMemo(
    () => calculateBudgetProgress(budgets, transactions),
    [budgets, transactions]
  );

  const budgetSummary = useMemo(
    () => getTotalBudgetSummary(budgetProgress),
    [budgetProgress]
  );

  const budgetAlerts = budgetProgress.filter(
    (item) => item.status === 'warning' || item.status === 'over'
  ).length;

  void securityPreferences.hideBalancesEnabled;

  const loading =
    transactionsLoading ||
    savingsLoading ||
    goalsLoading ||
    safeSpendLoading ||
    budgetsLoading;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.brandRow}>
          <Text style={styles.eyebrow}>SAVETRACK</Text>

          <Pressable
            style={styles.notificationButton}
            onPress={() => router.push('/notifications')}
            accessibilityRole="button"
            accessibilityLabel="Notification settings"
          >
            <Ionicons
              name={
                notificationPreferences.enabled &&
                notificationPermission === 'granted'
                  ? 'notifications-outline'
                  : 'notifications-off-outline'
              }
              size={19}
              color={Colors.primary}
            />

            {notificationPreferences.enabled &&
            notificationPermission === 'granted' ? (
              <View style={styles.notificationDot} />
            ) : null}
          </Pressable>
        </View>

        <View style={styles.heroTitleRow}>
          <Text style={styles.title}>Your money today</Text>

          <Pressable
            style={styles.headerAddButton}
            onPress={() => router.push('/add-transaction')}
            accessibilityRole="button"
            accessibilityLabel="Add transaction"
          >
            <Ionicons name="add" size={24} color="#FFFFFF" />
          </Pressable>
        </View>

        <View style={styles.balanceCard}>
          <View style={styles.balanceTopRow}>
            <Text style={styles.balanceLabel}>Available balance</Text>
            <View style={styles.balanceIcon}>
              <Ionicons name="wallet-outline" size={18} color="#FFFFFF" />
            </View>
          </View>

          {loading ? (
            <ActivityIndicator
              size="small"
              color="#FFFFFF"
              style={styles.balanceLoader}
            />
          ) : (
            <Text style={styles.balance}>
              {formatCurrencyFromCents(summary.balanceCents)}
            </Text>
          )}

          <Text style={styles.balanceDescription}>
            Income minus expenses across all recorded transactions.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>This month</Text>

        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Income</Text>
            <Text style={styles.summaryValue}>
              {formatCurrencyFromCents(summary.incomeCents)}
            </Text>
          </View>

          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Spent</Text>
            <Text style={styles.summaryValue}>
              {formatCurrencyFromCents(summary.expenseCents)}
            </Text>
          </View>
        </View>

        <Pressable
          style={[
            styles.safeCard,
            summary.safeToSpendCents < 0 && styles.safeCardDanger,
          ]}
          onPress={() => router.push('/safe-to-spend')}
        >
          <View style={styles.safeTopRow}>
            <View>
              <Text style={styles.safeLabel}>Safe to spend</Text>
              <Text
                style={[
                  styles.safeValue,
                  summary.safeToSpendCents < 0 && styles.safeValueDanger,
                ]}
              >
                {formatCurrencyFromCents(summary.safeToSpendCents)}
              </Text>
            </View>

            <View style={styles.safeIcon}>
              <Ionicons
                name="shield-checkmark-outline"
                size={22}
                color={
                  summary.safeToSpendCents < 0 ? Colors.danger : Colors.primary
                }
              />
            </View>
          </View>

          <View style={styles.safeDivider} />

          <View style={styles.safeBottomRow}>
            <View>
              <Text style={styles.safeMetaLabel}>Daily allowance</Text>
              <Text style={styles.safeMetaValue}>
                {summary.dailyCents === null
                  ? 'Set income date'
                  : `${formatCurrencyFromCents(summary.dailyCents)}/day`}
              </Text>
            </View>

            <View style={styles.safeMetaRight}>
              <Text style={styles.safeMetaLabel}>Upcoming reserved</Text>
              <Text style={styles.safeMetaValue}>
                {formatCurrencyFromCents(summary.commitmentCents)}
              </Text>
            </View>
          </View>

          <View style={styles.safeLinkRow}>
            <Text style={styles.safeLink}>See safe-to-spend breakdown</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.primary} />
          </View>
        </Pressable>

        <View style={styles.toolsRow}>
          <Pressable
            style={styles.toolShortcut}
            onPress={() => router.push('/what-if')}
          >
            <View style={styles.toolIcon}>
              <Ionicons name="git-compare-outline" size={19} color={Colors.primary} />
            </View>
            <Text style={styles.toolTitle}>What if?</Text>
            <Text style={styles.toolMeta}>Simulate changes</Text>
          </Pressable>

          <Pressable
            style={styles.toolShortcut}
            onPress={() => router.push('/can-i-afford-it')}
          >
            <View style={styles.toolIcon}>
              <Ionicons name="bag-check-outline" size={19} color={Colors.primary} />
            </View>
            <Text style={styles.toolTitle}>Can I afford it?</Text>
            <Text style={styles.toolMeta}>Check a purchase</Text>
          </Pressable>
        </View>

        <Pressable
          style={styles.affordabilityShortcutHidden}
          onPress={() => router.push('/can-i-afford-it')}
        >
          <View style={styles.affordabilityShortcutIcon}>
            <Ionicons name="bag-check-outline" size={20} color={Colors.primary} />
          </View>

          <View style={styles.affordabilityShortcutText}>
            <Text style={styles.affordabilityShortcutTitle}>Can I afford it?</Text>
            <Text style={styles.affordabilityShortcutMeta}>
              Check a purchase before spending.
            </Text>
          </View>

          <Ionicons name="chevron-forward" size={17} color={Colors.textMuted} />
        </Pressable>

        <View style={styles.moneyStatusGrid}>
          <Pressable
            style={styles.savingsCard}
            onPress={() => router.push('/goals')}
          >
            <Text style={styles.miniCardLabel}>Reserved savings</Text>
            <Text style={styles.miniCardValue}>
              {formatCurrencyFromCents(currentSavingsCents)}
            </Text>
            <Text style={styles.miniCardMeta}>
              {formatCurrencyFromCents(totalAllocatedCents)} assigned to goals
            </Text>
          </Pressable>

          <Pressable
            style={styles.commitmentCard}
            onPress={() => router.push('/safe-to-spend')}
          >
            <Text style={styles.miniCardLabel}>Commitments</Text>
            <Text style={styles.miniCardValue}>
              {formatCurrencyFromCents(summary.commitmentCents)}
            </Text>
            <Text style={styles.miniCardMeta}>
              {summary.daysUntilIncome === null
                ? 'Before next income'
                : summary.daysUntilIncome === 0
                  ? 'Due by today'
                  : `Due in next ${summary.daysUntilIncome} days`}
            </Text>
          </Pressable>
        </View>

        <Pressable
          style={styles.cloudShortcut}
          onPress={() => router.push('/cloud')}
        >
          <View style={styles.cloudShortcutIcon}>
            <Ionicons name="cloud-outline" size={19} color={Colors.primary} />
          </View>

          <View style={styles.cloudShortcutText}>
            <Text style={styles.cloudShortcutTitle}>Account & privacy</Text>
            <Text style={styles.cloudShortcutMeta}>
              Manage cloud backup, sign-in, and app security.
            </Text>
          </View>

          <Ionicons name="chevron-forward" size={17} color={Colors.textMuted} />
        </Pressable>

        <Pressable
          style={[
            styles.budgetShortcut,
            budgetAlerts > 0 && styles.budgetShortcutWarning,
          ]}
          onPress={() => router.push('/budgets')}
        >
          <View
            style={[
              styles.budgetShortcutIcon,
              budgetAlerts > 0 && styles.budgetShortcutIconWarning,
            ]}
          >
            <Ionicons
              name="pie-chart-outline"
              size={19}
              color={budgetAlerts > 0 ? Colors.warning : Colors.primary}
            />
          </View>

          <View style={styles.budgetShortcutText}>
            <Text style={styles.budgetShortcutTitle}>Monthly budgets</Text>
            <Text style={styles.budgetShortcutMeta}>
              {budgets.length === 0
                ? 'Set category spending limits'
                : `${formatCurrencyFromCents(
                    budgetSummary.totalSpentCents
                  )} of ${formatCurrencyFromCents(
                    budgetSummary.totalLimitCents
                  )} used`}
            </Text>
          </View>

          {budgetAlerts > 0 ? (
            <View style={styles.budgetAlertPill}>
              <Text style={styles.budgetAlertText}>{budgetAlerts}</Text>
            </View>
          ) : (
            <Ionicons
              name="chevron-forward"
              size={17}
              color={Colors.textMuted}
            />
          )}
        </Pressable>

        <Pressable
          style={styles.insightsShortcut}
          onPress={() => router.push('/insights')}
        >
          <View style={styles.insightsShortcutIcon}>
            <Ionicons name="bar-chart-outline" size={19} color={Colors.primary} />
          </View>

          <View style={styles.insightsShortcutText}>
            <Text style={styles.insightsShortcutTitle}>See your money trends</Text>
            <Text style={styles.insightsShortcutMeta}>
              Explore spending categories, cash flow, and savings insights.
            </Text>
          </View>

          <Ionicons name="chevron-forward" size={17} color={Colors.textMuted} />
        </Pressable>

        {featuredGoal ? (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Priority goal</Text>
              <Pressable onPress={() => router.push('/goals')}>
                <Text style={styles.viewAll}>View goals</Text>
              </Pressable>
            </View>
            <GoalCard goal={featuredGoal} />
          </>
        ) : null}

        <View style={[styles.sectionHeader, styles.transactionsHeader]}>
          <Text style={styles.sectionTitle}>Recent transactions</Text>
          <Pressable onPress={() => router.push('/transactions')}>
            <Text style={styles.viewAll}>View all</Text>
          </Pressable>
        </View>

        {transactionsLoading ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator color={Colors.primary} />
          </View>
        ) : recentTransactions.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No transactions yet</Text>
            <Text style={styles.emptyDescription}>
              Add your first income or expense to start tracking your money.
            </Text>
          </View>
        ) : (
          <View style={styles.transactionList}>
            {recentTransactions.map((transaction) => (
              <TransactionRow key={transaction.id} transaction={transaction} />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  content: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 120 },
  brandRow: {
    minHeight: 38,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  eyebrow: {
    color: Colors.primary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  heroTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 14,
    marginBottom: 24,
  },
  title: {
    flex: 1,
    color: Colors.text,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '800',
  },
  notificationButton: {
    width: 38,
    height: 38,
    borderRadius: 13,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationDot: {
    position: 'absolute',
    top: 7,
    right: 7,
    width: 7,
    height: 7,
    borderRadius: 999,
    backgroundColor: Colors.success,
    borderWidth: 1.5,
    borderColor: Colors.surface,
  },
  headerAddButton: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  balanceCard: {
    backgroundColor: Colors.primary,
    borderRadius: 26,
    padding: 24,
    marginBottom: 28,
  },
  balanceTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  balanceIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  balanceLabel: { color: '#DBEAFE', fontSize: 14, fontWeight: '600' },
  balanceLoader: { alignSelf: 'flex-start', marginVertical: 17 },
  balance: {
    color: '#FFFFFF',
    fontSize: 38,
    fontWeight: '800',
    marginTop: 8,
    marginBottom: 8,
  },
  balanceDescription: { color: '#BFDBFE', fontSize: 13, lineHeight: 19 },
  sectionTitle: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 14,
  },
  summaryRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  summaryCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  summaryLabel: { color: Colors.textSecondary, fontSize: 12, marginBottom: 5 },
  summaryValue: { color: Colors.text, fontSize: 18, fontWeight: '800' },
  safeCard: {
    backgroundColor: Colors.primarySoft,
    borderRadius: 22,
    padding: 18,
    marginBottom: 14,
  },
  safeCardDanger: { backgroundColor: Colors.dangerSoft },
  safeTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  safeLabel: { color: Colors.textSecondary, fontSize: 11, fontWeight: '700' },
  safeValue: {
    color: Colors.primaryDark,
    fontSize: 27,
    fontWeight: '800',
    marginTop: 4,
  },
  safeValueDanger: { color: Colors.danger },
  safeIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  safeDivider: { height: 1, backgroundColor: '#DBEAFE', marginVertical: 14 },
  safeBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  safeMetaRight: { alignItems: 'flex-end' },
  safeMetaLabel: { color: Colors.textMuted, fontSize: 9 },
  safeMetaValue: { color: Colors.text, fontSize: 12, fontWeight: '800', marginTop: 3 },
  safeLinkRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 14,
  },
  safeLink: { color: Colors.primary, fontSize: 10, fontWeight: '800' },
  toolsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  toolShortcut: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 18,
    padding: 14,
  },
  toolIcon: {
    width: 38,
    height: 38,
    borderRadius: 13,
    backgroundColor: Colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  toolTitle: {
    color: Colors.text,
    fontSize: 11,
    fontWeight: '800',
  },
  toolMeta: {
    color: Colors.textMuted,
    fontSize: 9,
    marginTop: 3,
  },
  affordabilityShortcutHidden: {
    display: 'none',
  },
  affordabilityShortcut: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 18,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  affordabilityShortcutIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: Colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  affordabilityShortcutText: {
    flex: 1,
    marginLeft: 10,
  },
  affordabilityShortcutTitle: {
    color: Colors.text,
    fontSize: 12,
    fontWeight: '800',
  },
  affordabilityShortcutMeta: {
    color: Colors.textMuted,
    fontSize: 9,
    marginTop: 3,
  },
  moneyStatusGrid: { flexDirection: 'row', gap: 12, marginBottom: 26 },
  savingsCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
  },
  commitmentCard: {
    flex: 1,
    backgroundColor: Colors.warningSoft,
    borderRadius: 19,
    padding: 16,
  },
  miniCardLabel: { color: Colors.textSecondary, fontSize: 10, fontWeight: '700' },
  miniCardValue: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '800',
    marginTop: 5,
  },
  miniCardMeta: { color: Colors.textMuted, fontSize: 9, marginTop: 5 },
  cloudShortcut: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 18,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cloudShortcutIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: Colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cloudShortcutText: {
    flex: 1,
    marginLeft: 10,
    marginRight: 8,
  },
  cloudShortcutTitle: {
    color: Colors.text,
    fontSize: 11,
    fontWeight: '800',
  },
  cloudShortcutMeta: {
    color: Colors.textMuted,
    fontSize: 9,
    lineHeight: 14,
    marginTop: 3,
  },
  budgetShortcut: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 18,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  budgetShortcutWarning: {
    backgroundColor: Colors.warningSoft,
    borderColor: '#FDE68A',
  },
  budgetShortcutIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: Colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  budgetShortcutIconWarning: {
    backgroundColor: '#FFFFFF',
  },
  budgetShortcutText: {
    flex: 1,
    marginLeft: 10,
    marginRight: 8,
  },
  budgetShortcutTitle: {
    color: Colors.text,
    fontSize: 11,
    fontWeight: '800',
  },
  budgetShortcutMeta: {
    color: Colors.textMuted,
    fontSize: 9,
    lineHeight: 14,
    marginTop: 3,
  },
  budgetAlertPill: {
    minWidth: 25,
    height: 25,
    borderRadius: 999,
    backgroundColor: Colors.warning,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 7,
  },
  budgetAlertText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
  },
  insightsShortcut: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 18,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  insightsShortcutIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: Colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  insightsShortcutText: {
    flex: 1,
    marginLeft: 10,
    marginRight: 8,
  },
  insightsShortcutTitle: {
    color: Colors.text,
    fontSize: 11,
    fontWeight: '800',
  },
  insightsShortcutMeta: {
    color: Colors.textMuted,
    fontSize: 9,
    lineHeight: 14,
    marginTop: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  viewAll: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 14,
  },
  transactionsHeader: { marginTop: 26 },
  loadingCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 28,
    alignItems: 'center',
  },
  emptyState: {
    backgroundColor: Colors.surface,
    borderRadius: 22,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyTitle: { color: Colors.text, fontSize: 16, fontWeight: '800' },
  emptyDescription: {
    color: Colors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
  },
  transactionList: {
    backgroundColor: Colors.surface,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
});
