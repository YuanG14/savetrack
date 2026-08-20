import { memo } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { Colors } from '../../constants/theme';
import type { SavingsEntry } from '../../types/savings';
import { formatCurrencyFromCents } from '../../utils/currency';
import { formatTransactionDate } from '../../utils/date';

type Props = {
  entry: SavingsEntry;
};

function SavingsRow({ entry }: Props) {
  const isDeposit = entry.type === 'deposit';

  return (
    <View style={styles.row}>
      <View
        style={[
          styles.icon,
          isDeposit ? styles.depositIcon : styles.withdrawIcon,
        ]}
      >
        <Ionicons
          name={isDeposit ? 'arrow-down' : 'arrow-up'}
          size={18}
          color={isDeposit ? Colors.success : Colors.warning}
        />
      </View>

      <View style={styles.center}>
        <Text style={styles.title}>
          {isDeposit ? 'Savings deposit' : 'Savings withdrawal'}
        </Text>
        <Text style={styles.note} numberOfLines={1}>
          {entry.note || formatTransactionDate(entry.entryDate)}
        </Text>
        {entry.note ? (
          <Text style={styles.date}>{formatTransactionDate(entry.entryDate)}</Text>
        ) : null}
      </View>

      <Text
        style={[
          styles.amount,
          isDeposit ? styles.depositAmount : styles.withdrawAmount,
        ]}
      >
        {isDeposit ? '+' : '-'}
        {formatCurrencyFromCents(entry.amountCents)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 76,
    paddingHorizontal: 15,
    paddingVertical: 12,
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
  depositIcon: { backgroundColor: Colors.successSoft },
  withdrawIcon: { backgroundColor: Colors.warningSoft },
  center: { flex: 1, marginLeft: 11, marginRight: 10 },
  title: { color: Colors.text, fontSize: 13, fontWeight: '800' },
  note: { color: Colors.textSecondary, fontSize: 11, marginTop: 3 },
  date: { color: Colors.textMuted, fontSize: 10, marginTop: 2 },
  amount: { fontSize: 12, fontWeight: '800' },
  depositAmount: { color: Colors.success },
  withdrawAmount: { color: Colors.warning },
});

export default memo(SavingsRow);
export const MemoizedSavingsRow = memo(SavingsRow);
export { MemoizedSavingsRow as SavingsRow };
