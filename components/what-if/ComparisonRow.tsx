import { StyleSheet, Text, View } from 'react-native';

import { Colors } from '../../constants/theme';
import { formatCurrencyFromCents } from '../../utils/currency';

type Props = {
  label: string;
  currentCents: number;
  projectedCents: number;
};

export function ComparisonRow({
  label,
  currentCents,
  projectedCents,
}: Props) {
  const difference = projectedCents - currentCents;
  const improved = difference >= 0;

  return (
    <View style={styles.row}>
      <View style={styles.labelWrap}>
        <Text style={styles.label}>{label}</Text>
        <Text
          style={[
            styles.change,
            improved ? styles.positive : styles.negative,
          ]}
        >
          {difference === 0
            ? 'No change'
            : `${difference > 0 ? '+' : '−'}${formatCurrencyFromCents(
                Math.abs(difference)
              )}`}
        </Text>
      </View>

      <View style={styles.values}>
        <Text style={styles.current}>
          {formatCurrencyFromCents(currentCents)}
        </Text>
        <Text style={styles.arrow}>→</Text>
        <Text
          style={[
            styles.projected,
            projectedCents < 0 && styles.negative,
          ]}
        >
          {formatCurrencyFromCents(projectedCents)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 70,
    paddingVertical: 12,
  },
  labelWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    color: Colors.text,
    fontSize: 12,
    fontWeight: '800',
  },
  change: {
    fontSize: 10,
    fontWeight: '800',
  },
  positive: {
    color: Colors.success,
  },
  negative: {
    color: Colors.danger,
  },
  values: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  current: {
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  arrow: {
    color: Colors.textMuted,
    fontSize: 12,
  },
  projected: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '800',
  },
});
