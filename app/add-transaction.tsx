import { useRouter } from 'expo-router';
import { Alert } from 'react-native';

import { TransactionForm } from '../components/transactions/TransactionForm';
import { useTransactions } from '../contexts/TransactionContext';
import type { TransactionInput } from '../types/transaction';

export default function AddTransactionScreen() {
  const router = useRouter();
  const { addTransaction } = useTransactions();

  const handleSubmit = async (input: TransactionInput) => {
    try {
      await addTransaction(input);
      router.back();
    } catch (error) {
      console.error(error);
      Alert.alert(
        'Could not save transaction',
        'Something went wrong while saving. Please try again.'
      );
      throw error;
    }
  };

  return (
    <TransactionForm
      title="Add transaction"
      subtitle="Record money coming in or going out."
      submitLabel="Save transaction"
      onSubmit={handleSubmit}
    />
  );
}
