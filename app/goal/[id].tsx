import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors } from '../../constants/theme';
import { useGoals } from '../../contexts/GoalContext';
import { useSavings } from '../../contexts/SavingsContext';
import type { GoalEntryType } from '../../types/goal';
import { formatCurrencyFromCents } from '../../utils/currency';
import { formatGoalDate } from '../../utils/goal';

export default function GoalDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const {
    goals,
    loading,
    totalAllocatedCents,
    allocateToGoal,
    deleteGoal,
  } = useGoals();
  const { currentSavingsCents } = useSavings();

  const id = Number(params.id);
  const goal = useMemo(
    () => goals.find((item) => item.id === id),
    [goals, id]
  );

  const [mode, setMode] = useState<GoalEntryType>('contribution');
  const [amount, setAmount] = useState('');
  const [saving, setSaving] = useState(false);

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <ActivityIndicator color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!goal || !Number.isFinite(id)) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <Text style={styles.missingTitle}>Goal not found</Text>
          <Pressable style={styles.primaryButton} onPress={() => router.back()}>
            <Text style={styles.primaryButtonText}>Go back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const unallocatedCents = currentSavingsCents - totalAllocatedCents;
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

  const handleAmountChange = (value: string) => {
    const cleaned = value.replace(/[^\d.]/g, '');
    const firstDot = cleaned.indexOf('.');

    if (firstDot === -1) {
      setAmount(cleaned);
      return;
    }

    const whole = cleaned.slice(0, firstDot);
    const decimals = cleaned
      .slice(firstDot + 1)
      .replace(/\./g, '')
      .slice(0, 2);

    setAmount(`${whole}.${decimals}`);
  };

  const submitAllocation = async () => {
    const numericAmount = Number.parseFloat(amount);

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      Alert.alert('Enter an amount', 'The amount must be greater than ₱0.');
      return;
    }

    const amountCents = Math.round(numericAmount * 100);

    if (mode === 'contribution' && amountCents > unallocatedCents) {
      Alert.alert(
        'Not enough unallocated savings',
        `You currently have ${formatCurrencyFromCents(unallocatedCents)} available to assign to goals.`
      );
      return;
    }

    if (mode === 'release' && amountCents > goal.allocatedCents) {
      Alert.alert(
        'Amount too high',
        `This goal currently has ${formatCurrencyFromCents(goal.allocatedCents)} allocated.`
      );
      return;
    }

    setSaving(true);
    try {
      await allocateToGoal(goal.id, {
        type: mode,
        amountCents,
      });
      setAmount('');
    } catch (error) {
      console.error(error);
      Alert.alert('Could not update goal', 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = () => {
    Alert.alert(
      'Delete goal?',
      'Any money allocated to this goal will return to your unallocated savings pool.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteGoal(goal.id);
              router.back();
            } catch (error) {
              console.error(error);
              Alert.alert('Could not delete goal', 'Please try again.');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topBar}>
          <Pressable style={styles.iconButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={22} color={Colors.text} />
          </Pressable>

          <View style={styles.topActions}>
            <Pressable
              style={styles.iconButton}
              onPress={() =>
                router.push({
                  pathname: '/goal-editor',
                  params: { id: String(goal.id) },
                })
              }
            >
              <Ionicons name="create-outline" size={20} color={Colors.text} />
            </Pressable>

            <Pressable style={styles.iconButton} onPress={confirmDelete}>
              <Ionicons name="trash-outline" size={19} color={Colors.danger} />
            </Pressable>
          </View>
        </View>

        <View style={styles.heroCard}>
          <View style={styles.heroIdentity}>
            <View style={styles.emojiWrap}>
              <Text style={styles.emoji}>{goal.emoji}</Text>
            </View>

            <View style={styles.heroText}>
              <Text style={styles.heroName}>{goal.name}</Text>
              <Text style={styles.heroMeta}>
                {goal.targetDate
                  ? `Target ${formatGoalDate(goal.targetDate)}`
                  : `${goal.priority[0].toUpperCase()}${goal.priority.slice(1)} priority`}
              </Text>
            </View>
          </View>

          <Text style={styles.savedAmount}>
            {formatCurrencyFromCents(goal.allocatedCents)}
          </Text>
          <Text style={styles.targetAmount}>
            of {formatCurrencyFromCents(goal.targetAmountCents)}
          </Text>

          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                { width: `${Math.round(progress * 100)}%` },
              ]}
            />
          </View>

          <View style={styles.heroFooter}>
            <Text style={styles.progressPercent}>
              {Math.round(progress * 100)}%
            </Text>
            <Text style={styles.remaining}>
              {remainingCents === 0
                ? 'Goal reached 🎉'
                : `${formatCurrencyFromCents(remainingCents)} remaining`}
            </Text>
          </View>
        </View>

        <View style={styles.availableCard}>
          <View>
            <Text style={styles.availableLabel}>Unallocated savings</Text>
            <Text style={styles.availableValue}>
              {formatCurrencyFromCents(unallocatedCents)}
            </Text>
          </View>

          <Ionicons name="wallet-outline" size={24} color={Colors.primary} />
        </View>

        <Text style={styles.sectionTitle}>Move savings</Text>

        <View style={styles.segment}>
          <Pressable
            style={[
              styles.segmentButton,
              mode === 'contribution' && styles.segmentActive,
            ]}
            onPress={() => setMode('contribution')}
          >
            <Text
              style={[
                styles.segmentText,
                mode === 'contribution' && styles.segmentTextActive,
              ]}
            >
              Add to goal
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.segmentButton,
              mode === 'release' && styles.segmentActive,
            ]}
            onPress={() => setMode('release')}
          >
            <Text
              style={[
                styles.segmentText,
                mode === 'release' && styles.segmentTextActive,
              ]}
            >
              Move back
            </Text>
          </Pressable>
        </View>

        <View style={styles.amountInputWrap}>
          <Text style={styles.currencySymbol}>₱</Text>
          <TextInput
            value={amount}
            onChangeText={handleAmountChange}
            placeholder="0.00"
            placeholderTextColor={Colors.textMuted}
            keyboardType="decimal-pad"
            style={styles.amountInput}
          />
        </View>

        <Pressable
          style={[styles.allocateButton, saving && styles.disabled]}
          onPress={submitAllocation}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.allocateButtonText}>
              {mode === 'contribution' ? 'Allocate savings' : 'Return to pool'}
            </Text>
          )}
        </Pressable>

        <Text style={styles.sectionTitle}>Goal activity</Text>

        {goal.entries.length === 0 ? (
          <View style={styles.emptyActivity}>
            <Ionicons
              name="swap-horizontal-outline"
              size={24}
              color={Colors.textMuted}
            />
            <Text style={styles.emptyActivityText}>
              No money has been allocated to this goal yet.
            </Text>
          </View>
        ) : (
          <View style={styles.activityCard}>
            {goal.entries.map((entry, index) => {
              const contribution = entry.type === 'contribution';

              return (
                <View key={entry.id}>
                  <View style={styles.activityRow}>
                    <View
                      style={[
                        styles.activityIcon,
                        contribution
                          ? styles.contributionIcon
                          : styles.releaseIcon,
                      ]}
                    >
                      <Ionicons
                        name={contribution ? 'arrow-down' : 'arrow-up'}
                        size={17}
                        color={contribution ? Colors.success : Colors.warning}
                      />
                    </View>

                    <View style={styles.activityText}>
                      <Text style={styles.activityTitle}>
                        {contribution ? 'Added to goal' : 'Returned to pool'}
                      </Text>
                      <Text style={styles.activityDate}>
                        {new Intl.DateTimeFormat('en-PH', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        }).format(new Date(entry.createdAt))}
                      </Text>
                    </View>

                    <Text
                      style={[
                        styles.activityAmount,
                        contribution
                          ? styles.contributionAmount
                          : styles.releaseAmount,
                      ]}
                    >
                      {contribution ? '+' : '-'}
                      {formatCurrencyFromCents(entry.amountCents)}
                    </Text>
                  </View>

                  {index < goal.entries.length - 1 ? (
                    <View style={styles.divider} />
                  ) : null}
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  content: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 36 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 30,
  },
  missingTitle: { color: Colors.text, fontSize: 20, fontWeight: '800' },
  primaryButton: {
    backgroundColor: Colors.primary,
    minHeight: 44,
    paddingHorizontal: 18,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: { color: '#FFFFFF', fontWeight: '800' },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  topActions: { flexDirection: 'row', gap: 8 },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCard: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 24,
    padding: 20,
    marginBottom: 14,
  },
  heroIdentity: { flexDirection: 'row', alignItems: 'center' },
  emojiWrap: {
    width: 52,
    height: 52,
    borderRadius: 17,
    backgroundColor: Colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: { fontSize: 26 },
  heroText: { flex: 1, marginLeft: 13 },
  heroName: { color: Colors.text, fontSize: 20, fontWeight: '800' },
  heroMeta: { color: Colors.textSecondary, fontSize: 11, marginTop: 4 },
  savedAmount: {
    color: Colors.text,
    fontSize: 31,
    fontWeight: '800',
    marginTop: 22,
  },
  targetAmount: { color: Colors.textSecondary, fontSize: 12, marginTop: 3 },
  progressTrack: {
    height: 9,
    backgroundColor: '#E2E8F0',
    borderRadius: 999,
    overflow: 'hidden',
    marginTop: 16,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 999,
  },
  heroFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 9,
  },
  progressPercent: { color: Colors.primary, fontSize: 11, fontWeight: '800' },
  remaining: { color: Colors.textMuted, fontSize: 11, fontWeight: '700' },
  availableCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.primarySoft,
    borderRadius: 18,
    padding: 17,
    marginBottom: 27,
  },
  availableLabel: { color: Colors.textSecondary, fontSize: 11 },
  availableValue: {
    color: Colors.primaryDark,
    fontSize: 19,
    fontWeight: '800',
    marginTop: 3,
  },
  sectionTitle: {
    color: Colors.text,
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 12,
  },
  segment: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 12,
  },
  segmentButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentActive: { backgroundColor: Colors.primarySoft },
  segmentText: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '800',
  },
  segmentTextActive: { color: Colors.primary },
  amountInputWrap: {
    minHeight: 64,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  currencySymbol: {
    color: Colors.textSecondary,
    fontSize: 23,
    fontWeight: '700',
    marginRight: 7,
  },
  amountInput: {
    flex: 1,
    color: Colors.text,
    fontSize: 25,
    fontWeight: '800',
  },
  allocateButton: {
    minHeight: 52,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 11,
    marginBottom: 28,
  },
  disabled: { opacity: 0.7 },
  allocateButtonText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
  emptyActivity: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
    gap: 9,
  },
  emptyActivityText: {
    color: Colors.textSecondary,
    fontSize: 12,
    textAlign: 'center',
  },
  activityCard: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 20,
    overflow: 'hidden',
  },
  activityRow: {
    minHeight: 72,
    paddingHorizontal: 15,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contributionIcon: { backgroundColor: Colors.successSoft },
  releaseIcon: { backgroundColor: Colors.warningSoft },
  activityText: { flex: 1, marginLeft: 11 },
  activityTitle: { color: Colors.text, fontSize: 12, fontWeight: '800' },
  activityDate: { color: Colors.textMuted, fontSize: 10, marginTop: 3 },
  activityAmount: { fontSize: 11, fontWeight: '800' },
  contributionAmount: { color: Colors.success },
  releaseAmount: { color: Colors.warning },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginLeft: 66 },
});
