import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TransactionRow } from '../../components/transactions/TransactionRow';
import { Colors } from '../../constants/theme';
import { useTransactions } from '../../contexts/TransactionContext';
import type { TransactionFilter } from '../../types/transaction';

const filters: TransactionFilter[] = ['all', 'expense', 'income'];

export default function TransactionsScreen() {
  const router = useRouter();
  const { transactions, loading, refreshTransactions } = useTransactions();
  const [filter, setFilter] = useState<TransactionFilter>('all');
  const [refreshing, setRefreshing] = useState(false);

  const filteredTransactions = useMemo(() => {
    if (filter === 'all') {
      return transactions;
    }

    return transactions.filter((transaction) => transaction.type === filter);
  }, [filter, transactions]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshTransactions();
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>ACTIVITY</Text>
            <Text style={styles.title}>Transactions</Text>
            <Text style={styles.subtitle}>
              Every peso in and out, in one place.
            </Text>
          </View>

          <Pressable
            style={styles.addButton}
            onPress={() => router.push('/add-transaction')}
            accessibilityRole="button"
            accessibilityLabel="Add transaction"
          >
            <Ionicons name="add" size={24} color="#FFFFFF" />
          </Pressable>
        </View>

        <View style={styles.filters}>
          {filters.map((item) => {
            const active = item === filter;
            return (
              <Pressable
                key={item}
                onPress={() => setFilter(item)}
                style={[styles.filterChip, active && styles.filterChipActive]}
              >
                <Text
                  style={[
                    styles.filterText,
                    active && styles.filterTextActive,
                  ]}
                >
                  {item === 'all'
                    ? 'All'
                    : item === 'expense'
                      ? 'Expenses'
                      : 'Income'}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {loading ? (
          <View style={styles.centerState}>
            <ActivityIndicator color={Colors.primary} />
            <Text style={styles.stateText}>Loading transactions...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredTransactions}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => <TransactionRow transaction={item} />}
            contentContainerStyle={
              filteredTransactions.length === 0
                ? styles.emptyListContent
                : styles.listContent
            }
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={Colors.primary}
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <View style={styles.emptyIcon}>
                  <Ionicons name="receipt-outline" size={28} color={Colors.primary} />
                </View>
                <Text style={styles.emptyTitle}>
                  {filter === 'all'
                    ? 'No transactions yet'
                    : `No ${filter} transactions`}
                </Text>
                <Text style={styles.stateText}>
                  {filter === 'all'
                    ? 'Add your first income or expense to get started.'
                    : 'Try another filter or add a new transaction.'}
                </Text>

                <Pressable
                  style={styles.emptyButton}
                  onPress={() => router.push('/add-transaction')}
                >
                  <Text style={styles.emptyButtonText}>Add transaction</Text>
                </Pressable>
              </View>
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 22,
  },
  eyebrow: {
    color: Colors.primary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 5,
  },
  title: {
    color: Colors.text,
    fontSize: 29,
    fontWeight: '800',
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: 13,
    marginTop: 5,
  },
  addButton: {
    width: 46,
    height: 46,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
  },
  filters: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 18,
  },
  filterChip: {
    paddingVertical: 9,
    paddingHorizontal: 15,
    borderRadius: 999,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterText: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  stateText: {
    color: Colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
  listContent: {
    backgroundColor: Colors.surface,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    paddingBottom: 2,
    marginBottom: 110,
  },
  separator: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginLeft: 72,
  },
  emptyListContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingBottom: 100,
  },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  emptyIcon: {
    width: 58,
    height: 58,
    borderRadius: 20,
    backgroundColor: Colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    color: Colors.text,
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 7,
    textTransform: 'capitalize',
  },
  emptyButton: {
    marginTop: 18,
    backgroundColor: Colors.primary,
    minHeight: 44,
    paddingHorizontal: 18,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
});
