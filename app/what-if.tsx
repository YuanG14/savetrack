import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ComparisonRow } from '../components/what-if/ComparisonRow';
import { Colors } from '../constants/theme';
import { useGoals } from '../contexts/GoalContext';
import { useSafeSpend } from '../contexts/SafeSpendContext';
import { useSavings } from '../contexts/SavingsContext';
import { useTransactions } from '../contexts/TransactionContext';
import { formatCurrencyFromCents } from '../utils/currency';
import { formatEstimatedDate } from '../utils/planner';
import {
  calculateSafeToSpend,
  getCommitmentsBeforeDate,
} from '../utils/safe-spend';
import { calculateWhatIfScenario } from '../utils/what-if';

function cleanMoney(value: string): string {
  const cleaned = value.replace(/[^\d.]/g, '');
  const dot = cleaned.indexOf('.');

  if (dot === -1) return cleaned;

  const whole = cleaned.slice(0, dot);
  const decimals = cleaned
    .slice(dot + 1)
    .replace(/\./g, '')
    .slice(0, 2);

  return `${whole}.${decimals}`;
}

function moneyToCents(value: string): number {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? Math.round(parsed * 100) : 0;
}

export default function WhatIfScreen() {
  const router = useRouter();
  const { transactions } = useTransactions();
  const { currentSavingsCents } = useSavings();
  const { commitments, nextIncomeDate } = useSafeSpend();
  const { goals } = useGoals();

  const [selectedGoalId, setSelectedGoalId] = useState<number | null>(
    goals[0]?.id ?? null
  );
  const [extraIncome, setExtraIncome] = useState('');
  const [spendingCut, setSpendingCut] = useState('');
  const [extraExpense, setExtraExpense] = useState('');
  const [weeklySavings, setWeeklySavings] = useState('');
  const [extraWeeklySavings, setExtraWeeklySavings] = useState('');
  const [applySurplus, setApplySurplus] = useState(true);

  const selectedGoal =
    goals.find((goal) => goal.id === selectedGoalId) ?? goals[0] ?? null;

  const base = useMemo(() => {
    const incomeCents = transactions
      .filter((item) => item.type === 'income')
      .reduce((sum, item) => sum + item.amountCents, 0);

    const expenseCents = transactions
      .filter((item) => item.type === 'expense')
      .reduce((sum, item) => sum + item.amountCents, 0);

    const balanceCents = incomeCents - expenseCents;

    const relevantCommitments = getCommitmentsBeforeDate(
      commitments,
      nextIncomeDate
    );

    const commitmentCents = relevantCommitments.reduce(
      (sum, item) => sum + item.amountCents,
      0
    );

    const safeToSpendCents = calculateSafeToSpend(
      balanceCents,
      currentSavingsCents,
      commitmentCents
    );

    return {
      balanceCents,
      safeToSpendCents,
      commitmentCents,
    };
  }, [
    transactions,
    commitments,
    nextIncomeDate,
    currentSavingsCents,
  ]);

  const goalRemainingCents = selectedGoal
    ? Math.max(
        0,
        selectedGoal.targetAmountCents - selectedGoal.allocatedCents
      )
    : 0;

  const result = useMemo(
    () =>
      calculateWhatIfScenario({
        extraIncomeCents: moneyToCents(extraIncome),
        spendingCutCents: moneyToCents(spendingCut),
        extraExpenseCents: moneyToCents(extraExpense),
        currentSafeToSpendCents: base.safeToSpendCents,
        currentBalanceCents: base.balanceCents,
        goalRemainingCents,
        baselineWeeklySavingsCents: moneyToCents(weeklySavings),
        extraWeeklySavingsCents: moneyToCents(extraWeeklySavings),
        applyMonthlySurplusToGoal: applySurplus,
      }),
    [
      extraIncome,
      spendingCut,
      extraExpense,
      base.safeToSpendCents,
      base.balanceCents,
      goalRemainingCents,
      weeklySavings,
      extraWeeklySavings,
      applySurplus,
    ]
  );

  const hasScenario =
    moneyToCents(extraIncome) > 0 ||
    moneyToCents(spendingCut) > 0 ||
    moneyToCents(extraExpense) > 0 ||
    moneyToCents(extraWeeklySavings) > 0;

  const resetScenario = () => {
    setExtraIncome('');
    setSpendingCut('');
    setExtraExpense('');
    setExtraWeeklySavings('');
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.topBar}>
            <Pressable style={styles.backButton} onPress={() => router.back()}>
              <Ionicons name="chevron-back" size={22} color={Colors.text} />
            </Pressable>

            <View style={styles.topText}>
              <Text style={styles.title}>What if?</Text>
              <Text style={styles.subtitle}>
                Test changes without touching your real data.
              </Text>
            </View>

            {hasScenario ? (
              <Pressable onPress={resetScenario}>
                <Text style={styles.resetText}>Reset</Text>
              </Pressable>
            ) : null}
          </View>

          <View style={styles.baseCard}>
            <Text style={styles.baseLabel}>Your current position</Text>

            <View style={styles.baseRow}>
              <View style={styles.baseItem}>
                <Text style={styles.baseItemLabel}>Balance</Text>
                <Text style={styles.baseItemValue}>
                  {formatCurrencyFromCents(base.balanceCents)}
                </Text>
              </View>

              <View style={styles.baseDivider} />

              <View style={styles.baseItem}>
                <Text style={styles.baseItemLabel}>Safe to spend</Text>
                <Text
                  style={[
                    styles.baseItemValue,
                    base.safeToSpendCents < 0 && styles.dangerText,
                  ]}
                >
                  {formatCurrencyFromCents(base.safeToSpendCents)}
                </Text>
              </View>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Change the month</Text>

          <View style={styles.inputsCard}>
            <ScenarioInput
              icon="cash-outline"
              label="Extra income"
              value={extraIncome}
              onChange={setExtraIncome}
              positive
              placeholder="0.00"
            />

            <View style={styles.divider} />

            <ScenarioInput
              icon="cut-outline"
              label="Spend less"
              value={spendingCut}
              onChange={setSpendingCut}
              positive
              placeholder="0.00"
            />

            <View style={styles.divider} />

            <ScenarioInput
              icon="card-outline"
              label="Extra expense"
              value={extraExpense}
              onChange={setExtraExpense}
              placeholder="0.00"
            />
          </View>

          <Text style={styles.sectionTitle}>Goal simulation</Text>

          {goals.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.goalChips}
            >
              {goals.map((goal) => {
                const active = selectedGoal?.id === goal.id;

                return (
                  <Pressable
                    key={goal.id}
                    onPress={() => setSelectedGoalId(goal.id)}
                    style={[
                      styles.goalChip,
                      active && styles.goalChipActive,
                    ]}
                  >
                    <Text style={styles.goalEmoji}>{goal.emoji}</Text>
                    <Text
                      numberOfLines={1}
                      style={[
                        styles.goalChipText,
                        active && styles.goalChipTextActive,
                      ]}
                    >
                      {goal.name}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          ) : (
            <Pressable
              style={styles.noGoalCard}
              onPress={() => router.push('/goals')}
            >
              <View style={styles.noGoalIcon}>
                <Ionicons name="flag-outline" size={21} color={Colors.primary} />
              </View>
              <View style={styles.noGoalText}>
                <Text style={styles.noGoalTitle}>Create a savings goal first</Text>
                <Text style={styles.noGoalMeta}>
                  Goal timelines become more useful when SaveTrack knows what you are saving for.
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={17} color={Colors.textMuted} />
            </Pressable>
          )}

          <View style={styles.goalInputsCard}>
            <Text style={styles.label}>Your usual weekly savings</Text>
            <MoneyInput
              value={weeklySavings}
              onChange={setWeeklySavings}
              suffix="/ week"
            />

            <Text style={styles.label}>Save this much more each week</Text>
            <MoneyInput
              value={extraWeeklySavings}
              onChange={setExtraWeeklySavings}
              suffix="extra"
            />

            <View style={styles.switchRow}>
              <View style={styles.switchText}>
                <Text style={styles.switchTitle}>
                  Put monthly surplus toward goal
                </Text>
                <Text style={styles.switchMeta}>
                  Assume extra income and spending cuts are added to the selected goal.
                </Text>
              </View>

              <Switch
                value={applySurplus}
                onValueChange={setApplySurplus}
                trackColor={{
                  false: '#CBD5E1',
                  true: '#93C5FD',
                }}
                thumbColor={applySurplus ? Colors.primary : '#F8FAFC'}
              />
            </View>
          </View>

          {hasScenario ? (
            <>
              <Text style={styles.sectionTitle}>Projected result</Text>

              <View style={styles.resultCard}>
                <View style={styles.resultHeader}>
                  <View
                    style={[
                      styles.resultIcon,
                      result.netMonthlyChangeCents >= 0
                        ? styles.resultIconPositive
                        : styles.resultIconNegative,
                    ]}
                  >
                    <Ionicons
                      name={
                        result.netMonthlyChangeCents >= 0
                          ? 'trending-up-outline'
                          : 'trending-down-outline'
                      }
                      size={22}
                      color={
                        result.netMonthlyChangeCents >= 0
                          ? Colors.success
                          : Colors.danger
                      }
                    />
                  </View>

                  <View style={styles.resultHeaderText}>
                    <Text style={styles.resultEyebrow}>MONTHLY IMPACT</Text>
                    <Text
                      style={[
                        styles.resultHeadline,
                        result.netMonthlyChangeCents < 0 && styles.dangerText,
                      ]}
                    >
                      {result.netMonthlyChangeCents >= 0 ? '+' : '−'}
                      {formatCurrencyFromCents(
                        Math.abs(result.netMonthlyChangeCents)
                      )}
                    </Text>
                  </View>
                </View>

                <ComparisonRow
                  label="Available balance"
                  currentCents={base.balanceCents}
                  projectedCents={result.projectedBalanceCents}
                />

                <View style={styles.divider} />

                <ComparisonRow
                  label="Safe to spend"
                  currentCents={base.safeToSpendCents}
                  projectedCents={result.projectedSafeToSpendCents}
                />
              </View>

              {selectedGoal ? (
                <View style={styles.goalResultCard}>
                  <View style={styles.goalResultHeader}>
                    <View>
                      <Text style={styles.goalResultEyebrow}>GOAL IMPACT</Text>
                      <Text style={styles.goalResultTitle}>
                        {selectedGoal.emoji} {selectedGoal.name}
                      </Text>
                    </View>

                    {result.weeksSaved !== null && result.weeksSaved > 0 ? (
                      <View style={styles.savedPill}>
                        <Text style={styles.savedPillText}>
                          {result.weeksSaved}w faster
                        </Text>
                      </View>
                    ) : null}
                  </View>

                  <View style={styles.goalStats}>
                    <View style={styles.goalStat}>
                      <Text style={styles.goalStatLabel}>Remaining now</Text>
                      <Text style={styles.goalStatValue}>
                        {formatCurrencyFromCents(goalRemainingCents)}
                      </Text>
                    </View>

                    <View style={styles.goalStat}>
                      <Text style={styles.goalStatLabel}>After scenario</Text>
                      <Text style={styles.goalStatValue}>
                        {formatCurrencyFromCents(
                          result.projectedGoalRemainingCents
                        )}
                      </Text>
                    </View>
                  </View>

                  {result.projectedWeeks !== null ? (
                    <View style={styles.timelineBox}>
                      <Text style={styles.timelineLabel}>Projected timeline</Text>
                      <Text style={styles.timelineValue}>
                        {result.projectedGoalRemainingCents === 0
                          ? 'Goal reached immediately'
                          : `${result.projectedWeeks} ${
                              result.projectedWeeks === 1 ? 'week' : 'weeks'
                            }`}
                      </Text>
                      <Text style={styles.timelineDate}>
                        {result.projectedGoalDate
                          ? `Around ${formatEstimatedDate(
                              result.projectedGoalDate
                            )}`
                          : ''}
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.timelineBox}>
                      <Text style={styles.timelineLabel}>Projected timeline</Text>
                      <Text style={styles.timelineHint}>
                        Add your usual weekly savings to calculate a completion date.
                      </Text>
                    </View>
                  )}

                  {result.oneTimeGoalBoostCents > 0 ? (
                    <Text style={styles.boostNote}>
                      This scenario assumes you put{' '}
                      {formatCurrencyFromCents(result.oneTimeGoalBoostCents)} of
                      monthly surplus toward this goal.
                    </Text>
                  ) : null}
                </View>
              ) : null}

              {result.projectedSafeToSpendCents < 0 ? (
                <View style={styles.warningCard}>
                  <Ionicons name="warning-outline" size={20} color={Colors.danger} />
                  <Text style={styles.warningText}>
                    This scenario would put your safe-to-spend below zero. You would
                    need more income, fewer expenses, or less reserved money.
                  </Text>
                </View>
              ) : null}
            </>
          ) : (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Ionicons
                  name="git-compare-outline"
                  size={26}
                  color={Colors.primary}
                />
              </View>
              <Text style={styles.emptyTitle}>Change one number</Text>
              <Text style={styles.emptyText}>
                Add extra income, cut spending, add an expense, or increase weekly savings to see what changes.
              </Text>
            </View>
          )}

          <View style={styles.infoCard}>
            <Ionicons
              name="information-circle-outline"
              size={19}
              color={Colors.primary}
            />
            <Text style={styles.infoText}>
              Simulations are temporary. Nothing here changes your transactions,
              savings, commitments, or goals.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

type ScenarioInputProps = {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  positive?: boolean;
};

function ScenarioInput({
  icon,
  label,
  value,
  onChange,
  placeholder,
  positive = false,
}: ScenarioInputProps) {
  return (
    <View style={styles.scenarioRow}>
      <View
        style={[
          styles.scenarioIcon,
          positive ? styles.positiveIcon : styles.negativeIcon,
        ]}
      >
        <Ionicons
          name={icon}
          size={18}
          color={positive ? Colors.success : Colors.danger}
        />
      </View>

      <Text style={styles.scenarioLabel}>{label}</Text>

      <View style={styles.scenarioAmountWrap}>
        <Text style={styles.smallCurrency}>₱</Text>
        <TextInput
          value={value}
          onChangeText={(text) => onChange(cleanMoney(text))}
          placeholder={placeholder}
          placeholderTextColor={Colors.textMuted}
          keyboardType="decimal-pad"
          style={styles.scenarioAmountInput}
          maxLength={12}
        />
      </View>
    </View>
  );
}

type MoneyInputProps = {
  value: string;
  onChange: (value: string) => void;
  suffix: string;
};

function MoneyInput({ value, onChange, suffix }: MoneyInputProps) {
  return (
    <View style={styles.moneyInputWrap}>
      <Text style={styles.currency}>₱</Text>
      <TextInput
        value={value}
        onChangeText={(text) => onChange(cleanMoney(text))}
        placeholder="0.00"
        placeholderTextColor={Colors.textMuted}
        keyboardType="decimal-pad"
        style={styles.moneyInput}
        maxLength={12}
      />
      <Text style={styles.suffix}>{suffix}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safeArea: { flex: 1, backgroundColor: Colors.background },
  content: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 40 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topText: { flex: 1, marginLeft: 14 },
  title: { color: Colors.text, fontSize: 22, fontWeight: '800' },
  subtitle: { color: Colors.textSecondary, fontSize: 12, marginTop: 3 },
  resetText: { color: Colors.primary, fontSize: 11, fontWeight: '800' },
  baseCard: {
    backgroundColor: Colors.primary,
    borderRadius: 22,
    padding: 18,
    marginBottom: 25,
  },
  baseLabel: { color: '#BFDBFE', fontSize: 11, fontWeight: '700' },
  baseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
  },
  baseItem: { flex: 1 },
  baseDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.18)',
    marginHorizontal: 14,
  },
  baseItemLabel: { color: '#BFDBFE', fontSize: 9 },
  baseItemValue: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
    marginTop: 4,
  },
  dangerText: { color: Colors.danger },
  sectionTitle: {
    color: Colors.text,
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 11,
    marginTop: 2,
  },
  inputsCard: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 20,
    paddingHorizontal: 15,
    marginBottom: 25,
  },
  scenarioRow: {
    minHeight: 66,
    flexDirection: 'row',
    alignItems: 'center',
  },
  scenarioIcon: {
    width: 38,
    height: 38,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  positiveIcon: { backgroundColor: Colors.successSoft },
  negativeIcon: { backgroundColor: Colors.dangerSoft },
  scenarioLabel: {
    flex: 1,
    color: Colors.text,
    fontSize: 11,
    fontWeight: '800',
    marginLeft: 10,
  },
  scenarioAmountWrap: {
    width: 108,
    minHeight: 42,
    borderRadius: 12,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  smallCurrency: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    marginRight: 3,
  },
  scenarioAmountInput: {
    flex: 1,
    color: Colors.text,
    fontSize: 12,
    fontWeight: '800',
    paddingVertical: 0,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },
  goalChips: {
    gap: 8,
    paddingBottom: 12,
  },
  goalChip: {
    maxWidth: 170,
    minHeight: 43,
    borderRadius: 14,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  goalChipActive: {
    backgroundColor: Colors.primarySoft,
    borderColor: Colors.primary,
  },
  goalEmoji: { fontSize: 17 },
  goalChipText: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '800',
    flexShrink: 1,
  },
  goalChipTextActive: { color: Colors.primary },
  noGoalCard: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 18,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  noGoalIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: Colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noGoalText: { flex: 1, marginLeft: 10, marginRight: 8 },
  noGoalTitle: { color: Colors.text, fontSize: 11, fontWeight: '800' },
  noGoalMeta: {
    color: Colors.textMuted,
    fontSize: 9,
    lineHeight: 14,
    marginTop: 3,
  },
  goalInputsCard: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 20,
    padding: 17,
    marginBottom: 25,
  },
  label: {
    color: Colors.text,
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 7,
    marginTop: 11,
  },
  moneyInputWrap: {
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13,
  },
  currency: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '700',
    marginRight: 4,
  },
  moneyInput: {
    flex: 1,
    color: Colors.text,
    fontSize: 14,
    fontWeight: '800',
  },
  suffix: { color: Colors.textMuted, fontSize: 9, fontWeight: '700' },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 17,
  },
  switchText: { flex: 1, marginRight: 10 },
  switchTitle: { color: Colors.text, fontSize: 11, fontWeight: '800' },
  switchMeta: {
    color: Colors.textMuted,
    fontSize: 9,
    lineHeight: 14,
    marginTop: 3,
  },
  resultCard: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 21,
    padding: 16,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  resultIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultIconPositive: { backgroundColor: Colors.successSoft },
  resultIconNegative: { backgroundColor: Colors.dangerSoft },
  resultHeaderText: { marginLeft: 11 },
  resultEyebrow: {
    color: Colors.textMuted,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
  },
  resultHeadline: {
    color: Colors.success,
    fontSize: 21,
    fontWeight: '800',
    marginTop: 2,
  },
  goalResultCard: {
    backgroundColor: Colors.primarySoft,
    borderRadius: 21,
    padding: 17,
    marginTop: 12,
  },
  goalResultHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  goalResultEyebrow: {
    color: Colors.primary,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
  },
  goalResultTitle: {
    color: Colors.primaryDark,
    fontSize: 15,
    fontWeight: '800',
    marginTop: 4,
  },
  savedPill: {
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  savedPillText: {
    color: Colors.success,
    fontSize: 9,
    fontWeight: '900',
  },
  goalStats: {
    flexDirection: 'row',
    marginTop: 17,
  },
  goalStat: { flex: 1 },
  goalStatLabel: { color: Colors.textMuted, fontSize: 9 },
  goalStatValue: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '800',
    marginTop: 3,
  },
  timelineBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 13,
    marginTop: 14,
  },
  timelineLabel: { color: Colors.textMuted, fontSize: 9 },
  timelineValue: {
    color: Colors.text,
    fontSize: 17,
    fontWeight: '800',
    marginTop: 3,
  },
  timelineDate: {
    color: Colors.primary,
    fontSize: 10,
    fontWeight: '700',
    marginTop: 3,
  },
  timelineHint: {
    color: Colors.textSecondary,
    fontSize: 10,
    lineHeight: 15,
    marginTop: 4,
  },
  boostNote: {
    color: Colors.textSecondary,
    fontSize: 9,
    lineHeight: 14,
    marginTop: 11,
  },
  warningCard: {
    backgroundColor: Colors.dangerSoft,
    borderRadius: 17,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
    marginTop: 12,
  },
  warningText: {
    flex: 1,
    color: Colors.textSecondary,
    fontSize: 10,
    lineHeight: 16,
  },
  emptyState: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 21,
    padding: 28,
    alignItems: 'center',
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
  emptyTitle: { color: Colors.text, fontSize: 15, fontWeight: '800' },
  emptyText: {
    color: Colors.textSecondary,
    fontSize: 10,
    lineHeight: 16,
    textAlign: 'center',
    marginTop: 5,
    maxWidth: 290,
  },
  infoCard: {
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
  infoText: {
    flex: 1,
    color: Colors.textSecondary,
    fontSize: 10,
    lineHeight: 16,
  },
});
