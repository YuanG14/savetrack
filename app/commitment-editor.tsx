import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
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

import { Colors } from '../constants/theme';
import { useSafeSpend } from '../contexts/SafeSpendContext';
import type { CommitmentInput } from '../types/safe-spend';
import { getTodayDateString, isValidDateString } from '../utils/date';

const categories = ['Bills', 'School', 'Transport', 'Food', 'Health', 'Other'];

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

export default function CommitmentEditorScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const {
    commitments,
    addCommitment,
    updateCommitment,
    deleteCommitment,
  } = useSafeSpend();

  const id = params.id ? Number(params.id) : null;

  const existing = useMemo(
    () =>
      id && Number.isFinite(id)
        ? commitments.find((item) => item.id === id)
        : undefined,
    [commitments, id]
  );

  const [name, setName] = useState(existing?.name ?? '');
  const [amount, setAmount] = useState(
    existing ? (existing.amountCents / 100).toFixed(2) : ''
  );
  const [dueDate, setDueDate] = useState(
    existing?.dueDate ?? getTodayDateString()
  );
  const [category, setCategory] = useState(existing?.category ?? 'Bills');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!existing) return;

    setName(existing.name);
    setAmount((existing.amountCents / 100).toFixed(2));
    setDueDate(existing.dueDate);
    setCategory(existing.category);
  }, [existing]);

  const handleSubmit = async () => {
    const cleanName = name.trim();
    const numericAmount = Number.parseFloat(amount);

    if (!cleanName) {
      Alert.alert('Name this commitment', 'Enter what the money is for.');
      return;
    }

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      Alert.alert('Check amount', 'Enter an amount greater than ₱0.');
      return;
    }

    if (!isValidDateString(dueDate)) {
      Alert.alert('Check due date', 'Use YYYY-MM-DD.');
      return;
    }

    const input: CommitmentInput = {
      name: cleanName,
      amountCents: Math.round(numericAmount * 100),
      dueDate,
      category,
    };

    setSaving(true);

    try {
      if (existing) {
        await updateCommitment(existing.id, input);
      } else {
        await addCommitment(input);
      }
      router.back();
    } catch (error) {
      console.error(error);
      Alert.alert('Could not save commitment', 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = () => {
    if (!existing) return;

    Alert.alert(
      'Delete commitment?',
      'It will no longer be reserved in your safe-to-spend calculation.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteCommitment(existing.id);
              router.back();
            } catch (error) {
              console.error(error);
              Alert.alert('Could not delete commitment', 'Please try again.');
            }
          },
        },
      ]
    );
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
            <Text style={styles.title}>
              {existing ? 'Edit commitment' : 'Add commitment'}
            </Text>
            <Text style={styles.subtitle}>
              Reserve money for something you know is coming.
            </Text>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.label}>Name</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="e.g. Internet bill"
            placeholderTextColor={Colors.textMuted}
            style={styles.textInput}
            maxLength={50}
          />

          <Text style={styles.label}>Amount</Text>
          <View style={styles.amountWrap}>
            <Text style={styles.currency}>₱</Text>
            <TextInput
              value={amount}
              onChangeText={(value) => setAmount(cleanMoney(value))}
              placeholder="0.00"
              placeholderTextColor={Colors.textMuted}
              keyboardType="decimal-pad"
              style={styles.amountInput}
              maxLength={12}
            />
          </View>

          <Text style={styles.label}>Due date</Text>
          <TextInput
            value={dueDate}
            onChangeText={setDueDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={Colors.textMuted}
            style={styles.textInput}
            maxLength={10}
            autoCapitalize="none"
          />

          <Text style={styles.label}>Category</Text>
          <View style={styles.categoryGrid}>
            {categories.map((item) => {
              const active = category === item;

              return (
                <Pressable
                  key={item}
                  onPress={() => setCategory(item)}
                  style={[
                    styles.categoryButton,
                    active && styles.categoryButtonActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.categoryText,
                      active && styles.categoryTextActive,
                    ]}
                  >
                    {item}
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
              This is a planned commitment, not an actual expense transaction.
              Record the expense normally when you really pay it.
            </Text>
          </View>

          <Pressable
            style={[styles.saveButton, saving && styles.disabled]}
            onPress={handleSubmit}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.saveText}>
                {existing ? 'Save changes' : 'Add commitment'}
              </Text>
            )}
          </Pressable>

          {existing ? (
            <Pressable style={styles.deleteButton} onPress={confirmDelete}>
              <Ionicons name="trash-outline" size={18} color={Colors.danger} />
              <Text style={styles.deleteText}>Delete commitment</Text>
            </Pressable>
          ) : null}
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
  amountWrap: {
    minHeight: 68,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
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
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryButton: {
    minWidth: '30%',
    flexGrow: 1,
    maxWidth: '48%',
    minHeight: 44,
    borderRadius: 13,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryButtonActive: {
    backgroundColor: Colors.primarySoft,
    borderColor: Colors.primary,
  },
  categoryText: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '800',
  },
  categoryTextActive: { color: Colors.primary },
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
  saveButton: {
    minHeight: 54,
    borderRadius: 17,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  disabled: { opacity: 0.7 },
  saveText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
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
  deleteText: { color: Colors.danger, fontSize: 13, fontWeight: '800' },
});
