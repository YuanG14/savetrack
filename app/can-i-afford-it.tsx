import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import {
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
import { useRouter } from 'expo-router';

import { AffordabilityStatusCard } from '../components/affordability/AffordabilityStatusCard';
import { Colors } from '../constants/theme';
import { useGoals } from '../contexts/GoalContext';
import { useSafeSpend } from '../contexts/SafeSpendContext';
import { useSavings } from '../contexts/SavingsContext';
import { useTransactions } from '../contexts/TransactionContext';
import {
  calculateGoalDelayWeeks,
  evaluatePurchase,
} from '../utils/affordability';
import { formatCurrencyFromCents } from '../utils/currency';
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

export default function CanIAffordItScreen() {
  const router = useRouter();
  const { transactions } = useTransactions();
  const { currentSavingsCents } = useSavings();
  const { commitments, nextIncomeDate } = useSafeSpend();
  const { goals } = useGoals();

  const [purchaseName, setPurchaseName] = useState('');
  const [price, setPrice] = useState('');
  const [weeklySavings, setWeeklySavings] = useState('');

  const priceCents = useMemo(() => {
    const parsed = Number.parseFloat(price);
    return Number.isFinite(parsed) ? Math.round(parsed * 100) : 0;
  }, [price]);

  const weeklySavingsCents = useMemo(() => {
    const parsed = Number.parseFloat(weeklySavings);
    return Number.isFinite(parsed) ? Math.round(parsed * 100) : 0;
  }, [weeklySavings]);

  const analysis = useMemo(() => {
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

    const daysUntilIncome = getDaysUntilDate(nextIncomeDate);

    const dailySafeBefore = calculateDailySafeToSpend(
      Math.max(0, safeToSpendCents),
      daysUntilIncome
    );

    const affordability = evaluatePurchase(
      priceCents,
      balanceCents,
      safeToSpendCents,
      currentSavingsCents
    );

    const dailySafeAfter = calculateDailySafeToSpend(
      Math.max(0, affordability.remainingSafeCents),
      daysUntilIncome
    );

    const delayWeeks = calculateGoalDelayWeeks(
      priceCents,
      weeklySavingsCents
    );

    return {
      balanceCents,
      commitmentCents,
      safeToSpendCents,
      daysUntilIncome,
      dailySafeBefore,
      dailySafeAfter,
      affordability,
      delayWeeks,
    };
  }, [
    transactions,
    commitments,
    nextIncomeDate,
    currentSavingsCents,
    priceCents,
    weeklySavingsCents,
  ]);

  const priorityGoal = goals[0];
  const hasPrice = priceCents > 0;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.topBar}>
            <Pressable style={styles.backButton} onPress={() => router.back()}>
              <Ionicons name="chevron-back" size={22} color={Colors.text} />
            </Pressable>

            <View style={styles.topText}>
              <Text style={styles.title}>Can I afford it?</Text>
              <Text style={styles.subtitle}>
                See the impact before you spend.
              </Text>
            </View>
          </View>

          <View style={styles.formCard}>
            <Text style={styles.label}>What do you want to buy?</Text>
            <TextInput
              value={purchaseName}
              onChangeText={setPurchaseName}
              placeholder="e.g. AirPods"
              placeholderTextColor={Colors.textMuted}
              style={styles.textInput}
              maxLength={50}
            />

            <Text style={styles.label}>Price</Text>
            <View style={styles.amountWrap}>
              <Text style={styles.currency}>₱</Text>
              <TextInput
                value={price}
                onChangeText={(value) => setPrice(cleanMoney(value))}
                placeholder="0.00"
                placeholderTextColor={Colors.textMuted}
                keyboardType="decimal-pad"
                style={styles.amountInput}
                maxLength={12}
              />
            </View>

            <Text style={styles.label}>Your usual weekly savings</Text>
            <View style={styles.smallAmountWrap}>
              <Text style={styles.smallCurrency}>₱</Text>
              <TextInput
                value={weeklySavings}
                onChangeText={(value) => setWeeklySavings(cleanMoney(value))}
                placeholder="Optional"
                placeholderTextColor={Colors.textMuted}
                keyboardType="decimal-pad"
                style={styles.smallAmountInput}
                maxLength={12}
              />
              <Text style={styles.suffix}>/ week</Text>
            </View>

            <Text style={styles.helper}>
              This helps estimate how much a purchase could delay your savings progress.
            </Text>
          </View>

          {hasPrice ? (
            <>
              <AffordabilityStatusCard
                status={analysis.affordability.status}
              />

              <Text style={styles.sectionTitle}>After this purchase</Text>

              <View style={styles.impactCard}>
                <ImpactRow
                  label="Current safe to spend"
                  value={analysis.safeToSpendCents}
                />

                <View style={styles.divider} />

                <ImpactRow
                  label={purchaseName.trim() || 'Purchase'}
                  value={-priceCents}
                  danger
                />

                <View style={styles.dividerStrong} />

                <ImpactRow
                  label="Safe to spend after"
                  value={analysis.affordability.remainingSafeCents}
                  strong
                  danger={analysis.affordability.remainingSafeCents < 0}
                />
              </View>

              <View style={styles.dailyCard}>
                <View style={styles.dailyIcon}>
                  <Ionicons
                    name="calendar-outline"
                    size={21}
                    color={Colors.primary}
                  />
                </View>

                <View style={styles.dailyText}>
                  <Text style={styles.dailyLabel}>Daily safe-to-spend</Text>
                  <Text style={styles.dailyValue}>
                    {analysis.dailySafeAfter === null
                      ? 'Set your next income date first'
                      : `${formatCurrencyFromCents(analysis.dailySafeAfter)}/day`}
                  </Text>

                  {analysis.dailySafeBefore !== null ? (
                    <Text style={styles.dailyChange}>
                      Before purchase: {formatCurrencyFromCents(analysis.dailySafeBefore)}/day
                    </Text>
                  ) : null}
                </View>
              </View>

              <Text style={styles.sectionTitle}>Savings impact</Text>

              <View style={styles.goalImpactCard}>
                <View style={styles.goalImpactTop}>
                  <View style={styles.goalIcon}>
                    <Ionicons
                      name="flag-outline"
                      size={21}
                      color={Colors.primary}
                    />
                  </View>

                  <View style={styles.goalImpactText}>
                    <Text style={styles.goalImpactTitle}>
                      {priorityGoal
                        ? `Impact on ${priorityGoal.name}`
                        : 'Impact on your savings'}
                    </Text>
                    <Text style={styles.goalImpactMeta}>
                      {priorityGoal
                        ? `Current allocation: ${formatCurrencyFromCents(priorityGoal.allocatedCents)}`
                        : `Reserved savings: ${formatCurrencyFromCents(currentSavingsCents)}`}
                    </Text>
                  </View>
                </View>

                {analysis.delayWeeks !== null ? (
                  <View style={styles.delayBox}>
                    <Text style={styles.delayLabel}>
                      Approximate delay if you replace the purchase amount through weekly savings
                    </Text>
                    <Text style={styles.delayValue}>
                      {analysis.delayWeeks} {analysis.delayWeeks === 1 ? 'week' : 'weeks'}
                    </Text>
                  </View>
                ) : (
                  <Text style={styles.goalHint}>
                    Add your weekly savings amount above to estimate a possible delay.
                  </Text>
                )}
              </View>

              <View style={styles.detailsCard}>
                <DetailRow
                  icon="wallet-outline"
                  label="Available balance"
                  value={analysis.balanceCents}
                />
                <View style={styles.detailDivider} />
                <DetailRow
                  icon="lock-closed-outline"
                  label="Reserved savings"
                  value={currentSavingsCents}
                />
                <View style={styles.detailDivider} />
                <DetailRow
                  icon="calendar-outline"
                  label="Upcoming commitments"
                  value={analysis.commitmentCents}
                />
              </View>

              {analysis.affordability.purchaseUsesReservedSavings ? (
                <View style={styles.warningCard}>
                  <Ionicons
                    name="warning-outline"
                    size={20}
                    color={Colors.danger}
                  />
                  <Text style={styles.warningText}>
                    This purchase is larger than your safe-to-spend amount. If you make it anyway,
                    you may need to reduce savings, remove commitments, or record new income.
                  </Text>
                </View>
              ) : null}
            </>
          ) : (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Ionicons
                  name="bag-handle-outline"
                  size={26}
                  color={Colors.primary}
                />
              </View>

              <Text style={styles.emptyTitle}>Enter a purchase price</Text>
              <Text style={styles.emptyText}>
                SaveTrack will compare it against your real financial situation.
              </Text>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

type ImpactRowProps = {
  label: string;
  value: number;
  strong?: boolean;
  danger?: boolean;
};

function ImpactRow({
  label,
  value,
  strong = false,
  danger = false,
}: ImpactRowProps) {
  return (
    <View style={styles.impactRow}>
      <Text style={[styles.impactLabel, strong && styles.strong]}>
        {label}
      </Text>
      <Text
        style={[
          styles.impactValue,
          strong && styles.strong,
          danger && styles.dangerValue,
        ]}
      >
        {value < 0 ? '−' : ''}
        {formatCurrencyFromCents(Math.abs(value))}
      </Text>
    </View>
  );
}

type DetailRowProps = {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  value: number;
};

function DetailRow({ icon, label, value }: DetailRowProps) {
  return (
    <View style={styles.detailRow}>
      <View style={styles.detailIcon}>
        <Ionicons name={icon} size={18} color={Colors.primary} />
      </View>

      <Text style={styles.detailLabel}>{label}</Text>

      <Text style={styles.detailValue}>
        {formatCurrencyFromCents(value)}
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
  subtitle: { color: Colors.textSecondary, fontSize: 12, marginTop: 3 },
  formCard: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 22,
    padding: 18,
    marginBottom: 16,
  },
  label: {
    color: Colors.text,
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 8,
    marginTop: 15,
  },
  textInput: {
    minHeight: 50,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
    color: Colors.text,
    paddingHorizontal: 15,
    fontSize: 14,
  },
  amountWrap: {
    minHeight: 68,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
  },
  currency: {
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
  smallAmountWrap: {
    minHeight: 50,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
  },
  smallCurrency: {
    color: Colors.textSecondary,
    fontSize: 15,
    fontWeight: '700',
    marginRight: 5,
  },
  smallAmountInput: {
    flex: 1,
    color: Colors.text,
    fontSize: 14,
    fontWeight: '800',
  },
  suffix: {
    color: Colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
  },
  helper: {
    color: Colors.textMuted,
    fontSize: 10,
    lineHeight: 15,
    marginTop: 6,
  },
  sectionTitle: {
    color: Colors.text,
    fontSize: 17,
    fontWeight: '800',
    marginTop: 24,
    marginBottom: 11,
  },
  impactCard: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 20,
    padding: 16,
  },
  impactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 34,
  },
  impactLabel: {
    color: Colors.textSecondary,
    fontSize: 11,
  },
  impactValue: {
    color: Colors.text,
    fontSize: 12,
    fontWeight: '800',
  },
  strong: {
    color: Colors.text,
    fontSize: 13,
    fontWeight: '900',
  },
  dangerValue: {
    color: Colors.danger,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 5,
  },
  dividerStrong: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 7,
  },
  dailyCard: {
    backgroundColor: Colors.primarySoft,
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  dailyIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dailyText: {
    flex: 1,
    marginLeft: 11,
  },
  dailyLabel: {
    color: Colors.textSecondary,
    fontSize: 10,
  },
  dailyValue: {
    color: Colors.primaryDark,
    fontSize: 16,
    fontWeight: '800',
    marginTop: 2,
  },
  dailyChange: {
    color: Colors.textMuted,
    fontSize: 9,
    marginTop: 3,
  },
  goalImpactCard: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 20,
    padding: 17,
  },
  goalImpactTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  goalIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: Colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalImpactText: {
    flex: 1,
    marginLeft: 11,
  },
  goalImpactTitle: {
    color: Colors.text,
    fontSize: 13,
    fontWeight: '800',
  },
  goalImpactMeta: {
    color: Colors.textMuted,
    fontSize: 10,
    marginTop: 3,
  },
  delayBox: {
    marginTop: 15,
    backgroundColor: Colors.warningSoft,
    borderRadius: 15,
    padding: 13,
  },
  delayLabel: {
    color: Colors.textSecondary,
    fontSize: 10,
    lineHeight: 15,
  },
  delayValue: {
    color: Colors.warningDark,
    fontSize: 18,
    fontWeight: '800',
    marginTop: 4,
  },
  goalHint: {
    color: Colors.textSecondary,
    fontSize: 10,
    lineHeight: 15,
    marginTop: 14,
  },
  detailsCard: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 20,
    padding: 15,
    marginTop: 14,
  },
  detailRow: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: Colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailLabel: {
    flex: 1,
    color: Colors.textSecondary,
    fontSize: 11,
    marginLeft: 10,
  },
  detailValue: {
    color: Colors.text,
    fontSize: 12,
    fontWeight: '800',
  },
  detailDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginLeft: 44,
  },
  warningCard: {
    backgroundColor: Colors.dangerSoft,
    borderRadius: 17,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
    marginTop: 14,
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
    borderRadius: 22,
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
  emptyTitle: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  emptyText: {
    color: Colors.textSecondary,
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 17,
    marginTop: 5,
  },
});
