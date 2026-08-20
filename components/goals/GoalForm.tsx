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
import { isValidDateString } from '../../utils/date';

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
  const [targetDate, setTargetDate] = useState(initialValue?.targetDate ?? '');
  const [priority, setPriority] = useState<GoalPriority>(
    initialValue?.priority ?? 'medium'
  );
  const [emoji, setEmoji] = useState(initialValue?.emoji ?? '🎯');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!initialValue) return;
    setName(initialValue.name);
    setAmount((initialValue.targetAmountCents / 100).toFixed(2));
    setTargetDate(initialValue.targetDate ?? '');
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

    if (targetDate && !isValidDateString(targetDate)) {
      Alert.alert(
        'Check target date',
        'Use YYYY-MM-DD, or leave the target date empty.'
      );
      return;
    }

    setSaving(true);
    try {
      await onSubmit({
        name: cleanName,
        targetAmountCents: Math.round(numericAmount * 100),
        targetDate: targetDate || null,
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

          <Text style={styles.label}>Target date</Text>
          <TextInput
            value={targetDate}
            onChangeText={setTargetDate}
            placeholder="Optional · YYYY-MM-DD"
            placeholderTextColor={Colors.textMuted}
            style={styles.textInput}
            maxLength={10}
            autoCapitalize="none"
          />

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
