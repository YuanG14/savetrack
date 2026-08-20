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
import { useTransactions } from '../../contexts/TransactionContext';
import { formatCurrencyFromCents } from '../../utils/currency';
import { getCurrentMonthKey } from '../../utils/date';

export default function HomeScreen() {
  const router = useRouter();
  const { transactions, loading } = useTransactions();

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

    return {
      incomeCents,
      expenseCents,
      balanceCents: allIncomeCents - allExpenseCents,
    };
  }, [transactions]);

  const recentTransactions = transactions.slice(0, 5);

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

        <View style={styles.sectionHeadingRow}>
          <Text style={styles.sectionTitle}>This month</Text>
        </View>

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

        <View style={styles.safeToSpendCard}>
          <View style={styles.safeHeader}>
            <View>
              <Text style={styles.safeToSpendLabel}>Safe to spend</Text>
              <Text style={styles.safeToSpendValue}>
                {formatCurrencyFromCents(Math.max(summary.balanceCents, 0))}
              </Text>
            </View>

            <View style={styles.safeIcon}>
              <Ionicons name="shield-checkmark-outline" size={24} color={Colors.primary} />
            </View>
          </View>

          <Text style={styles.safeToSpendDescription}>
            For now this follows your available balance. Savings reservations
            will make this smarter in Phase 3.
          </Text>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent transactions</Text>
          <Pressable onPress={() => router.push('/transactions')}>
            <Text style={styles.viewAll}>View all</Text>
          </Pressable>
        </View>

        {loading ? (
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
  title: {
    color: Colors.text,
    fontSize: 28,
    fontWeight: '800',
  },
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
  balanceLabel: {
    color: '#DBEAFE',
    fontSize: 14,
    fontWeight: '600',
  },
  balanceLoader: {
    alignSelf: 'flex-start',
    marginVertical: 17,
  },
  balance: {
    color: '#FFFFFF',
    fontSize: 38,
    fontWeight: '800',
    marginTop: 8,
    marginBottom: 8,
  },
  balanceDescription: {
    color: '#BFDBFE',
    fontSize: 13,
    lineHeight: 19,
  },
  sectionHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 14,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
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
  incomeIcon: {
    backgroundColor: Colors.successSoft,
  },
  expenseIcon: {
    backgroundColor: Colors.dangerSoft,
  },
  summaryLabel: {
    color: Colors.textSecondary,
    fontSize: 12,
    marginBottom: 5,
  },
  summaryValue: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  safeToSpendCard: {
    backgroundColor: Colors.primarySoft,
    borderRadius: 20,
    padding: 20,
    marginBottom: 30,
  },
  safeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  safeIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  safeToSpendLabel: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  safeToSpendValue: {
    color: Colors.primaryDark,
    fontSize: 27,
    fontWeight: '800',
    marginTop: 3,
  },
  safeToSpendDescription: {
    color: Colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 10,
    paddingRight: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  loadingText: {
    color: Colors.textSecondary,
    fontSize: 13,
  },
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
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  transactionList: {
    backgroundColor: Colors.surface,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
});
