import { StyleSheet, Text, View } from 'react-native';

import { Colors } from '../../constants/theme';
import { formatCurrencyFromCents } from '../../utils/currency';
import type { CategoryAnalytics } from '../../utils/analytics';

type Props = {
  data: CategoryAnalytics[];
};

export function CategoryBreakdown({ data }: Props) {
  const visible = data.slice(0, 6);

  if (visible.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>
          Expense categories will appear here.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.list}>
      {visible.map((item) => (
        <View key={item.category} style={styles.item}>
          <View style={styles.topRow}>
            <Text style={styles.category}>{item.category}</Text>

            <View style={styles.amountWrap}>
              <Text style={styles.amount}>
                {formatCurrencyFromCents(item.amountCents)}
              </Text>
              <Text style={styles.percent}>{item.percent}%</Text>
            </View>
          </View>

          <View style={styles.track}>
            <View
              style={[
                styles.fill,
                { width: `${Math.min(100, item.percent)}%` },
              ]}
            />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 15,
  },
  item: {},
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  category: {
    color: Colors.text,
    fontSize: 11,
    fontWeight: '800',
  },
  amountWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  amount: {
    color: Colors.text,
    fontSize: 10,
    fontWeight: '800',
  },
  percent: {
    color: Colors.textMuted,
    fontSize: 9,
    fontWeight: '700',
    minWidth: 28,
    textAlign: 'right',
  },
  track: {
    height: 7,
    borderRadius: 999,
    backgroundColor: '#E2E8F0',
    overflow: 'hidden',
    marginTop: 7,
  },
  fill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: Colors.primary,
  },
  empty: {
    minHeight: 90,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: Colors.textMuted,
    fontSize: 11,
  },
});
