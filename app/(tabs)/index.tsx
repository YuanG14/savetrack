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
import { useGoals } from '../../contexts/GoalContext';
import { useSavings } from '../../contexts/SavingsContext';
import { useTransactions } from '../../contexts/TransactionContext';
import { formatCurrencyFromCents } from '../../utils/currency';
import { getCurrentMonthKey } from '../../utils/date';

export default function HomeScreen() {
  const router = useRouter();
  const { transactions, loading: transactionsLoading } = useTransactions();
  const { currentSavingsCents, loading: savingsLoading } = useSavings();
  const {
    goals,
    totalAllocatedCents,
    loading: goalsLoading,
  } = useGoals();

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
    const safeToSpendCents = balanceCents - currentSavingsCents;

    return {
      incomeCents,
      expenseCents,
      balanceCents,
      safeToSpendCents,
    };
  }, [transactions, currentSavingsCents]);

  const recentTransactions = transactions.slice(0, 4);
  const featuredGoal = goals[0];
  const loading = transactionsLoading || savingsLoading || goalsLoading;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>SAVETRACK</Text>
            <Text style={styles.title}>Your money today</Text>
          </View>

          <Pressable
            style={styles.headerAddButton}
            onPress={() => router.push('/add-transaction')}
          >
            <Ionicons name="add" size={23} color="#FFFFFF" />
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

          <View style={styles.safeToSpendCard}>
            <Text style={styles.miniCardLabel}>Safe to spend</Text>
            <Text
              style={[
                styles.miniCardValue,
                summary.safeToSpendCents < 0 && styles.negativeValue,
              ]}
            >
              {formatCurrencyFromCents(summary.safeToSpendCents)}
            </Text>
            <Text style={styles.miniCardMeta}>After reserved savings</Text>
          </View>
        </View>

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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  eyebrow: {
    color: Colors.primary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 5,
  },
  title: { color: Colors.text, fontSize: 28, fontWeight: '800' },
  headerAddButton: {
    width: 46,
    height: 46,
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
  moneyStatusGrid: { flexDirection: 'row', gap: 12, marginBottom: 26 },
  savingsCard: {
    flex: 1,
    backgroundColor: Colors.primarySoft,
    borderRadius: 20,
    padding: 17,
  },
  safeToSpendCard: {
    flex: 1,
    backgroundColor: Colors.successSoft,
    borderRadius: 20,
    padding: 17,
  },
  miniCardLabel: { color: Colors.textSecondary, fontSize: 11, fontWeight: '700' },
  miniCardValue: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: '800',
    marginTop: 6,
  },
  miniCardMeta: { color: Colors.textMuted, fontSize: 9, marginTop: 5 },
  negativeValue: { color: Colors.danger },
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
