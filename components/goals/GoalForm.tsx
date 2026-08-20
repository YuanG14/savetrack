import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
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

import { Colors } from '../../constants/theme';
import type {
  GoalInput,
  GoalPriority,
  SavingsGoal,
} from '../../types/goal';
import { getTodayDateString } from '../../utils/date';

function dateStringToLocalDate(value?: string | null) {
  if (!value) return null;

  const [year, month, day] = value.split('-').map(Number);

  if (!year || !month || !day) {
    return null;
  }

  return new Date(year, month - 1, day);
}

function localDateToDateString(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function formatDisplayDate(date: Date) {
  return new Intl.DateTimeFormat('en-PH', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

const emojis = ['🎯', '📱', '🚗', '✈️', '💻', '🏠', '🎓', '💰'];
const priorities: GoalPriority[] = ['high', 'medium', 'low'];

type Props = {
  title: string;
  subtitle: string;
  initialValue?: SavingsGoal;
  submitLabel: string;
  onSubmit: (input: GoalInput) => Promise<void>;
};

export function GoalForm({
  title,
  subtitle,
  initialValue,
  submitLabel,
  onSubmit,
}: Props) {
  const router = useRouter();
  const [name, setName] = useState(initialValue?.name ?? '');
  const [amount, setAmount] = useState(
    initialValue ? (initialValue.targetAmountCents / 100).toFixed(2) : ''
  );
  const [targetDate, setTargetDate] = useState<Date | null>(() =>
    dateStringToLocalDate(initialValue?.targetDate)
  );
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [priority, setPriority] = useState<GoalPriority>(
    initialValue?.priority ?? 'medium'
  );
  const [emoji, setEmoji] = useState(initialValue?.emoji ?? '🎯');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!initialValue) return;
    setName(initialValue.name);
    setAmount((initialValue.targetAmountCents / 100).toFixed(2));
    setTargetDate(dateStringToLocalDate(initialValue.targetDate));
    setPriority(initialValue.priority);
    setEmoji(initialValue.emoji);
  }, [initialValue]);

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

  const handleDateChange = (
    event: DateTimePickerEvent,
    selectedDate?: Date
  ) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }

    if (event.type === 'dismissed' || !selectedDate) {
      return;
    }

    setTargetDate(selectedDate);
  };

  const openDatePicker = () => {
    if (!targetDate) {
      setTargetDate(dateStringToLocalDate(getTodayDateString()) ?? new Date());
    }

    setShowDatePicker(true);
  };

  const handleSubmit = async () => {
    const cleanName = name.trim();
    const numericAmount = Number.parseFloat(amount);

    if (!cleanName) {
      Alert.alert('Name your goal', 'Enter a name for what you are saving for.');
      return;
    }

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      Alert.alert('Check target amount', 'Enter an amount greater than ₱0.');
      return;
    }

    setSaving(true);
    try {
      await onSubmit({
        name: cleanName,
        targetAmountCents: Math.round(numericAmount * 100),
        targetDate: targetDate ? localDateToDateString(targetDate) : null,
        priority,
        emoji,
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
          <Pressable style={styles.backButton} onPress={() => router.back()}>
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
          <Text style={styles.label}>Goal icon</Text>

          <View style={styles.emojiGrid}>
            {emojis.map((item) => {
              const active = item === emoji;
              return (
                <Pressable
                  key={item}
                  onPress={() => setEmoji(item)}
                  style={[styles.emojiButton, active && styles.emojiButtonActive]}
                >
                  <Text style={styles.emoji}>{item}</Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.label}>Goal name</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="e.g. New Phone"
            placeholderTextColor={Colors.textMuted}
            style={styles.textInput}
            maxLength={40}
          />

          <Text style={styles.label}>Target amount</Text>
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

          <View style={styles.dateLabelRow}>
            <Text style={styles.label}>Target date</Text>

            {targetDate ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Clear target date"
                onPress={() => {
                  setTargetDate(null);
                  setShowDatePicker(false);
                }}
              >
                <Text style={styles.clearDateAction}>Clear</Text>
              </Pressable>
            ) : null}
          </View>

          <Pressable
            style={styles.dateSelector}
            onPress={openDatePicker}
            accessibilityRole="button"
            accessibilityLabel={
              targetDate
                ? `Target date, ${formatDisplayDate(targetDate)}. Tap to change.`
                : 'Select goal target date'
            }
          >
            <View style={styles.dateIcon}>
              <Ionicons
                name="calendar-outline"
                size={20}
                color={Colors.primary}
              />
            </View>

            <View style={styles.dateTextWrap}>
              <Text
                style={[
                  styles.dateValue,
                  !targetDate && styles.datePlaceholder,
                ]}
              >
                {targetDate
                  ? formatDisplayDate(targetDate)
                  : 'Optional target date'}
              </Text>
              <Text style={styles.dateHint}>
                Tap to select month, day, and year
              </Text>
            </View>

            <Ionicons
              name="chevron-down"
              size={18}
              color={Colors.textMuted}
            />
          </Pressable>

          {showDatePicker && targetDate ? (
            <View style={styles.pickerCard}>
              <DateTimePicker
                value={targetDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleDateChange}
                minimumDate={new Date()}
                themeVariant={Platform.OS === 'ios' ? 'light' : undefined}
                textColor={Platform.OS === 'ios' ? Colors.text : undefined}
                accentColor={Colors.primary}
                style={styles.datePicker}
              />

              {Platform.OS === 'ios' ? (
                <Pressable
                  style={styles.doneButton}
                  onPress={() => setShowDatePicker(false)}
                >
                  <Text style={styles.doneButtonText}>Done</Text>
                </Pressable>
              ) : null}
            </View>
          ) : null}

          <Text style={styles.label}>Priority</Text>
          <View style={styles.priorityRow}>
            {priorities.map((item) => {
              const active = item === priority;
              return (
                <Pressable
                  key={item}
                  style={[
                    styles.priorityButton,
                    active && styles.priorityButtonActive,
                  ]}
                  onPress={() => setPriority(item)}
                >
                  <Text
                    style={[
                      styles.priorityText,
                      active && styles.priorityTextActive,
                    ]}
                  >
                    {item[0].toUpperCase()}
                    {item.slice(1)}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.infoCard}>
            <Ionicons
              name="information-circle-outline"
              size={19}
              color={Colors.primary}
            />
            <Text style={styles.infoText}>
              Creating a goal does not move money yet. You will allocate part of your reserved savings from the goal screen.
            </Text>
          </View>

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
                <Text style={styles.submitText}>{submitLabel}</Text>
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
  emojiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 },
  emojiButton: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiButtonActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primarySoft,
  },
  emoji: { fontSize: 24 },
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
  amountInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 18,
    paddingHorizontal: 17,
    minHeight: 72,
  },
  currencySymbol: {
    color: Colors.textSecondary,
    fontSize: 26,
    fontWeight: '700',
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    color: Colors.text,
    fontSize: 29,
    fontWeight: '800',
    paddingVertical: 0,
  },
  dateLabelRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  clearDateAction: {
    color: Colors.primary,
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 7,
    marginTop: 18,
  },
  dateSelector: {
    minHeight: 68,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: Colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateTextWrap: {
    flex: 1,
    marginLeft: 11,
  },
  dateValue: {
    color: Colors.text,
    fontSize: 13,
    fontWeight: '800',
  },
  datePlaceholder: {
    color: Colors.textMuted,
  },
  dateHint: {
    color: Colors.textMuted,
    fontSize: 9,
    marginTop: 3,
  },
  pickerCard: {
    marginTop: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    paddingTop: Platform.OS === 'ios' ? 6 : 0,
    paddingBottom: Platform.OS === 'ios' ? 10 : 0,
  },
  datePicker: {
    width: '100%',
    height: Platform.OS === 'ios' ? 190 : undefined,
    backgroundColor: '#FFFFFF',
  },
  doneButton: {
    alignSelf: 'flex-end',
    minHeight: 40,
    paddingHorizontal: 18,
    borderRadius: 12,
    backgroundColor: Colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 12,
  },
  doneButtonText: {
    color: Colors.primary,
    fontSize: 11,
    fontWeight: '800',
  },
  priorityRow: { flexDirection: 'row', gap: 8 },
  priorityButton: {
    flex: 1,
    minHeight: 45,
    borderRadius: 14,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  priorityButtonActive: {
    backgroundColor: Colors.primarySoft,
    borderColor: Colors.primary,
  },
  priorityText: { color: Colors.textSecondary, fontSize: 12, fontWeight: '800' },
  priorityTextActive: { color: Colors.primary },
  infoCard: {
    marginTop: 20,
    backgroundColor: Colors.primarySoft,
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
