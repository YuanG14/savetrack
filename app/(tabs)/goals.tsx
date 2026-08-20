import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GoalCard } from '../../components/goals/GoalCard';
import { Colors } from '../../constants/theme';
import { useGoals } from '../../contexts/GoalContext';
import { useSavings } from '../../contexts/SavingsContext';
import { formatCurrencyFromCents } from '../../utils/currency';

export default function GoalsScreen() {
  const router = useRouter();
  const { goals, loading, totalAllocatedCents } = useGoals();
  const { currentSavingsCents } = useSavings();

  const unallocatedCents = currentSavingsCents - totalAllocatedCents;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.eyebrow}>GOALS</Text>
            <Text style={styles.title}>What are you saving for?</Text>
            <Text style={styles.subtitle}>
              Give your reserved savings a purpose.
            </Text>
          </View>

          <Pressable
            style={styles.addButton}
            onPress={() => router.push('/goal-editor')}
          >
            <Ionicons name="add" size={24} color="#FFFFFF" />
          </Pressable>
        </View>

        <Pressable
          style={styles.poolCard}
          onPress={() => router.push('/savings')}
        >
          <View style={styles.poolTop}>
            <View>
              <Text style={styles.poolLabel}>Savings pool</Text>
              <Text style={styles.poolValue}>
                {formatCurrencyFromCents(currentSavingsCents)}
              </Text>
            </View>

            <View style={styles.poolIcon}>
              <Ionicons name="wallet-outline" size={22} color={Colors.primary} />
            </View>
          </View>

          <View style={styles.poolDivider} />

          <View style={styles.poolStats}>
            <View>
              <Text style={styles.poolStatLabel}>Allocated to goals</Text>
              <Text style={styles.poolStatValue}>
                {formatCurrencyFromCents(totalAllocatedCents)}
              </Text>
            </View>

            <View style={styles.poolStatRight}>
              <Text style={styles.poolStatLabel}>Unallocated</Text>
              <Text
                style={[
                  styles.poolStatValue,
                  unallocatedCents < 0 && styles.negative,
                ]}
              >
                {formatCurrencyFromCents(unallocatedCents)}
              </Text>
            </View>
          </View>

          <View style={styles.manageRow}>
            <Text style={styles.manageText}>Manage savings pool</Text>
            <Ionicons name="chevron-forward" size={17} color={Colors.primary} />
          </View>
        </Pressable>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Your goals</Text>
          {goals.length > 0 ? (
            <Text style={styles.goalCount}>
              {goals.length} {goals.length === 1 ? 'goal' : 'goals'}
            </Text>
          ) : null}
        </View>

        {loading ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator color={Colors.primary} />
          </View>
        ) : goals.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons name="flag-outline" size={28} color={Colors.primary} />
            </View>

            <Text style={styles.emptyTitle}>Create your first goal</Text>
            <Text style={styles.emptyText}>
              Save for a phone, trip, emergency fund, car, or anything else that matters to you.
            </Text>

            <Pressable
              style={styles.emptyButton}
              onPress={() => router.push('/goal-editor')}
            >
              <Ionicons name="add" size={18} color="#FFFFFF" />
              <Text style={styles.emptyButtonText}>Create goal</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.goalList}>
            {goals.map((goal) => (
              <GoalCard key={goal.id} goal={goal} />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  content: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 120 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 22,
  },
  headerText: { flex: 1, paddingRight: 12 },
  eyebrow: {
    color: Colors.primary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 5,
  },
  title: { color: Colors.text, fontSize: 28, fontWeight: '800' },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: 13,
    marginTop: 6,
  },
  addButton: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  poolCard: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 23,
    padding: 19,
    marginBottom: 28,
  },
  poolTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  poolLabel: { color: Colors.textSecondary, fontSize: 12, fontWeight: '700' },
  poolValue: {
    color: Colors.text,
    fontSize: 27,
    fontWeight: '800',
    marginTop: 4,
  },
  poolIcon: {
    width: 44,
    height: 44,
    borderRadius: 15,
    backgroundColor: Colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  poolDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 16,
  },
  poolStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  poolStatRight: { alignItems: 'flex-end' },
  poolStatLabel: { color: Colors.textMuted, fontSize: 10 },
  poolStatValue: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '800',
    marginTop: 3,
  },
  negative: { color: Colors.danger },
  manageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 3,
    marginTop: 17,
  },
  manageText: {
    color: Colors.primary,
    fontSize: 11,
    fontWeight: '800',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 13,
  },
  sectionTitle: { color: Colors.text, fontSize: 18, fontWeight: '800' },
  goalCount: { color: Colors.textMuted, fontSize: 11, fontWeight: '700' },
  loadingCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
  },
  emptyState: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 22,
    padding: 30,
    alignItems: 'center',
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
  emptyTitle: { color: Colors.text, fontSize: 17, fontWeight: '800' },
  emptyText: {
    color: Colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 7,
    maxWidth: 290,
  },
  emptyButton: {
    marginTop: 18,
    minHeight: 46,
    paddingHorizontal: 18,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  emptyButtonText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
  goalList: { gap: 12 },
});
