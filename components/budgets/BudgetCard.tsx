import { memo } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { getCategory } from '../../constants/categories';
import { Colors } from '../../constants/theme';
import type { BudgetProgress } from '../../utils/budget';
import { formatCurrencyFromCents } from '../../utils/currency';

type Props = {
  budget: BudgetProgress;
};

function BudgetCard({ budget }: Props) {
  const router = useRouter();
  const category = getCategory(budget.category);

  const tone =
    budget.status === 'over'
      ? {
          color: Colors.danger,
          background: Colors.dangerSoft,
          label: 'Over budget',
        }
      : budget.status === 'warning'
        ? {
            color: Colors.warning,
            background: Colors.warningSoft,
            label: 'Near limit',
          }
        : {
            color: Colors.success,
            background: Colors.successSoft,
            label: 'On track',
          };

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      onPress={() =>
        router.push({
          pathname: '/budget-editor',
          params: { id: String(budget.id) },
        })
      }
    >
      <View style={styles.header}>
        <View style={styles.identity}>
          <View style={[styles.icon, { backgroundColor: tone.background }]}>
            <Ionicons
              name={category?.icon ?? 'wallet-outline'}
              size={20}
              color={tone.color}
            />
          </View>

          <View style={styles.identityText}>
            <Text style={styles.category}>{budget.category}</Text>
            <Text style={[styles.status, { color: tone.color }]}>
              {tone.label}
            </Text>
          </View>
        </View>

        <Ionicons name="chevron-forward" size={17} color={Colors.textMuted} />
      </View>

      <View style={styles.amountRow}>
        <Text style={styles.spent}>
          {formatCurrencyFromCents(budget.spentCents)}
        </Text>
        <Text style={styles.limit}>
          of {formatCurrencyFromCents(budget.limitCents)}
        </Text>
      </View>

      <View style={styles.track}>
        <View
          style={[
            styles.fill,
            {
              width: `${Math.min(100, Math.max(0, budget.percentUsed))}%`,
              backgroundColor: tone.color,
            },
          ]}
        />
      </View>

      <View style={styles.footer}>
        <Text style={styles.percent}>
          {budget.percentUsed}% used
        </Text>
        <Text
          style={[
            styles.remaining,
            budget.remainingCents < 0 && styles.overText,
          ]}
        >
          {budget.remainingCents >= 0
            ? `${formatCurrencyFromCents(budget.remainingCents)} left`
            : `${formatCurrencyFromCents(
                Math.abs(budget.remainingCents)
              )} over`}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 20,
    padding: 16,
  },
  pressed: {
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  identity: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  identityText: {
    flex: 1,
    marginLeft: 11,
  },
  category: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '800',
  },
  status: {
    fontSize: 10,
    fontWeight: '800',
    marginTop: 3,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 16,
  },
  spent: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  limit: {
    color: Colors.textSecondary,
    fontSize: 10,
    marginLeft: 5,
  },
  track: {
    height: 8,
    borderRadius: 999,
    backgroundColor: '#E2E8F0',
    overflow: 'hidden',
    marginTop: 10,
  },
  fill: {
    height: '100%',
    borderRadius: 999,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  percent: {
    color: Colors.textMuted,
    fontSize: 9,
    fontWeight: '700',
  },
  remaining: {
    color: Colors.textSecondary,
    fontSize: 9,
    fontWeight: '800',
  },
  overText: {
    color: Colors.danger,
  },
});

export default memo(BudgetCard);
export const MemoizedBudgetCard = memo(BudgetCard);
export { MemoizedBudgetCard as BudgetCard };
