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

import { SavingsRow } from '../components/savings/SavingsRow';
import { Colors } from '../constants/theme';
import { useSavings } from '../contexts/SavingsContext';
import { useTransactions } from '../contexts/TransactionContext';
import { formatCurrencyFromCents } from '../utils/currency';
import { getCurrentMonthKey } from '../utils/date';

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
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
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
            <Text style={styles.title}>Savings pool</Text>
            <Text style={styles.subtitle}>
              Manage the money you have intentionally reserved.
            </Text>
          </View>
        </View>

        <View style={styles.heroCard}>
          <Text style={styles.heroLabel}>Reserved savings</Text>
          <Text style={styles.heroValue}>
            {formatCurrencyFromCents(currentSavingsCents)}
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
              <Text style={styles.secondaryActionText}>Withdraw</Text>
            </Pressable>
          </View>
        </View>

        <Text style={styles.sectionTitle}>This month</Text>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Net saved</Text>
            <Text style={styles.statValue}>
              {formatCurrencyFromCents(metrics.netSavedCents)}
            </Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Savings rate</Text>
            <Text style={styles.statValue}>{metrics.savingsRate}%</Text>
          </View>
        </View>

        <View style={styles.targetCard}>
          <Text style={styles.targetTitle}>Monthly savings target</Text>
          <Text style={styles.targetMeta}>
            {monthlyTargetCents > 0
              ? `${formatCurrencyFromCents(metrics.netSavedCents)} of ${formatCurrencyFromCents(monthlyTargetCents)}`
              : 'Set a monthly target.'}
          </Text>

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
            <Text style={styles.flowLabel}>Deposited</Text>
            <Text style={styles.flowValue}>
              {formatCurrencyFromCents(metrics.depositsCents)}
            </Text>
          </View>
          <View style={styles.flowDivider} />
          <View style={styles.flowItem}>
            <Text style={styles.flowLabel}>Withdrawn</Text>
            <Text style={styles.flowValue}>
              {formatCurrencyFromCents(metrics.withdrawalsCents)}
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Savings history</Text>

        {loading ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator color={Colors.primary} />
          </View>
        ) : entries.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No savings activity yet</Text>
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
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  content: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 36 },
  topBar: { flexDirection: 'row', alignItems: 'center', marginBottom: 18 },
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
  heroCard: {
    backgroundColor: Colors.primary,
    borderRadius: 24,
    padding: 21,
    marginBottom: 27,
  },
  heroLabel: { color: '#DBEAFE', fontSize: 12, fontWeight: '700' },
  heroValue: { color: '#FFFFFF', fontSize: 34, fontWeight: '800', marginTop: 6 },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 19 },
  primaryAction: {
    flex: 1,
    minHeight: 46,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryActionText: { color: Colors.primary, fontSize: 12, fontWeight: '800' },
  secondaryAction: {
    flex: 1,
    minHeight: 46,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryActionText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
  sectionTitle: {
    color: Colors.text,
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 12,
  },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 14 },
  statCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 18,
    padding: 16,
  },
  statLabel: { color: Colors.textSecondary, fontSize: 11, marginBottom: 5 },
  statValue: { color: Colors.text, fontSize: 17, fontWeight: '800' },
  targetCard: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 20,
    padding: 17,
    marginBottom: 14,
  },
  targetTitle: { color: Colors.text, fontSize: 14, fontWeight: '800' },
  targetMeta: { color: Colors.textSecondary, fontSize: 11, marginTop: 4 },
  progressTrack: {
    height: 8,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: '#E2E8F0',
    marginTop: 14,
  },
  progressFill: { height: '100%', backgroundColor: Colors.primary },
  targetInputRow: { flexDirection: 'row', gap: 10, marginTop: 15 },
  targetInputWrap: {
    flex: 1,
    minHeight: 46,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  currencySymbol: { color: Colors.textSecondary, marginRight: 4 },
  targetInput: { flex: 1, color: Colors.text, fontWeight: '700' },
  saveTargetButton: {
    minWidth: 70,
    borderRadius: 13,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveTargetText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
  flowCard: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 18,
    padding: 16,
    marginBottom: 27,
  },
  flowItem: { flex: 1 },
  flowDivider: { width: 1, backgroundColor: Colors.border, marginHorizontal: 14 },
  flowLabel: { color: Colors.textSecondary, fontSize: 10 },
  flowValue: { color: Colors.text, fontSize: 13, fontWeight: '800', marginTop: 3 },
  loadingCard: { padding: 28, alignItems: 'center' },
  emptyState: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 18,
    padding: 25,
    alignItems: 'center',
  },
  emptyTitle: { color: Colors.textSecondary, fontSize: 12 },
  historyCard: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 20,
    overflow: 'hidden',
  },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginLeft: 68 },
});
