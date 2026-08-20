import { StyleSheet, Text, View } from 'react-native';

import { Colors } from '../../constants/theme';
import type { MonthlyAnalytics } from '../../utils/analytics';

type Props = {
  data: MonthlyAnalytics[];
};

export function MonthlyCashFlowChart({ data }: Props) {
  const visible = data.slice(-6);

  const maxValue = Math.max(
    1,
    ...visible.flatMap((item) => [
      item.incomeCents,
      item.expenseCents,
    ])
  );

  if (visible.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>
          Add transactions to see monthly cash flow.
        </Text>
      </View>
    );
  }

  return (
    <View>
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.dot, styles.incomeDot]} />
          <Text style={styles.legendText}>Income</Text>
        </View>

        <View style={styles.legendItem}>
          <View style={[styles.dot, styles.expenseDot]} />
          <Text style={styles.legendText}>Expense</Text>
        </View>
      </View>

      <View style={styles.chart}>
        {visible.map((item) => {
          const incomeHeight = Math.max(
            item.incomeCents > 0 ? 5 : 0,
            Math.round((item.incomeCents / maxValue) * 90)
          );

          const expenseHeight = Math.max(
            item.expenseCents > 0 ? 5 : 0,
            Math.round((item.expenseCents / maxValue) * 90)
          );

          return (
            <View key={item.key} style={styles.group}>
              <View style={styles.bars}>
                <View
                  style={[
                    styles.bar,
                    styles.incomeBar,
                    { height: incomeHeight },
                  ]}
                />
                <View
                  style={[
                    styles.bar,
                    styles.expenseBar,
                    { height: expenseHeight },
                  ]}
                />
              </View>

              <Text style={styles.month}>{item.label}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  legend: {
    flexDirection: 'row',
    gap: 16,
    justifyContent: 'flex-end',
    marginBottom: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 999,
  },
  incomeDot: {
    backgroundColor: Colors.primary,
  },
  expenseDot: {
    backgroundColor: '#94A3B8',
  },
  legendText: {
    color: Colors.textMuted,
    fontSize: 9,
    fontWeight: '700',
  },
  chart: {
    minHeight: 120,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    gap: 8,
  },
  group: {
    flex: 1,
    alignItems: 'center',
  },
  bars: {
    height: 94,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
  },
  bar: {
    width: 10,
    borderRadius: 4,
    minHeight: 0,
  },
  incomeBar: {
    backgroundColor: Colors.primary,
  },
  expenseBar: {
    backgroundColor: '#CBD5E1',
  },
  month: {
    color: Colors.textMuted,
    fontSize: 9,
    fontWeight: '700',
    marginTop: 7,
  },
  empty: {
    minHeight: 110,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: Colors.textMuted,
    fontSize: 11,
  },
});
