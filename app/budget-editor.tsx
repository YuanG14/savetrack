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

import { transactionCategories } from '../constants/categories';
import { Colors } from '../constants/theme';
import { useBudgets } from '../contexts/BudgetContext';
import { useToast } from '../contexts/ToastContext';
import type { BudgetInput } from '../types/budget';

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

export default function BudgetEditorScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const {
    budgets,
    addBudget,
    updateBudget,
    deleteBudget,
  } = useBudgets();
  const { showToast } = useToast();

  const id = params.id ? Number(params.id) : null;

  const existing = useMemo(
    () =>
      id && Number.isFinite(id)
        ? budgets.find((budget) => budget.id === id)
        : undefined,
    [budgets, id]
  );

  const expenseCategories = transactionCategories.filter((category) =>
    category.types.includes('expense')
  );

  const [category, setCategory] = useState(
    existing?.category ?? expenseCategories[0]?.name ?? 'Food'
  );

  const [limit, setLimit] = useState(
    existing ? (existing.limitCents / 100).toFixed(2) : ''
  );

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!existing) return;

    setCategory(existing.category);
    setLimit((existing.limitCents / 100).toFixed(2));
  }, [existing]);

  const handleSubmit = async () => {
    const numericLimit = Number.parseFloat(limit);

    if (!Number.isFinite(numericLimit) || numericLimit <= 0) {
      Alert.alert('Check budget limit', 'Enter an amount greater than ₱0.');
      return;
    }

    const duplicate = budgets.find(
      (budget) =>
        budget.category === category &&
        budget.id !== existing?.id
    );

    if (duplicate) {
      Alert.alert(
        'Budget already exists',
        `You already have a monthly budget for ${category}. Edit that budget instead.`
      );
      return;
    }

    const input: BudgetInput = {
      category,
      limitCents: Math.round(numericLimit * 100),
    };

    setSaving(true);

    try {
      if (existing) {
        await updateBudget(existing.id, input);
      } else {
        await addBudget(input);
      }

      router.back();
      showToast({
        title: existing ? 'Budget updated' : 'Budget created',
        message: `${category} will be tracked automatically this month.`,
        tone: 'success',
      });
    } catch (error) {
      console.error(error);
      Alert.alert('Could not save budget', 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = () => {
    if (!existing) return;

    Alert.alert(
      'Delete budget?',
      `The ${existing.category} spending limit will be removed. Your transactions will not be deleted.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteBudget(existing.id);
              router.back();
              showToast({
                title: 'Budget deleted',
                tone: 'success',
              });
            } catch (error) {
              console.error(error);
              Alert.alert('Could not delete budget', 'Please try again.');
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
              {existing ? 'Edit budget' : 'Create budget'}
            </Text>
            <Text style={styles.subtitle}>
              Set a monthly limit for one spending category.
            </Text>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.label}>Category</Text>

          <View style={styles.categoryGrid}>
            {expenseCategories.map((item) => {
              const active = item.name === category;

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

          <Text style={styles.label}>Monthly limit</Text>

          <View style={styles.amountWrap}>
            <Text style={styles.currency}>₱</Text>

            <TextInput
              value={limit}
              onChangeText={(value) => setLimit(cleanMoney(value))}
              placeholder="0.00"
              placeholderTextColor={Colors.textMuted}
              keyboardType="decimal-pad"
              style={styles.amountInput}
              maxLength={12}
            />
          </View>

          <View style={styles.infoCard}>
            <Ionicons
              name="information-circle-outline"
              size={19}
              color={Colors.primary}
            />
            <Text style={styles.infoText}>
              SaveTrack automatically compares this limit with expense
              transactions in the same category every month.
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
                {existing ? 'Save changes' : 'Create budget'}
              </Text>
            )}
          </Pressable>

          {existing ? (
            <Pressable style={styles.deleteButton} onPress={confirmDelete}>
              <Ionicons name="trash-outline" size={18} color={Colors.danger} />
              <Text style={styles.deleteText}>Delete budget</Text>
            </Pressable>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
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
    fontSize: 11,
    marginTop: 3,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 34,
  },
  label: {
    color: Colors.text,
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 9,
    marginTop: 18,
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
    fontSize: 11,
    fontWeight: '700',
  },
  categoryTextActive: {
    color: Colors.primary,
  },
  amountWrap: {
    minHeight: 72,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  currency: {
    color: Colors.textSecondary,
    fontSize: 26,
    fontWeight: '700',
    marginRight: 7,
  },
  amountInput: {
    flex: 1,
    color: Colors.text,
    fontSize: 29,
    fontWeight: '800',
  },
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
    fontSize: 10,
    lineHeight: 16,
  },
  saveButton: {
    minHeight: 54,
    borderRadius: 17,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  disabled: {
    opacity: 0.7,
  },
  saveText: {
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
  deleteText: {
    color: Colors.danger,
    fontSize: 13,
    fontWeight: '800',
  },
});
