import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors } from '../../constants/theme';
import type { Commitment } from '../../types/safe-spend';
import { formatCurrencyFromCents } from '../../utils/currency';
import { formatGoalDate } from '../../utils/goal';

type Props = {
  commitment: Commitment;
};

export function CommitmentRow({ commitment }: Props) {
  const router = useRouter();

  return (
    <Pressable
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
      onPress={() =>
        router.push({
          pathname: '/commitment-editor',
          params: { id: String(commitment.id) },
        })
      }
    >
      <View style={styles.icon}>
        <Ionicons name="calendar-outline" size={19} color={Colors.warning} />
      </View>

      <View style={styles.center}>
        <Text style={styles.name}>{commitment.name}</Text>
        <Text style={styles.meta}>
          {commitment.category} · Due {formatGoalDate(commitment.dueDate)}
        </Text>
      </View>

      <View style={styles.amountWrap}>
        <Text style={styles.amount}>
          {formatCurrencyFromCents(commitment.amountCents)}
        </Text>
        <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 11,
    backgroundColor: Colors.surface,
  },
  pressed: { backgroundColor: '#F8FAFC' },
  icon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: Colors.warningSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: { flex: 1, marginLeft: 11, marginRight: 8 },
  name: { color: Colors.text, fontSize: 13, fontWeight: '800' },
  meta: { color: Colors.textMuted, fontSize: 10, marginTop: 3 },
  amountWrap: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  amount: { color: Colors.text, fontSize: 12, fontWeight: '800' },
});
