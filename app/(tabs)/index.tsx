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

import { TransactionRow } from '../../components/transactions/TransactionRow';
import { Colors } from '../../constants/theme';
import { useSavings } from '../../contexts/SavingsContext';
import { useTransactions } from '../../contexts/TransactionContext';
import { formatCurrencyFromCents } from '../../utils/currency';
import { getCurrentMonthKey } from '../../utils/date';

export default function HomeScreen() {
  const router = useRouter();
  const { transactions, loading: transactionsLoading } = useTransactions();
  const {
    currentSavingsCents,
    loading: savingsLoading,
  } = useSavings();

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

  const recentTransactions = transactions.slice(0, 5);
  const loading = transactionsLoading || savingsLoading;

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
            accessibilityRole="button"
            accessibilityLabel="Add transaction"
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
            <View style={[styles.summaryIcon, styles.incomeIcon]}>
              <Ionicons name="arrow-down" size={18} color={Colors.success} />
            </View>
            <Text style={styles.summaryLabel}>Income</Text>
            <Text style={styles.summaryValue}>
              {formatCurrencyFromCents(summary.incomeCents)}
            </Text>
          </View>

          <View style={styles.summaryCard}>
            <View style={[styles.summaryIcon, styles.expenseIcon]}>
              <Ionicons name="arrow-up" size={18} color={Colors.danger} />
            </View>
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
            <View style={styles.miniCardHeader}>
              <View style={styles.miniCardIcon}>
                <Ionicons name="lock-closed-outline" size={18} color={Colors.primary} />
              </View>
              <Ionicons name="chevron-forward" size={17} color={Colors.textMuted} />
            </View>
            <Text style={styles.miniCardLabel}>Reserved savings</Text>
            <Text style={styles.miniCardValue}>
              {formatCurrencyFromCents(currentSavingsCents)}
            </Text>
          </Pressable>

          <View style={styles.safeToSpendCard}>
            <View style={styles.miniCardHeader}>
              <View style={styles.safeIcon}>
                <Ionicons name="shield-checkmark-outline" size={18} color={Colors.success} />
              </View>
            </View>
            <Text style={styles.miniCardLabel}>Safe to spend</Text>
            <Text
              style={[
                styles.miniCardValue,
                summary.safeToSpendCents < 0 && styles.negativeValue,
              ]}
            >
              {formatCurrencyFromCents(summary.safeToSpendCents)}
            </Text>
          </View>
        </View>

        {summary.safeToSpendCents < 0 ? (
          <View style={styles.warningCard}>
            <Ionicons name="warning-outline" size={20} color={Colors.warning} />
            <Text style={styles.warningText}>
              Your reserved savings are higher than your current available balance.
            </Text>
          </View>
        ) : null}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent transactions</Text>
          <Pressable onPress={() => router.push('/transactions')}>
            <Text style={styles.viewAll}>View all</Text>
          </Pressable>
        </View>

        {transactionsLoading ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator color={Colors.primary} />
            <Text style={styles.loadingText}>Loading transactions...</Text>
          </View>
        ) : recentTransactions.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons name="receipt-outline" size={26} color={Colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>No transactions yet</Text>
            <Text style={styles.emptyDescription}>
              Add your first income or expense to start tracking your money.
            </Text>
            <Pressable
              style={styles.primaryButton}
              onPress={() => router.push('/add-transaction')}
            >
              <Ionicons name="add" size={18} color="#FFFFFF" />
              <Text style={styles.primaryButtonText}>Add transaction</Text>
            </Pressable>
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
  summaryIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  incomeIcon: { backgroundColor: Colors.successSoft },
  expenseIcon: { backgroundColor: Colors.dangerSoft },
  summaryLabel: { color: Colors.textSecondary, fontSize: 12, marginBottom: 5 },
  summaryValue: { color: Colors.text, fontSize: 18, fontWeight: '800' },
  moneyStatusGrid: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  savingsCard: {
    flex: 1,
    backgroundColor: Colors.primarySoft,
    borderRadius: 20,
    padding: 17,
    minHeight: 132,
  },
  safeToSpendCard: {
    flex: 1,
    backgroundColor: Colors.successSoft,
    borderRadius: 20,
    padding: 17,
    minHeight: 132,
  },
  miniCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  miniCardIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  safeIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniCardLabel: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
  },
  miniCardValue: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: '800',
    marginTop: 5,
  },
  negativeValue: { color: Colors.danger },
  warningCard: {
    flexDirection: 'row',
    gap: 9,
    alignItems: 'flex-start',
    backgroundColor: Colors.warningSoft,
    padding: 14,
    borderRadius: 16,
    marginBottom: 26,
  },
  warningText: {
    flex: 1,
    color: Colors.warningDark,
    fontSize: 12,
    lineHeight: 18,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
  },
  viewAll: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 14,
  },
  loadingCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 28,
    alignItems: 'center',
    gap: 10,
  },
  loadingText: { color: Colors.textSecondary, fontSize: 13 },
  emptyState: {
    backgroundColor: Colors.surface,
    borderRadius: 22,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyIcon: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: Colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 6,
  },
  emptyDescription: {
    color: Colors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
    maxWidth: 280,
  },
  primaryButton: {
    marginTop: 18,
    minHeight: 46,
    paddingHorizontal: 18,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  primaryButtonText: { color: '#FFFFFF', fontWeight: '800', fontSize: 13 },
  transactionList: {
    backgroundColor: Colors.surface,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
});
