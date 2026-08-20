import { StyleSheet, Text, View } from 'react-native';

import { Colors } from '../../constants/theme';
import { formatCurrencyFromCents } from '../../utils/currency';
import { calculateSavingsPlan } from '../../utils/planner';

type Props = {
  label: string;
  targetCents: number;
  currentCents: number;
  weeklySavingsCents: number;
  highlighted?: boolean;
};

export function PlanScenarioRow({
  label,
  targetCents,
  currentCents,
  weeklySavingsCents,
  highlighted = false,
}: Props) {
  const result = calculateSavingsPlan(
    targetCents,
    currentCents,
    weeklySavingsCents
  );

  return (
    <View style={[styles.row, highlighted && styles.highlighted]}>
      <View style={styles.left}>
        <Text style={[styles.label, highlighted && styles.highlightedText]}>
          {label}
        </Text>
        <Text style={styles.amount}>
          {formatCurrencyFromCents(weeklySavingsCents)}/week
        </Text>
      </View>

      <View style={styles.right}>
        <Text style={[styles.weeks, highlighted && styles.highlightedText]}>
          {result.remainingCents === 0
            ? 'Now'
            : result.estimatedDate
              ? `${result.weeks} ${result.weeks === 1 ? 'week' : 'weeks'}`
              : '—'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 60,
    paddingHorizontal: 15,
    paddingVertical: 11,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 15,
  },
  highlighted: {
    backgroundColor: Colors.primarySoft,
  },
  left: {
    flex: 1,
  },
  right: {
    alignItems: 'flex-end',
  },
  label: {
    color: Colors.text,
    fontSize: 12,
    fontWeight: '800',
  },
  highlightedText: {
    color: Colors.primary,
  },
  amount: {
    color: Colors.textMuted,
    fontSize: 10,
    marginTop: 3,
  },
  weeks: {
    color: Colors.text,
    fontSize: 12,
    fontWeight: '800',
  },
});
