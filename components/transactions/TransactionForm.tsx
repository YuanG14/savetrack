import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
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

import { transactionCategories } from '../../constants/categories';
import { Colors } from '../../constants/theme';
import type {
  Transaction,
  TransactionInput,
  TransactionType,
} from '../../types/transaction';
import { getTodayDateString, isValidDateString } from '../../utils/date';

type TransactionFormProps = {
  title: string;
  subtitle: string;
  submitLabel: string;
  initialValue?: Transaction;
  onSubmit: (input: TransactionInput) => Promise<void>;
  onDelete?: () => void;
};

export function TransactionForm({
  title,
  subtitle,
  submitLabel,
  initialValue,
  onSubmit,
  onDelete,
}: TransactionFormProps) {
  const router = useRouter();

  const initialAmount = useMemo(() => {
    if (!initialValue) return '';
    return (initialValue.amountCents / 100).toFixed(2);
  }, [initialValue]);

  const [type, setType] = useState<TransactionType>(
    initialValue?.type ?? 'expense'
  );
  const [amount, setAmount] = useState(initialAmount);
  const [category, setCategory] = useState(
    initialValue?.category ?? 'Food'
  );
  const [note, setNote] = useState(initialValue?.note ?? '');
  const [transactionDate, setTransactionDate] = useState(
    initialValue?.transactionDate ?? getTodayDateString()
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!initialValue) return;

    setType(initialValue.type);
    setAmount((initialValue.amountCents / 100).toFixed(2));
    setCategory(initialValue.category);
    setNote(initialValue.note ?? '');
    setTransactionDate(initialValue.transactionDate);
  }, [initialValue]);

  const availableCategories = useMemo(
    () => transactionCategories.filter((item) => item.types.includes(type)),
    [type]
  );

  useEffect(() => {
    const stillAvailable = availableCategories.some(
      (item) => item.name === category
    );

    if (!stillAvailable && availableCategories[0]) {
      setCategory(availableCategories[0].name);
    }
  }, [availableCategories, category]);

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

    if (!isValidDateString(transactionDate)) {
      Alert.alert(
        'Check the date',
        'Use a valid date in YYYY-MM-DD format, for example 2026-08-20.'
      );
      return;
    }

    if (!category.trim()) {
      Alert.alert('Choose a category', 'Select a category before saving.');
      return;
    }

    const amountCents = Math.round(numericAmount * 100);

    setSaving(true);
    try {
      await onSubmit({
        type,
        amountCents,
        category: category.trim(),
        note: note.trim(),
        transactionDate,
      });
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
          <Pressable
            style={styles.backButton}
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons name="chevron-back" size={22} color={Colors.text} />
          </Pressable>

          <View style={styles.topText}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.label}>Type</Text>

          <View style={styles.segment}>
            <Pressable
              style={[
                styles.segmentButton,
                type === 'expense' && styles.expenseSegmentActive,
              ]}
              onPress={() => setType('expense')}
            >
              <Ionicons
                name="arrow-up"
                size={17}
                color={type === 'expense' ? Colors.danger : Colors.textSecondary}
              />
              <Text
                style={[
                  styles.segmentText,
                  type === 'expense' && styles.expenseSegmentTextActive,
                ]}
              >
                Expense
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.segmentButton,
                type === 'income' && styles.incomeSegmentActive,
              ]}
              onPress={() => setType('income')}
            >
              <Ionicons
                name="arrow-down"
                size={17}
                color={type === 'income' ? Colors.success : Colors.textSecondary}
              />
              <Text
                style={[
                  styles.segmentText,
                  type === 'income' && styles.incomeSegmentTextActive,
                ]}
              >
                Income
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

          <Text style={styles.label}>Category</Text>

          <View style={styles.categoryGrid}>
            {availableCategories.map((item) => {
              const active = category === item.name;

              return (
                <Pressable
                  key={item.name}
                  onPress={() => setCategory(item.name)}
                  style={[
                    styles.categoryButton,
                    active && styles.categoryButtonActive,
                  ]}
                >
                  <Ionicons
                    name={item.icon}
                    size={18}
                    color={active ? Colors.primary : Colors.textSecondary}
                  />
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.categoryText,
                      active && styles.categoryTextActive,
                    ]}
                  >
                    {item.name}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.label}>Description</Text>
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder="e.g. Lunch with friends"
            placeholderTextColor="#94A3B8"
            style={styles.textInput}
            maxLength={80}
          />

          <View style={styles.labelRow}>
            <Text style={styles.label}>Date</Text>
            <Pressable onPress={() => setTransactionDate(getTodayDateString())}>
              <Text style={styles.todayAction}>Use today</Text>
            </Pressable>
          </View>

          <TextInput
            value={transactionDate}
            onChangeText={setTransactionDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#94A3B8"
            style={styles.textInput}
            maxLength={10}
            autoCapitalize="none"
          />

          <Text style={styles.dateHint}>
            Use YYYY-MM-DD, for example 2026-08-20.
          </Text>

          <Pressable
            style={[styles.submitButton, saving && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="checkmark-circle-outline" size={19} color="#FFFFFF" />
                <Text style={styles.submitButtonText}>{submitLabel}</Text>
              </>
            )}
          </Pressable>

          {onDelete ? (
            <Pressable style={styles.deleteButton} onPress={onDelete}>
              <Ionicons name="trash-outline" size={18} color={Colors.danger} />
              <Text style={styles.deleteButtonText}>Delete transaction</Text>
            </Pressable>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
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
  topText: {
    flex: 1,
    marginLeft: 14,
  },
  title: {
    color: Colors.text,
    fontSize: 22,
    fontWeight: '800',
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: 12,
    marginTop: 3,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 36,
  },
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
  expenseSegmentActive: {
    backgroundColor: Colors.dangerSoft,
  },
  incomeSegmentActive: {
    backgroundColor: Colors.successSoft,
  },
  segmentText: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '800',
  },
  expenseSegmentTextActive: {
    color: Colors.danger,
  },
  incomeSegmentTextActive: {
    color: Colors.success,
  },
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
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryButton: {
    minWidth: '30%',
    flexGrow: 1,
    maxWidth: '48.8%',
    minHeight: 48,
    borderRadius: 15,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryButtonActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primarySoft,
  },
  categoryText: {
    flexShrink: 1,
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  categoryTextActive: {
    color: Colors.primary,
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
  dateHint: {
    color: Colors.textMuted,
    fontSize: 11,
    marginTop: 7,
  },
  submitButton: {
    minHeight: 54,
    borderRadius: 17,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    marginTop: 26,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  deleteButton: {
    minHeight: 52,
    borderRadius: 17,
    backgroundColor: Colors.dangerSoft,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  deleteButtonText: {
    color: Colors.danger,
    fontSize: 13,
    fontWeight: '800',
  },
});
