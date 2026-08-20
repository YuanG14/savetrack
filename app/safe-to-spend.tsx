import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
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

import { CommitmentRow } from '../components/safe-spend/CommitmentRow';
import { Colors } from '../constants/theme';
import { useSafeSpend } from '../contexts/SafeSpendContext';
import { useSavings } from '../contexts/SavingsContext';
import { useTransactions } from '../contexts/TransactionContext';
import { formatCurrencyFromCents } from '../utils/currency';
import { isValidDateString } from '../utils/date';
import {
  calculateDailySafeToSpend,
  calculateSafeToSpend,
  getCommitmentsBeforeDate,
  getDaysUntilDate,
} from '../utils/safe-spend';

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

export default function SafeToSpendScreen() {
  const router = useRouter();
  const { transactions } = useTransactions();
  const { currentSavingsCents } = useSavings();
  const {
    commitments,
    loading,
    nextIncomeDate,
    expectedIncomeCents,
    saveIncomePlan,
  } = useSafeSpend();

  const [dateInput, setDateInput] = useState(nextIncomeDate ?? '');
  const [incomeInput, setIncomeInput] = useState(
    expectedIncomeCents > 0 ? (expectedIncomeCents / 100).toFixed(2) : ''
  );
  const [savingPlan, setSavingPlan] = useState(false);

  const calculations = useMemo(() => {
    const allIncome = transactions
      .filter((item) => item.type === 'income')
      .reduce((sum, item) => sum + item.amountCents, 0);

    const allExpenses = transactions
      .filter((item) => item.type === 'expense')
      .reduce((sum, item) => sum + item.amountCents, 0);

    const balanceCents = allIncome - allExpenses;

    const relevantCommitments = getCommitmentsBeforeDate(
      commitments,
      nextIncomeDate
    );

    const commitmentCents = relevantCommitments.reduce(
      (sum, item) => sum + item.amountCents,
      0
    );

    const safeCents = calculateSafeToSpend(
      balanceCents,
      currentSavingsCents,
      commitmentCents
    );

    const daysUntilIncome = getDaysUntilDate(nextIncomeDate);
    const dailyCents = calculateDailySafeToSpend(
      Math.max(0, safeCents),
      daysUntilIncome
    );

    return {
      balanceCents,
      relevantCommitments,
      commitmentCents,
      safeCents,
      daysUntilIncome,
      dailyCents,
    };
  }, [transactions, currentSavingsCents, commitments, nextIncomeDate]);

  const savePlan = async () => {
    if (dateInput && !isValidDateString(dateInput)) {
      Alert.alert('Check next income date', 'Use YYYY-MM-DD or leave it blank.');
      return;
    }

    const numericIncome =
      incomeInput.trim() === '' ? 0 : Number.parseFloat(incomeInput);

    if (!Number.isFinite(numericIncome) || numericIncome < 0) {
      Alert.alert('Check expected income', 'Enter ₱0 or higher.');
      return;
    }

    setSavingPlan(true);
    try {
      await saveIncomePlan(
        dateInput || null,
        Math.round(numericIncome * 100)
      );
      Alert.alert('Income plan saved', 'Safe-to-spend has been recalculated.');
    } catch (error) {
      console.error(error);
      Alert.alert('Could not save income plan', 'Please try again.');
    } finally {
      setSavingPlan(false);
    }
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
              <Text style={styles.title}>Safe to spend</Text>
              <Text style={styles.subtitle}>
                Know what you can use without touching savings or upcoming needs.
              </Text>
            </View>
          </View>

          <View
            style={[
              styles.heroCard,
              calculations.safeCents < 0 && styles.heroCardDanger,
            ]}
          >
            <Text style={styles.heroLabel}>Safe to spend now</Text>
            <Text
              style={[
                styles.heroValue,
                calculations.safeCents < 0 && styles.heroValueDanger,
              ]}
            >
              {formatCurrencyFromCents(calculations.safeCents)}
            </Text>

            <Text style={styles.heroDescription}>
              Balance − reserved savings − commitments due before your next income.
            </Text>

            <View style={styles.heroDivider} />

            <View style={styles.dailyRow}>
              <View>
                <Text style={styles.dailyLabel}>Daily safe-to-spend</Text>
                <Text style={styles.dailyValue}>
                  {calculations.dailyCents === null
                    ? 'Set income date'
                    : formatCurrencyFromCents(calculations.dailyCents)}
                </Text>
              </View>

              <View style={styles.daysPill}>
                <Text style={styles.daysText}>
                  {calculations.daysUntilIncome === null
                    ? 'No date'
                    : calculations.daysUntilIncome === 0
                      ? 'Today'
                      : `${calculations.daysUntilIncome} days`}
                </Text>
              </View>
            </View>
          </View>

          <Text style={styles.sectionTitle}>How it is calculated</Text>

          <View style={styles.breakdownCard}>
            <BreakdownRow
              label="Available balance"
              value={calculations.balanceCents}
              positive
            />
            <View style={styles.divider} />
            <BreakdownRow
              label="Reserved savings"
              value={-currentSavingsCents}
            />
            <View style={styles.divider} />
            <BreakdownRow
              label="Upcoming commitments"
              value={-calculations.commitmentCents}
            />
            <View style={styles.dividerStrong} />
            <BreakdownRow
              label="Safe to spend"
              value={calculations.safeCents}
              strong
              positive={calculations.safeCents >= 0}
            />
          </View>

          <Text style={styles.sectionTitle}>Next income</Text>

          <View style={styles.planCard}>
            <Text style={styles.label}>Next income date</Text>
            <TextInput
              value={dateInput}
              onChangeText={setDateInput}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={Colors.textMuted}
              style={styles.textInput}
              maxLength={10}
              autoCapitalize="none"
            />

            <Text style={styles.label}>Expected income</Text>
            <View style={styles.amountWrap}>
              <Text style={styles.currency}>₱</Text>
              <TextInput
                value={incomeInput}
                onChangeText={(value) => setIncomeInput(cleanMoney(value))}
                placeholder="0.00"
                placeholderTextColor={Colors.textMuted}
                keyboardType="decimal-pad"
                style={styles.amountInput}
                maxLength={12}
              />
            </View>

            <Pressable
              style={[styles.savePlanButton, savingPlan && styles.disabled]}
              onPress={savePlan}
              disabled={savingPlan}
            >
              {savingPlan ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.savePlanText}>Save income plan</Text>
              )}
            </Pressable>
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Upcoming commitments</Text>

            <Pressable
              style={styles.addCommitmentButton}
              onPress={() => router.push('/commitment-editor')}
            >
              <Ionicons name="add" size={17} color={Colors.primary} />
              <Text style={styles.addCommitmentText}>Add</Text>
            </Pressable>
          </View>

          {loading ? (
            <View style={styles.loadingCard}>
              <ActivityIndicator color={Colors.primary} />
            </View>
          ) : calculations.relevantCommitments.length === 0 ? (
            <View style={styles.emptyCard}>
              <View style={styles.emptyIcon}>
                <Ionicons
                  name="calendar-clear-outline"
                  size={25}
                  color={Colors.primary}
                />
              </View>
              <Text style={styles.emptyTitle}>Nothing reserved yet</Text>
              <Text style={styles.emptyText}>
                Add known bills, school payments, transport costs, or other upcoming obligations.
              </Text>
            </View>
          ) : (
            <View style={styles.commitmentsCard}>
              {calculations.relevantCommitments.map((item, index) => (
                <View key={item.id}>
                  <CommitmentRow commitment={item} />
                  {index < calculations.relevantCommitments.length - 1 ? (
                    <View style={styles.rowDivider} />
                  ) : null}
                </View>
              ))}
            </View>
          )}

          {expectedIncomeCents > 0 ? (
            <View style={styles.futureCard}>
              <Ionicons name="sparkles-outline" size={20} color={Colors.primary} />
              <View style={styles.futureText}>
                <Text style={styles.futureTitle}>After your next income</Text>
                <Text style={styles.futureDescription}>
                  If nothing else changes, your available money would increase by about{' '}
                  {formatCurrencyFromCents(expectedIncomeCents)}.
                </Text>
              </View>
            </View>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

type BreakdownRowProps = {
  label: string;
  value: number;
  strong?: boolean;
  positive?: boolean;
};

function BreakdownRow({
  label,
  value,
  strong = false,
  positive = false,
}: BreakdownRowProps) {
  return (
    <View style={styles.breakdownRow}>
      <Text style={[styles.breakdownLabel, strong && styles.breakdownStrong]}>
        {label}
      </Text>
      <Text
        style={[
          styles.breakdownValue,
          strong && styles.breakdownStrong,
          positive && styles.positiveValue,
          value < 0 && !positive && styles.negativeValue,
        ]}
      >
        {value < 0 ? '−' : ''}
        {formatCurrencyFromCents(Math.abs(value))}
      </Text>
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
  subtitle: {
    color: Colors.textSecondary,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 3,
  },
  heroCard: {
    backgroundColor: Colors.primarySoft,
    borderRadius: 24,
    padding: 21,
    marginBottom: 26,
  },
  heroCardDanger: { backgroundColor: Colors.dangerSoft },
  heroLabel: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  heroValue: {
    color: Colors.primaryDark,
    fontSize: 34,
    fontWeight: '800',
    marginTop: 5,
  },
  heroValueDanger: { color: Colors.danger },
  heroDescription: {
    color: Colors.textSecondary,
    fontSize: 11,
    lineHeight: 17,
    marginTop: 7,
  },
  heroDivider: {
    height: 1,
    backgroundColor: '#DBEAFE',
    marginVertical: 17,
  },
  dailyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dailyLabel: { color: Colors.textSecondary, fontSize: 10 },
  dailyValue: { color: Colors.text, fontSize: 18, fontWeight: '800', marginTop: 3 },
  daysPill: {
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    paddingVertical: 7,
    paddingHorizontal: 11,
  },
  daysText: { color: Colors.primary, fontSize: 10, fontWeight: '800' },
  sectionTitle: {
    color: Colors.text,
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 11,
  },
  breakdownCard: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 20,
    padding: 16,
    marginBottom: 26,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 34,
  },
  breakdownLabel: { color: Colors.textSecondary, fontSize: 11 },
  breakdownValue: { color: Colors.text, fontSize: 12, fontWeight: '800' },
  breakdownStrong: { color: Colors.text, fontSize: 13, fontWeight: '900' },
  positiveValue: { color: Colors.success },
  negativeValue: { color: Colors.danger },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 5 },
  dividerStrong: { height: 1, backgroundColor: Colors.border, marginVertical: 7 },
  planCard: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 20,
    padding: 17,
    marginBottom: 26,
  },
  label: {
    color: Colors.text,
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 7,
    marginTop: 12,
  },
  textInput: {
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
    color: Colors.text,
    paddingHorizontal: 14,
    fontSize: 13,
  },
  amountWrap: {
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
  },
  currency: {
    color: Colors.textSecondary,
    fontSize: 15,
    fontWeight: '700',
    marginRight: 5,
  },
  amountInput: { flex: 1, color: Colors.text, fontSize: 14, fontWeight: '700' },
  savePlanButton: {
    minHeight: 48,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  disabled: { opacity: 0.7 },
  savePlanText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  addCommitmentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginBottom: 11,
  },
  addCommitmentText: { color: Colors.primary, fontSize: 11, fontWeight: '800' },
  loadingCard: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
  },
  emptyCard: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 20,
    padding: 27,
    alignItems: 'center',
  },
  emptyIcon: {
    width: 52,
    height: 52,
    borderRadius: 17,
    backgroundColor: Colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyTitle: { color: Colors.text, fontSize: 15, fontWeight: '800' },
  emptyText: {
    color: Colors.textSecondary,
    fontSize: 11,
    lineHeight: 17,
    textAlign: 'center',
    marginTop: 6,
  },
  commitmentsCard: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 20,
    overflow: 'hidden',
  },
  rowDivider: { height: 1, backgroundColor: '#F1F5F9', marginLeft: 68 },
  futureCard: {
    marginTop: 16,
    backgroundColor: Colors.primarySoft,
    borderRadius: 17,
    padding: 14,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  futureText: { flex: 1 },
  futureTitle: { color: Colors.text, fontSize: 12, fontWeight: '800' },
  futureDescription: {
    color: Colors.textSecondary,
    fontSize: 10,
    lineHeight: 16,
    marginTop: 3,
  },
});
