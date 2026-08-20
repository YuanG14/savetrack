import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
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

import { SavingsRow } from '../../components/savings/SavingsRow';
import { Colors } from '../../constants/theme';
import { useSavings } from '../../contexts/SavingsContext';
import { useTransactions } from '../../contexts/TransactionContext';
import { formatCurrencyFromCents } from '../../utils/currency';
import { getCurrentMonthKey } from '../../utils/date';

export default function SavingsScreen() {
  const router = useRouter();
  const {
    entries,
    loading,
    currentSavingsCents,
    monthlyTargetCents,
    saveMonthlyTarget,
  } = useSavings();
  const { transactions } = useTransactions();

  const [targetInput, setTargetInput] = useState(
    monthlyTargetCents > 0 ? (monthlyTargetCents / 100).toFixed(2) : ''
  );
  const [savingTarget, setSavingTarget] = useState(false);

  const metrics = useMemo(() => {
    const monthKey = getCurrentMonthKey();

    const monthEntries = entries.filter((entry) =>
      entry.entryDate.startsWith(monthKey)
    );

    const depositsCents = monthEntries
      .filter((entry) => entry.type === 'deposit')
      .reduce((sum, entry) => sum + entry.amountCents, 0);

    const withdrawalsCents = monthEntries
      .filter((entry) => entry.type === 'withdrawal')
      .reduce((sum, entry) => sum + entry.amountCents, 0);

    const netSavedCents = depositsCents - withdrawalsCents;

    const monthIncomeCents = transactions
      .filter(
        (transaction) =>
          transaction.type === 'income' &&
          transaction.transactionDate.startsWith(monthKey)
      )
      .reduce((sum, transaction) => sum + transaction.amountCents, 0);

    const savingsRate =
      monthIncomeCents > 0
        ? Math.max(0, Math.round((netSavedCents / monthIncomeCents) * 100))
        : 0;

    const progress =
      monthlyTargetCents > 0
        ? Math.min(1, Math.max(0, netSavedCents / monthlyTargetCents))
        : 0;

    return {
      depositsCents,
      withdrawalsCents,
      netSavedCents,
      savingsRate,
      progress,
    };
  }, [entries, monthlyTargetCents, transactions]);

  const handleTargetChange = (value: string) => {
    const cleaned = value.replace(/[^\d.]/g, '');
    const firstDot = cleaned.indexOf('.');

    if (firstDot === -1) {
      setTargetInput(cleaned);
      return;
    }

    const whole = cleaned.slice(0, firstDot);
    const decimals = cleaned
      .slice(firstDot + 1)
      .replace(/\./g, '')
      .slice(0, 2);

    setTargetInput(`${whole}.${decimals}`);
  };

  const handleSaveTarget = async () => {
    const numericValue = targetInput.trim() === '' ? 0 : Number(targetInput);

    if (!Number.isFinite(numericValue) || numericValue < 0) {
      Alert.alert('Check target', 'Enter a valid amount of ₱0 or higher.');
      return;
    }

    setSavingTarget(true);
    try {
      await saveMonthlyTarget(Math.round(numericValue * 100));
      Alert.alert('Target updated', 'Your monthly savings target has been saved.');
    } catch (error) {
      console.error(error);
      Alert.alert('Could not save target', 'Please try again.');
    } finally {
      setSavingTarget(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>SAVINGS</Text>
            <Text style={styles.title}>Reserved money</Text>
            <Text style={styles.subtitle}>
              Set money aside without mixing it with what is safe to spend.
            </Text>
          </View>
        </View>

        <View style={styles.heroCard}>
          <View style={styles.heroTop}>
            <Text style={styles.heroLabel}>Reserved savings</Text>
            <View style={styles.lockIcon}>
              <Ionicons name="lock-closed-outline" size={19} color="#FFFFFF" />
            </View>
          </View>

          {loading ? (
            <ActivityIndicator
              color="#FFFFFF"
              style={{ alignSelf: 'flex-start', marginVertical: 18 }}
            />
          ) : (
            <Text style={styles.heroValue}>
              {formatCurrencyFromCents(currentSavingsCents)}
            </Text>
          )}

          <Text style={styles.heroDescription}>
            These funds stay visible in your balance, but SaveTrack treats them
            as reserved when calculating safe-to-spend.
          </Text>

          <View style={styles.actionRow}>
            <Pressable
              style={styles.primaryAction}
              onPress={() =>
                router.push({
                  pathname: '/savings-entry',
                  params: { type: 'deposit' },
                })
              }
            >
              <Ionicons name="add" size={19} color={Colors.primary} />
              <Text style={styles.primaryActionText}>Add savings</Text>
            </Pressable>

            <Pressable
              style={styles.secondaryAction}
              onPress={() =>
                router.push({
                  pathname: '/savings-entry',
                  params: { type: 'withdrawal' },
                })
              }
            >
              <Ionicons name="remove" size={19} color="#FFFFFF" />
              <Text style={styles.secondaryActionText}>Withdraw</Text>
            </Pressable>
          </View>
        </View>

        <Text style={styles.sectionTitle}>This month</Text>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Net saved</Text>
            <Text
              style={[
                styles.statValue,
                metrics.netSavedCents < 0 && styles.negativeValue,
              ]}
            >
              {formatCurrencyFromCents(metrics.netSavedCents)}
            </Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Savings rate</Text>
            <Text style={styles.statValue}>{metrics.savingsRate}%</Text>
          </View>
        </View>

        <View style={styles.targetCard}>
          <View style={styles.targetHeader}>
            <View>
              <Text style={styles.targetTitle}>Monthly savings target</Text>
              <Text style={styles.targetMeta}>
                {monthlyTargetCents > 0
                  ? `${formatCurrencyFromCents(metrics.netSavedCents)} of ${formatCurrencyFromCents(monthlyTargetCents)}`
                  : 'Set a target to track your monthly progress.'}
              </Text>
            </View>

            {monthlyTargetCents > 0 ? (
              <Text style={styles.targetPercent}>
                {Math.round(metrics.progress * 100)}%
              </Text>
            ) : null}
          </View>

          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                { width: `${Math.round(metrics.progress * 100)}%` },
              ]}
            />
          </View>

          <View style={styles.targetInputRow}>
            <View style={styles.targetInputWrap}>
              <Text style={styles.currencySymbol}>₱</Text>
              <TextInput
                value={targetInput}
                onChangeText={handleTargetChange}
                placeholder="0.00"
                placeholderTextColor={Colors.textMuted}
                keyboardType="decimal-pad"
                style={styles.targetInput}
              />
            </View>

            <Pressable
              style={styles.saveTargetButton}
              onPress={handleSaveTarget}
              disabled={savingTarget}
            >
              {savingTarget ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.saveTargetText}>Save</Text>
              )}
            </Pressable>
          </View>
        </View>

        <View style={styles.flowCard}>
          <View style={styles.flowItem}>
            <View style={[styles.flowIcon, styles.depositIcon]}>
              <Ionicons name="arrow-down" size={18} color={Colors.success} />
            </View>
            <View>
              <Text style={styles.flowLabel}>Deposited</Text>
              <Text style={styles.flowValue}>
                {formatCurrencyFromCents(metrics.depositsCents)}
              </Text>
            </View>
          </View>

          <View style={styles.flowDivider} />

          <View style={styles.flowItem}>
            <View style={[styles.flowIcon, styles.withdrawIcon]}>
              <Ionicons name="arrow-up" size={18} color={Colors.warning} />
            </View>
            <View>
              <Text style={styles.flowLabel}>Withdrawn</Text>
              <Text style={styles.flowValue}>
                {formatCurrencyFromCents(metrics.withdrawalsCents)}
              </Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Savings history</Text>

        {loading ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator color={Colors.primary} />
          </View>
        ) : entries.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons name="wallet-outline" size={26} color={Colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>No savings activity yet</Text>
            <Text style={styles.emptyText}>
              Add your first savings deposit to start building your reserved balance.
            </Text>
          </View>
        ) : (
          <View style={styles.historyCard}>
            {entries.map((entry, index) => (
              <View key={entry.id}>
                <SavingsRow entry={entry} />
                {index < entries.length - 1 ? <View style={styles.divider} /> : null}
              </View>
            ))}
          </View>
        )}

        <View style={styles.phaseNote}>
          <Ionicons name="flag-outline" size={18} color={Colors.primary} />
          <Text style={styles.phaseNoteText}>
            Individual named goals like “New Phone” and “Japan Trip” arrive in Phase 4.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
  title: { color: Colors.text, fontSize: 29, fontWeight: '800' },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 6,
    maxWidth: 330,
  },
  heroCard: {
    backgroundColor: Colors.primary,
    borderRadius: 26,
    padding: 22,
    marginBottom: 28,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroLabel: { color: '#DBEAFE', fontSize: 13, fontWeight: '700' },
  lockIcon: {
    width: 36,
    height: 36,
    borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroValue: {
    color: '#FFFFFF',
    fontSize: 36,
    fontWeight: '800',
    marginTop: 7,
  },
  heroDescription: {
    color: '#BFDBFE',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 8,
  },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 20 },
  primaryAction: {
    flex: 1,
    minHeight: 48,
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  primaryActionText: { color: Colors.primary, fontSize: 12, fontWeight: '800' },
  secondaryAction: {
    flex: 1,
    minHeight: 48,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  secondaryActionText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
  sectionTitle: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 13,
  },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 14 },
  statCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 19,
    padding: 17,
  },
  statLabel: { color: Colors.textSecondary, fontSize: 11, marginBottom: 6 },
  statValue: { color: Colors.text, fontSize: 18, fontWeight: '800' },
  negativeValue: { color: Colors.danger },
  targetCard: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 22,
    padding: 18,
    marginBottom: 14,
  },
  targetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  targetTitle: { color: Colors.text, fontSize: 14, fontWeight: '800' },
  targetMeta: {
    color: Colors.textSecondary,
    fontSize: 11,
    marginTop: 4,
    lineHeight: 16,
  },
  targetPercent: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '800',
  },
  progressTrack: {
    height: 8,
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
  targetInputRow: { flexDirection: 'row', gap: 10, marginTop: 16 },
  targetInputWrap: {
    flex: 1,
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13,
  },
  currencySymbol: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '700',
    marginRight: 5,
  },
  targetInput: { flex: 1, color: Colors.text, fontSize: 14, fontWeight: '700' },
  saveTargetButton: {
    minWidth: 72,
    minHeight: 48,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveTargetText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
  flowCard: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 20,
    padding: 16,
    marginBottom: 28,
    flexDirection: 'row',
    alignItems: 'center',
  },
  flowItem: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  flowIcon: {
    width: 38,
    height: 38,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  depositIcon: { backgroundColor: Colors.successSoft },
  withdrawIcon: { backgroundColor: Colors.warningSoft },
  flowLabel: { color: Colors.textSecondary, fontSize: 10 },
  flowValue: { color: Colors.text, fontSize: 13, fontWeight: '800', marginTop: 2 },
  flowDivider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.border,
    marginHorizontal: 10,
  },
  loadingCard: {
    padding: 28,
    backgroundColor: Colors.surface,
    borderRadius: 20,
    alignItems: 'center',
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
  emptyTitle: { color: Colors.text, fontSize: 16, fontWeight: '800' },
  emptyText: {
    color: Colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 6,
  },
  historyCard: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 22,
    overflow: 'hidden',
  },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginLeft: 68 },
  phaseNote: {
    flexDirection: 'row',
    gap: 9,
    alignItems: 'flex-start',
    backgroundColor: Colors.primarySoft,
    borderRadius: 16,
    padding: 14,
    marginTop: 16,
  },
  phaseNoteText: {
    flex: 1,
    color: Colors.textSecondary,
    fontSize: 11,
    lineHeight: 17,
  },
});
