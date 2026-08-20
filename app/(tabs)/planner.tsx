import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PlanScenarioRow } from '../../components/planner/PlanScenarioRow';
import { Colors } from '../../constants/theme';
import { useGoals } from '../../contexts/GoalContext';
import { useSavings } from '../../contexts/SavingsContext';
import { formatCurrencyFromCents } from '../../utils/currency';
import {
  calculateSavingsPlan,
  formatEstimatedDate,
} from '../../utils/planner';

function parseMoneyInput(value: string): number {
  const numeric = Number.parseFloat(value);
  return Number.isFinite(numeric) ? Math.round(numeric * 100) : 0;
}

function cleanMoneyInput(value: string): string {
  const cleaned = value.replace(/[^\d.]/g, '');
  const firstDot = cleaned.indexOf('.');

  if (firstDot === -1) {
    return cleaned;
  }

  const whole = cleaned.slice(0, firstDot);
  const decimals = cleaned
    .slice(firstDot + 1)
    .replace(/\./g, '')
    .slice(0, 2);

  return `${whole}.${decimals}`;
}

export default function PlannerScreen() {
  const router = useRouter();
  const { currentSavingsCents } = useSavings();
  const { createGoal } = useGoals();

  const [goalName, setGoalName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [weeklySavings, setWeeklySavings] = useState('');
  const [creatingGoal, setCreatingGoal] = useState(false);

  const targetCents = parseMoneyInput(targetAmount);
  const currentCents = parseMoneyInput(currentAmount);
  const weeklyCents = parseMoneyInput(weeklySavings);

  const result = useMemo(
    () => calculateSavingsPlan(targetCents, currentCents, weeklyCents),
    [targetCents, currentCents, weeklyCents]
  );

  const validPlan = targetCents > 0;
  const canCreateGoal =
    validPlan && (result.reached || result.estimatedDate !== null);

  const scenarios = useMemo(() => {
    if (weeklyCents <= 0) return [];

    const multipliers = [0.75, 1, 1.25, 1.5];

    return multipliers.map((multiplier) => ({
      multiplier,
      cents: Math.max(1, Math.round(weeklyCents * multiplier)),
    }));
  }, [weeklyCents]);

  const fillReservedSavings = () => {
    setCurrentAmount((currentSavingsCents / 100).toFixed(2));
  };

  const createGoalFromPlan = async () => {
    if (!canCreateGoal) {
      Alert.alert(
        'Complete the plan first',
        'Enter a target amount and weekly savings so SaveTrack can estimate a target date.'
      );
      return;
    }

    const name = goalName.trim();

    if (!name) {
      Alert.alert('Name your goal', 'Enter what you are saving for first.');
      return;
    }

    setCreatingGoal(true);

    try {
      await createGoal({
        name,
        targetAmountCents: targetCents,
        targetDate: result.estimatedDate,
        priority: 'medium',
        emoji: '🎯',
      });

      Alert.alert(
        'Goal created',
        `${name} has been added to your savings goals.`,
        [
          {
            text: 'View goals',
            onPress: () => router.push('/goals'),
          },
        ]
      );
    } catch (error) {
      console.error(error);
      Alert.alert('Could not create goal', 'Please try again.');
    } finally {
      setCreatingGoal(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={styles.eyebrow}>PLANNER</Text>
            <Text style={styles.title}>How long until you can afford it?</Text>
            <Text style={styles.subtitle}>
              Set a target, choose how much you can save each week, and SaveTrack
              will calculate the timeline.
            </Text>
          </View>

          <View style={styles.formCard}>
            <Text style={styles.label}>What are you saving for?</Text>
            <TextInput
              value={goalName}
              onChangeText={setGoalName}
              placeholder="e.g. New Phone"
              placeholderTextColor={Colors.textMuted}
              style={styles.textInput}
              maxLength={40}
            />

            <Text style={styles.label}>Target price</Text>
            <View style={styles.amountInputWrap}>
              <Text style={styles.currencySymbol}>₱</Text>
              <TextInput
                value={targetAmount}
                onChangeText={(value) => setTargetAmount(cleanMoneyInput(value))}
                placeholder="30,000.00"
                placeholderTextColor={Colors.textMuted}
                keyboardType="decimal-pad"
                style={styles.amountInput}
                maxLength={12}
              />
            </View>

            <View style={styles.labelRow}>
              <Text style={styles.label}>Already saved</Text>
              <Pressable onPress={fillReservedSavings}>
                <Text style={styles.quickAction}>Use reserved savings</Text>
              </Pressable>
            </View>

            <View style={styles.amountInputWrapSmall}>
              <Text style={styles.currencySymbolSmall}>₱</Text>
              <TextInput
                value={currentAmount}
                onChangeText={(value) => setCurrentAmount(cleanMoneyInput(value))}
                placeholder="0.00"
                placeholderTextColor={Colors.textMuted}
                keyboardType="decimal-pad"
                style={styles.smallAmountInput}
                maxLength={12}
              />
            </View>

            <Text style={styles.helperText}>
              Reserved savings available: {formatCurrencyFromCents(currentSavingsCents)}
            </Text>

            <Text style={styles.label}>How much can you save each week?</Text>
            <View style={styles.amountInputWrapSmall}>
              <Text style={styles.currencySymbolSmall}>₱</Text>
              <TextInput
                value={weeklySavings}
                onChangeText={(value) => setWeeklySavings(cleanMoneyInput(value))}
                placeholder="1,000.00"
                placeholderTextColor={Colors.textMuted}
                keyboardType="decimal-pad"
                style={styles.smallAmountInput}
                maxLength={12}
              />
              <Text style={styles.weekSuffix}>/ week</Text>
            </View>
          </View>

          {validPlan ? (
            <View style={styles.resultCard}>
              <View style={styles.resultIcon}>
                <Ionicons
                  name={result.reached ? 'checkmark' : 'calendar-outline'}
                  size={23}
                  color={result.reached ? Colors.success : Colors.primary}
                />
              </View>

              <Text style={styles.resultEyebrow}>
                {result.reached ? 'YOU CAN AFFORD IT' : 'ESTIMATED TIMELINE'}
              </Text>

              <Text style={styles.resultTitle}>
                {result.reached
                  ? 'You already reached the target.'
                  : result.estimatedDate
                    ? `${result.weeks} ${result.weeks === 1 ? 'week' : 'weeks'}`
                    : 'Add your weekly savings'}
              </Text>

              <Text style={styles.resultDate}>
                {result.reached
                  ? 'Your current savings cover the full target.'
                  : result.estimatedDate
                    ? `Around ${formatEstimatedDate(result.estimatedDate)}`
                    : 'We need your weekly savings amount to calculate a date.'}
              </Text>

              <View style={styles.resultDivider} />

              <View style={styles.resultStats}>
                <View style={styles.resultStat}>
                  <Text style={styles.resultStatLabel}>Target</Text>
                  <Text style={styles.resultStatValue}>
                    {formatCurrencyFromCents(targetCents)}
                  </Text>
                </View>

                <View style={styles.resultStat}>
                  <Text style={styles.resultStatLabel}>Still needed</Text>
                  <Text style={styles.resultStatValue}>
                    {formatCurrencyFromCents(result.remainingCents)}
                  </Text>
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.emptyResult}>
              <View style={styles.emptyIcon}>
                <Ionicons name="calculator-outline" size={26} color={Colors.primary} />
              </View>
              <Text style={styles.emptyTitle}>Enter a target price</Text>
              <Text style={styles.emptyText}>
                Your savings timeline will appear here instantly.
              </Text>
            </View>
          )}

          {scenarios.length > 0 && targetCents > 0 ? (
            <>
              <Text style={styles.sectionTitle}>What if you save more?</Text>

              <View style={styles.scenarioCard}>
                {scenarios.map((scenario) => (
                  <PlanScenarioRow
                    key={scenario.multiplier}
                    label={
                      scenario.multiplier === 1
                        ? 'Your current plan'
                        : scenario.multiplier < 1
                          ? 'Save 25% less'
                          : `Save ${Math.round((scenario.multiplier - 1) * 100)}% more`
                    }
                    targetCents={targetCents}
                    currentCents={currentCents}
                    weeklySavingsCents={scenario.cents}
                    highlighted={scenario.multiplier === 1}
                  />
                ))}
              </View>
            </>
          ) : null}

          {canCreateGoal ? (
            <Pressable
              style={[
                styles.createGoalButton,
                creatingGoal && styles.buttonDisabled,
              ]}
              onPress={createGoalFromPlan}
              disabled={creatingGoal}
            >
              <Ionicons name="flag-outline" size={19} color="#FFFFFF" />
              <Text style={styles.createGoalButtonText}>
                {creatingGoal ? 'Creating goal...' : 'Turn this into a savings goal'}
              </Text>
            </Pressable>
          ) : null}

          <View style={styles.noteCard}>
            <Ionicons name="information-circle-outline" size={19} color={Colors.primary} />
            <Text style={styles.noteText}>
              This calculator does not move or reserve money by itself. If you turn
              the plan into a goal, you can allocate savings to it from the Goals tab.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safeArea: { flex: 1, backgroundColor: Colors.background },
  content: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 120 },
  header: { marginBottom: 22 },
  eyebrow: {
    color: Colors.primary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 5,
  },
  title: {
    color: Colors.text,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '800',
    maxWidth: 340,
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 7,
    maxWidth: 345,
  },
  formCard: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 23,
    padding: 18,
  },
  label: {
    color: Colors.text,
    fontSize: 12,
    fontWeight: '800',
    marginTop: 16,
    marginBottom: 8,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  quickAction: {
    color: Colors.primary,
    fontSize: 10,
    fontWeight: '800',
    marginBottom: 8,
  },
  textInput: {
    minHeight: 50,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
    color: Colors.text,
    fontSize: 14,
    paddingHorizontal: 15,
  },
  amountInputWrap: {
    minHeight: 69,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },
  currencySymbol: {
    color: Colors.textSecondary,
    fontSize: 24,
    fontWeight: '700',
    marginRight: 7,
  },
  amountInput: {
    flex: 1,
    color: Colors.text,
    fontSize: 27,
    fontWeight: '800',
  },
  amountInputWrapSmall: {
    minHeight: 52,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  currencySymbolSmall: {
    color: Colors.textSecondary,
    fontSize: 16,
    fontWeight: '700',
    marginRight: 6,
  },
  smallAmountInput: {
    flex: 1,
    color: Colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  weekSuffix: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
  },
  helperText: {
    color: Colors.textMuted,
    fontSize: 10,
    marginTop: 6,
  },
  resultCard: {
    backgroundColor: Colors.primarySoft,
    borderRadius: 23,
    padding: 21,
    marginTop: 16,
  },
  resultIcon: {
    width: 44,
    height: 44,
    borderRadius: 15,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  resultEyebrow: {
    color: Colors.primary,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  resultTitle: {
    color: Colors.primaryDark,
    fontSize: 27,
    fontWeight: '800',
    marginTop: 4,
  },
  resultDate: {
    color: Colors.textSecondary,
    fontSize: 12,
    marginTop: 5,
    lineHeight: 18,
  },
  resultDivider: {
    height: 1,
    backgroundColor: '#DBEAFE',
    marginVertical: 17,
  },
  resultStats: {
    flexDirection: 'row',
  },
  resultStat: { flex: 1 },
  resultStatLabel: { color: Colors.textMuted, fontSize: 10 },
  resultStatValue: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '800',
    marginTop: 3,
  },
  emptyResult: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 22,
    padding: 27,
    alignItems: 'center',
    marginTop: 16,
  },
  emptyIcon: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: Colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 13,
  },
  emptyTitle: { color: Colors.text, fontSize: 16, fontWeight: '800' },
  emptyText: {
    color: Colors.textSecondary,
    fontSize: 12,
    marginTop: 5,
  },
  sectionTitle: {
    color: Colors.text,
    fontSize: 17,
    fontWeight: '800',
    marginTop: 26,
    marginBottom: 11,
  },
  scenarioCard: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 20,
    padding: 6,
  },
  createGoalButton: {
    minHeight: 54,
    borderRadius: 17,
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 18,
  },
  createGoalButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  buttonDisabled: { opacity: 0.7 },
  noteCard: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 17,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
    marginTop: 12,
  },
  noteText: {
    flex: 1,
    color: Colors.textSecondary,
    fontSize: 11,
    lineHeight: 17,
  },
});
