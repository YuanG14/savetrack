import { memo } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { getCategory } from '../../constants/categories';
import { Colors } from '../../constants/theme';
import type { Transaction } from '../../types/transaction';
import { formatCurrencyFromCents } from '../../utils/currency';
import { formatTransactionDate } from '../../utils/date';

type TransactionRowProps = {
  transaction: Transaction;
};

function TransactionRow({ transaction }: TransactionRowProps) {
  const router = useRouter();
  const category = getCategory(transaction.category);
  const isIncome = transaction.type === 'income';

  return (
    <Pressable
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
      onPress={() =>
        router.push({
          pathname: '/transaction/[id]',
          params: { id: String(transaction.id) },
        })
      }
    >
      <View
        style={[
          styles.iconWrap,
          isIncome ? styles.incomeIcon : styles.expenseIcon,
        ]}
      >
        <Ionicons
          name={category?.icon ?? (isIncome ? 'cash-outline' : 'receipt-outline')}
          size={20}
          color={isIncome ? Colors.success : Colors.primary}
        />
      </View>

      <View style={styles.center}>
        <Text style={styles.category}>{transaction.category}</Text>
        <Text style={styles.meta} numberOfLines={1}>
          {transaction.note || formatTransactionDate(transaction.transactionDate)}
        </Text>
        {transaction.note ? (
          <Text style={styles.date}>
            {formatTransactionDate(transaction.transactionDate)}
          </Text>
        ) : null}
      </View>

      <View style={styles.amountWrap}>
        <Text
          style={[
            styles.amount,
            isIncome ? styles.incomeAmount : styles.expenseAmount,
          ]}
        >
          {isIncome ? '+' : '-'}
          {formatCurrencyFromCents(transaction.amountCents)}
        </Text>
        <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 76,
    paddingHorizontal: 15,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
  },
  rowPressed: {
    backgroundColor: '#F8FAFC',
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  incomeIcon: {
    backgroundColor: Colors.successSoft,
  },
  expenseIcon: {
    backgroundColor: Colors.primarySoft,
  },
  center: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  category: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '800',
  },
  meta: {
    color: Colors.textSecondary,
    fontSize: 11,
    marginTop: 3,
  },
  date: {
    color: Colors.textMuted,
    fontSize: 10,
    marginTop: 2,
  },
  amountWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  amount: {
    fontSize: 13,
    fontWeight: '800',
  },
  incomeAmount: {
    color: Colors.success,
  },
  expenseAmount: {
    color: Colors.text,
  },
});

export default memo(TransactionRow);
export const MemoizedTransactionRow = memo(TransactionRow);
export { MemoizedTransactionRow as TransactionRow };
