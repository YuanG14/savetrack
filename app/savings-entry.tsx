import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
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

import { Colors } from '../constants/theme';
import { useSavings } from '../contexts/SavingsContext';
import type { SavingsEntryType } from '../types/savings';
import { formatCurrencyFromCents } from '../utils/currency';
import { getTodayDateString, isValidDateString } from '../utils/date';

export default function SavingsEntryScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ type?: string }>();
  const { currentSavingsCents, addSavingsEntry } = useSavings();

  const initialType: SavingsEntryType =
    params.type === 'withdrawal' ? 'withdrawal' : 'deposit';

  const [type, setType] = useState<SavingsEntryType>(initialType);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [entryDate, setEntryDate] = useState(getTodayDateString());
  const [saving, setSaving] = useState(false);

  const heading = useMemo(
    () => (type === 'deposit' ? 'Add savings' : 'Withdraw savings'),
    [type]
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

  const handleSubmit = async () => {
    const numericAmount = Number.parseFloat(amount);

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      Alert.alert('Enter an amount', 'The amount must be greater than ₱0.');
      return;
    }

    if (!isValidDateString(entryDate)) {
      Alert.alert(
        'Check the date',
        'Use a valid date in YYYY-MM-DD format, for example 2026-08-20.'
      );
      return;
    }

    const amountCents = Math.round(numericAmount * 100);

    if (type === 'withdrawal' && amountCents > currentSavingsCents) {
      Alert.alert(
        'Not enough reserved savings',
        `You currently have ${formatCurrencyFromCents(currentSavingsCents)} reserved.`
      );
      return;
    }

    setSaving(true);
    try {
      await addSavingsEntry({
        type,
        amountCents,
        note: note.trim(),
        entryDate,
      });
      router.back();
    } catch (error) {
      console.error(error);
      Alert.alert('Could not save', 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.topBar}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={22} color={Colors.text} />
          </Pressable>

          <View style={styles.topText}>
            <Text style={styles.title}>{heading}</Text>
            <Text style={styles.subtitle}>
              Current reserved: {formatCurrencyFromCents(currentSavingsCents)}
            </Text>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.label}>Action</Text>

          <View style={styles.segment}>
            <Pressable
              style={[
                styles.segmentButton,
                type === 'deposit' && styles.depositActive,
              ]}
              onPress={() => setType('deposit')}
            >
              <Ionicons
                name="add-circle-outline"
                size={18}
                color={type === 'deposit' ? Colors.success : Colors.textSecondary}
              />
              <Text
                style={[
                  styles.segmentText,
                  type === 'deposit' && styles.depositTextActive,
                ]}
              >
                Add savings
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.segmentButton,
                type === 'withdrawal' && styles.withdrawActive,
              ]}
              onPress={() => setType('withdrawal')}
            >
              <Ionicons
                name="remove-circle-outline"
                size={18}
                color={type === 'withdrawal' ? Colors.warning : Colors.textSecondary}
              />
              <Text
                style={[
                  styles.segmentText,
                  type === 'withdrawal' && styles.withdrawTextActive,
                ]}
              >
                Withdraw
              </Text>
            </Pressable>
          </View>

          <Text style={styles.label}>Amount</Text>

          <View style={styles.amountInputWrap}>
            <Text style={styles.currencySymbol}>₱</Text>
            <TextInput
              value={amount}
              onChangeText={handleAmountChange}
              placeholder="0.00"
              placeholderTextColor="#CBD5E1"
              keyboardType="decimal-pad"
              style={styles.amountInput}
              maxLength={12}
            />
          </View>

          <Text style={styles.label}>Note</Text>
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder={
              type === 'deposit'
                ? 'e.g. Weekly savings'
                : 'e.g. Emergency expense'
            }
            placeholderTextColor={Colors.textMuted}
            style={styles.textInput}
            maxLength={80}
          />

          <View style={styles.labelRow}>
            <Text style={styles.label}>Date</Text>
            <Pressable onPress={() => setEntryDate(getTodayDateString())}>
              <Text style={styles.todayAction}>Use today</Text>
            </Pressable>
          </View>

          <TextInput
            value={entryDate}
            onChangeText={setEntryDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={Colors.textMuted}
            style={styles.textInput}
            maxLength={10}
            autoCapitalize="none"
          />

          {type === 'withdrawal' ? (
            <View style={styles.infoCard}>
              <Ionicons name="information-circle-outline" size={19} color={Colors.warning} />
              <Text style={styles.infoText}>
                Withdrawals only move money out of your reserved savings pool. They
                do not create an expense transaction automatically.
              </Text>
            </View>
          ) : (
            <View style={styles.infoCard}>
              <Ionicons name="information-circle-outline" size={19} color={Colors.primary} />
              <Text style={styles.infoText}>
                Adding savings reserves part of your existing balance. It does not
                count as a new income transaction.
              </Text>
            </View>
          )}

          <Pressable
            style={[styles.submitButton, saving && styles.disabled]}
            onPress={handleSubmit}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="checkmark-circle-outline" size={19} color="#FFFFFF" />
                <Text style={styles.submitText}>
                  {type === 'deposit' ? 'Add to savings' : 'Withdraw savings'}
                </Text>
              </>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safeArea: { flex: 1, backgroundColor: Colors.background },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 14,
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
  content: { paddingHorizontal: 20, paddingBottom: 34 },
  label: {
    color: Colors.text,
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 9,
    marginTop: 18,
  },
  segment: {
    flexDirection: 'row',
    padding: 4,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 17,
    gap: 4,
  },
  segmentButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  depositActive: { backgroundColor: Colors.successSoft },
  withdrawActive: { backgroundColor: Colors.warningSoft },
  segmentText: { color: Colors.textSecondary, fontSize: 12, fontWeight: '800' },
  depositTextActive: { color: Colors.success },
  withdrawTextActive: { color: Colors.warning },
  amountInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 18,
    paddingHorizontal: 17,
    minHeight: 74,
  },
  currencySymbol: {
    color: Colors.textSecondary,
    fontSize: 27,
    fontWeight: '700',
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    color: Colors.text,
    fontSize: 31,
    fontWeight: '800',
    paddingVertical: 0,
  },
  textInput: {
    minHeight: 52,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    color: Colors.text,
    fontSize: 14,
    paddingHorizontal: 16,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  todayAction: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 9,
    marginTop: 18,
  },
  infoCard: {
    marginTop: 18,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    gap: 9,
    alignItems: 'flex-start',
  },
  infoText: {
    flex: 1,
    color: Colors.textSecondary,
    fontSize: 11,
    lineHeight: 17,
  },
  submitButton: {
    minHeight: 54,
    borderRadius: 17,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    marginTop: 24,
  },
  disabled: { opacity: 0.7 },
  submitText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
});
