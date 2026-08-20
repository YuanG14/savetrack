import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Good morning</Text>
            <Text style={styles.title}>Your money today</Text>
          </View>

          <View style={styles.avatar}>
            <Text style={styles.avatarText}>S</Text>
          </View>
        </View>

        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Available balance</Text>
          <Text style={styles.balance}>₱0.00</Text>
          <Text style={styles.balanceDescription}>
            Start adding transactions to track your money.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>This month</Text>

        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Income</Text>
            <Text style={styles.summaryValue}>₱0.00</Text>
          </View>

          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Spent</Text>
            <Text style={styles.summaryValue}>₱0.00</Text>
          </View>
        </View>

        <View style={styles.safeToSpendCard}>
          <Text style={styles.safeToSpendLabel}>Safe to spend</Text>
          <Text style={styles.safeToSpendValue}>₱0.00</Text>
          <Text style={styles.safeToSpendDescription}>
            We'll calculate this once you start tracking your finances.
          </Text>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent transactions</Text>
          <Text style={styles.viewAll}>View all</Text>
        </View>

        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>💸</Text>
          <Text style={styles.emptyTitle}>No transactions yet</Text>
          <Text style={styles.emptyDescription}>
            Your recent income and expenses will appear here.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 120,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  greeting: {
    fontSize: 14,
    color: '#64748B',
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 3,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#DBEAFE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#2563EB',
  },
  balanceCard: {
    backgroundColor: '#2563EB',
    borderRadius: 24,
    padding: 24,
    marginBottom: 28,
  },
  balanceLabel: {
    color: '#DBEAFE',
    fontSize: 14,
  },
  balance: {
    color: '#FFFFFF',
    fontSize: 38,
    fontWeight: '700',
    marginTop: 6,
    marginBottom: 8,
  },
  balanceDescription: {
    color: '#BFDBFE',
    fontSize: 13,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 14,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  summaryLabel: {
    color: '#64748B',
    fontSize: 13,
    marginBottom: 8,
  },
  summaryValue: {
    color: '#0F172A',
    fontSize: 20,
    fontWeight: '700',
  },
  safeToSpendCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 30,
  },
  safeToSpendLabel: {
    color: '#2563EB',
    fontSize: 14,
    fontWeight: '600',
  },
  safeToSpendValue: {
    color: '#1E3A8A',
    fontSize: 28,
    fontWeight: '700',
    marginVertical: 5,
  },
  safeToSpendDescription: {
    color: '#64748B',
    fontSize: 13,
    lineHeight: 19,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  viewAll: {
    color: '#2563EB',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 14,
  },
  emptyState: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyEmoji: {
    fontSize: 32,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
  },
  emptyDescription: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 19,
  },
});
