import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors } from '../../constants/theme';
import { useSavings } from '../../contexts/SavingsContext';
import { useTransactions } from '../../contexts/TransactionContext';
import { formatCurrencyFromCents } from '../../utils/currency';

export default function InsightsScreen() {
  const { transactions } = useTransactions();
  const { currentSavingsCents } = useSavings();

  const totals = useMemo(() => {
    const incomeCents = transactions
      .filter((item) => item.type === 'income')
      .reduce((sum, item) => sum + item.amountCents, 0);
    const expenseCents = transactions
      .filter((item) => item.type === 'expense')
      .reduce((sum, item) => sum + item.amountCents, 0);

    return { incomeCents, expenseCents };
  }, [transactions]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        <Text style={styles.eyebrow}>OVERVIEW</Text>
        <Text style={styles.title}>Insights</Text>
        <Text style={styles.description}>
          A lightweight preview while the full analytics phase is still ahead.
        </Text>

        <View style={styles.card}>
          <MetricRow
            icon="arrow-down"
            iconColor={Colors.success}
            iconBackground={Colors.successSoft}
            label="Total income recorded"
            value={formatCurrencyFromCents(totals.incomeCents)}
          />

          <View style={styles.divider} />

          <MetricRow
            icon="arrow-up"
            iconColor={Colors.danger}
            iconBackground={Colors.dangerSoft}
            label="Total expenses recorded"
            value={formatCurrencyFromCents(totals.expenseCents)}
          />

          <View style={styles.divider} />

          <MetricRow
            icon="lock-closed-outline"
            iconColor={Colors.primary}
            iconBackground={Colors.primarySoft}
            label="Currently reserved savings"
            value={formatCurrencyFromCents(currentSavingsCents)}
          />
        </View>

        <View style={styles.noteCard}>
          <Ionicons name="information-circle-outline" size={20} color={Colors.primary} />
          <Text style={styles.noteText}>
            Charts, category breakdowns, monthly comparisons, and smarter
            spending insights will arrive in the analytics phase.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

type MetricRowProps = {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  iconColor: string;
  iconBackground: string;
  label: string;
  value: string;
};

function MetricRow({
  icon,
  iconColor,
  iconBackground,
  label,
  value,
}: MetricRowProps) {
  return (
    <View style={styles.row}>
      <View style={[styles.icon, { backgroundColor: iconBackground }]}>
        <Ionicons name={icon} size={20} color={iconColor} />
      </View>
      <View style={styles.rowText}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 12 },
  eyebrow: {
    color: Colors.primary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 5,
  },
  title: { fontSize: 29, fontWeight: '800', color: Colors.text },
  description: {
    color: Colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 6,
  },
  card: {
    marginTop: 28,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 22,
    padding: 18,
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  icon: {
    width: 44,
    height: 44,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: { marginLeft: 14, flex: 1 },
  label: { color: Colors.textSecondary, fontSize: 12, marginBottom: 4 },
  value: { color: Colors.text, fontSize: 20, fontWeight: '800' },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 17,
    marginLeft: 58,
  },
  noteCard: {
    marginTop: 16,
    flexDirection: 'row',
    gap: 10,
    padding: 16,
    borderRadius: 18,
    backgroundColor: Colors.primarySoft,
  },
  noteText: {
    flex: 1,
    color: Colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },
});
