import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors } from '../../constants/theme';
import type { SavingsGoal } from '../../types/goal';
import { formatCurrencyFromCents } from '../../utils/currency';
import { formatGoalDate } from '../../utils/goal';

type Props = {
  goal: SavingsGoal;
};

export function GoalCard({ goal }: Props) {
  const router = useRouter();
  const progress = Math.min(
    1,
    goal.targetAmountCents > 0
      ? goal.allocatedCents / goal.targetAmountCents
      : 0
  );
  const remainingCents = Math.max(
    0,
    goal.targetAmountCents - goal.allocatedCents
  );

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      onPress={() =>
        router.push({
          pathname: '/goal/[id]',
          params: { id: String(goal.id) },
        })
      }
    >
      <View style={styles.topRow}>
        <View style={styles.identity}>
          <View style={styles.emojiWrap}>
            <Text style={styles.emoji}>{goal.emoji}</Text>
          </View>

          <View style={styles.identityText}>
            <View style={styles.nameRow}>
              <Text style={styles.name} numberOfLines={1}>
                {goal.name}
              </Text>
              {goal.allocatedCents >= goal.targetAmountCents ? (
                <Ionicons
                  name="checkmark-circle"
                  size={16}
                  color={Colors.success}
                />
              ) : null}
            </View>

            <Text style={styles.meta}>
              {goal.targetDate
                ? `Target ${formatGoalDate(goal.targetDate)}`
                : `${goal.priority[0].toUpperCase()}${goal.priority.slice(1)} priority`}
            </Text>
          </View>
        </View>

        <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
      </View>

      <View style={styles.amountRow}>
        <Text style={styles.savedAmount}>
          {formatCurrencyFromCents(goal.allocatedCents)}
        </Text>
        <Text style={styles.targetAmount}>
          of {formatCurrencyFromCents(goal.targetAmountCents)}
        </Text>
      </View>

      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            { width: `${Math.round(progress * 100)}%` },
          ]}
        />
      </View>

      <View style={styles.footerRow}>
        <Text style={styles.progressText}>
          {Math.round(progress * 100)}% complete
        </Text>
        <Text style={styles.remainingText}>
          {remainingCents === 0
            ? 'Goal reached'
            : `${formatCurrencyFromCents(remainingCents)} left`}
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
    borderRadius: 21,
    padding: 17,
  },
  pressed: { backgroundColor: '#F8FAFC' },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  identity: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  emojiWrap: {
    width: 46,
    height: 46,
    borderRadius: 15,
    backgroundColor: Colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: { fontSize: 23 },
  identityText: { flex: 1, marginLeft: 12, marginRight: 8 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  name: {
    color: Colors.text,
    fontSize: 15,
    fontWeight: '800',
    flexShrink: 1,
  },
  meta: { color: Colors.textMuted, fontSize: 10, marginTop: 4 },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 17,
  },
  savedAmount: { color: Colors.text, fontSize: 19, fontWeight: '800' },
  targetAmount: { color: Colors.textSecondary, fontSize: 11, marginLeft: 5 },
  progressTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: '#E2E8F0',
    overflow: 'hidden',
    marginTop: 11,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 999,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 9,
  },
  progressText: { color: Colors.primary, fontSize: 10, fontWeight: '800' },
  remainingText: { color: Colors.textMuted, fontSize: 10, fontWeight: '700' },
});
