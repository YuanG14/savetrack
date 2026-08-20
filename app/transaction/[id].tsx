import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TransactionForm } from '../../components/transactions/TransactionForm';
import { Colors } from '../../constants/theme';
import { useToast } from '../../contexts/ToastContext';
import { useTransactions } from '../../contexts/TransactionContext';
import type { TransactionInput } from '../../types/transaction';

export default function EditTransactionScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const { transactions, loading, updateTransaction, deleteTransaction } =
    useTransactions();
  const { showToast } = useToast();

  const id = Number(params.id);

  const transaction = useMemo(
    () => transactions.find((item) => item.id === id),
    [id, transactions]
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <ActivityIndicator color={Colors.primary} />
          <Text style={styles.loadingText}>Loading transaction...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!transaction || !Number.isFinite(id)) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <Text style={styles.notFoundTitle}>Transaction not found</Text>
          <Text style={styles.loadingText}>
            It may have already been deleted.
          </Text>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const handleUpdate = async (input: TransactionInput) => {
    try {
      await updateTransaction(id, input);
      router.back();
      showToast({
        title: 'Transaction updated',
        message: 'The changes were saved successfully.',
        tone: 'success',
      });
    } catch (error) {
      console.error(error);
      Alert.alert(
        'Could not update transaction',
        'Something went wrong while updating. Please try again.'
      );
      throw error;
    }
  };

  const confirmDelete = () => {
    Alert.alert(
      'Delete transaction?',
      'This transaction will be permanently removed.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteTransaction(id);
              router.back();
              showToast({
                title: 'Transaction deleted',
                tone: 'success',
              });
            } catch (error) {
              console.error(error);
              Alert.alert(
                'Could not delete transaction',
                'Please try again.'
              );
            }
          },
        },
      ]
    );
  };

  return (
    <TransactionForm
      title="Edit transaction"
      subtitle="Update the details or remove this entry."
      submitLabel="Save changes"
      initialValue={transaction}
      onSubmit={handleUpdate}
      onDelete={confirmDelete}
    />
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
    gap: 8,
  },
  loadingText: {
    color: Colors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
  },
  notFoundTitle: {
    color: Colors.text,
    fontSize: 20,
    fontWeight: '800',
  },
  backButton: {
    marginTop: 14,
    paddingHorizontal: 18,
    minHeight: 44,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
});
