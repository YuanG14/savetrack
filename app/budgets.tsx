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

import { BudgetCard } from '../components/budgets/BudgetCard';
import { Colors } from '../constants/theme';
import { useBudgets } from '../contexts/BudgetContext';
import { useTransactions } from '../contexts/TransactionContext';
import {
  calculateBudgetProgress,
  getTotalBudgetSummary,
} from '../utils/budget';
import { formatCurrencyFromCents } from '../utils/currency';

export default function BudgetsScreen() {
  const router = useRouter();
  const { budgets, loading } = useBudgets();
  const { transactions } = useTransactions();

  const progress = useMemo(
    () => calculateBudgetProgress(budgets, transactions),
    [budgets, transactions]
  );

  const summary = useMemo(
    () => getTotalBudgetSummary(progress),
    [progress]
  );

  const warningCount = progress.filter(
    (item) => item.status === 'warning'
  ).length;

  const overCount = progress.filter(
    (item) => item.status === 'over'
  ).length;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topBar}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={22} color={Colors.text} />
          </Pressable>

          <View style={styles.topText}>
            <Text style={styles.title}>Monthly budgets</Text>
            <Text style={styles.subtitle}>
              Set category limits and stay ahead of overspending.
            </Text>
          </View>

          <Pressable
            style={styles.addButton}
            onPress={() => router.push('/budget-editor')}
          >
            <Ionicons name="add" size={23} color="#FFFFFF" />
          </Pressable>
        </View>

        <View
          style={[
            styles.heroCard,
            summary.remainingCents < 0 && styles.heroDanger,
          ]}
        >
          <Text style={styles.heroLabel}>Total budget remaining</Text>
          <Text
            style={[
              styles.heroValue,
              summary.remainingCents < 0 && styles.dangerText,
            ]}
          >
            {formatCurrencyFromCents(summary.remainingCents)}
          </Text>

          <View style={styles.heroTrack}>
            <View
              style={[
                styles.heroFill,
                {
                  width: `${Math.min(
                    100,
                    Math.max(0, summary.percentUsed)
                  )}%`,
                  backgroundColor:
                    summary.percentUsed >= 100
                      ? Colors.danger
                      : summary.percentUsed >= 80
                        ? Colors.warning
                        : Colors.primary,
                },
              ]}
            />
          </View>

          <View style={styles.heroFooter}>
            <Text style={styles.heroMeta}>
              {formatCurrencyFromCents(summary.totalSpentCents)} spent
            </Text>
            <Text style={styles.heroMeta}>
              {formatCurrencyFromCents(summary.totalLimitCents)} budgeted
            </Text>
          </View>
        </View>

        {(warningCount > 0 || overCount > 0) && (
          <View
            style={[
              styles.alertCard,
              overCount > 0 ? styles.alertDanger : styles.alertWarning,
            ]}
          >
            <Ionicons
              name={overCount > 0 ? 'warning-outline' : 'alert-circle-outline'}
              size={20}
              color={overCount > 0 ? Colors.danger : Colors.warning}
            />

            <Text style={styles.alertText}>
              {overCount > 0
                ? `${overCount} ${
                    overCount === 1 ? 'category is' : 'categories are'
                  } over budget.`
                : `${warningCount} ${
                    warningCount === 1 ? 'category is' : 'categories are'
                  } close to the limit.`}
            </Text>
          </View>
        )}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Category budgets</Text>

          {budgets.length > 0 ? (
            <Text style={styles.countText}>
              {budgets.length} {budgets.length === 1 ? 'budget' : 'budgets'}
            </Text>
          ) : null}
        </View>

        {loading ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator color={Colors.primary} />
          </View>
        ) : progress.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons
                name="pie-chart-outline"
                size={27}
                color={Colors.primary}
              />
            </View>

            <Text style={styles.emptyTitle}>Create your first budget</Text>
            <Text style={styles.emptyText}>
              Set a monthly limit for categories like Food, Transport,
              Shopping, or Entertainment.
            </Text>

            <Pressable
              style={styles.emptyButton}
              onPress={() => router.push('/budget-editor')}
            >
              <Ionicons name="add" size={18} color="#FFFFFF" />
              <Text style={styles.emptyButtonText}>Create budget</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.list}>
            {progress.map((budget) => (
              <BudgetCard key={budget.id} budget={budget} />
            ))}
          </View>
        )}

        <View style={styles.infoCard}>
          <Ionicons
            name="information-circle-outline"
            size={19}
            color={Colors.primary}
          />
          <Text style={styles.infoText}>
            Budget usage is calculated automatically from this month&apos;s
            expense transactions. You never have to update the spent amount
            manually.
          </Text>
        </View>
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
    paddingTop: 8,
    paddingBottom: 40,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topText: {
    flex: 1,
    marginLeft: 14,
    marginRight: 10,
  },
  title: {
    color: Colors.text,
    fontSize: 22,
    fontWeight: '800',
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 3,
  },
  addButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCard: {
    backgroundColor: Colors.primarySoft,
    borderRadius: 23,
    padding: 19,
    marginBottom: 14,
  },
  heroDanger: {
    backgroundColor: Colors.dangerSoft,
  },
  heroLabel: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
  },
  heroValue: {
    color: Colors.primaryDark,
    fontSize: 29,
    fontWeight: '800',
    marginTop: 5,
  },
  dangerText: {
    color: Colors.danger,
  },
  heroTrack: {
    height: 9,
    borderRadius: 999,
    backgroundColor: '#E2E8F0',
    overflow: 'hidden',
    marginTop: 16,
  },
  heroFill: {
    height: '100%',
    borderRadius: 999,
  },
  heroFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  heroMeta: {
    color: Colors.textMuted,
    fontSize: 9,
    fontWeight: '700',
  },
  alertCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
    borderRadius: 16,
    padding: 13,
    marginBottom: 22,
  },
  alertDanger: {
    backgroundColor: Colors.dangerSoft,
  },
  alertWarning: {
    backgroundColor: Colors.warningSoft,
  },
  alertText: {
    flex: 1,
    color: Colors.textSecondary,
    fontSize: 10,
    lineHeight: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    color: Colors.text,
    fontSize: 17,
    fontWeight: '800',
  },
  countText: {
    color: Colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
  },
  loadingCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 26,
    alignItems: 'center',
  },
  list: {
    gap: 11,
  },
  emptyState: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 21,
    padding: 28,
    alignItems: 'center',
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 19,
    backgroundColor: Colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 13,
  },
  emptyTitle: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  emptyText: {
    color: Colors.textSecondary,
    fontSize: 11,
    lineHeight: 17,
    textAlign: 'center',
    marginTop: 6,
    maxWidth: 290,
  },
  emptyButton: {
    minHeight: 45,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    paddingHorizontal: 17,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 17,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  infoCard: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 17,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
    marginTop: 14,
  },
  infoText: {
    flex: 1,
    color: Colors.textSecondary,
    fontSize: 10,
    lineHeight: 16,
  },
});
