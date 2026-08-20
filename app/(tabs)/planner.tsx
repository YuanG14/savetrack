import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors } from '../../constants/theme';

export default function PlannerScreen() {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        <Text style={styles.eyebrow}>PLAN AHEAD</Text>
        <Text style={styles.title}>Savings Planner</Text>
        <Text style={styles.description}>
          The savings calculator will be built in a later phase.
        </Text>

        <View style={styles.placeholder}>
          <View style={styles.icon}>
            <Ionicons name="calculator-outline" size={28} color={Colors.primary} />
          </View>
          <Text style={styles.placeholderTitle}>Planner coming soon</Text>
          <Text style={styles.placeholderText}>
            Soon you will be able to enter a target price and see how long it
            will take to afford it.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 12 },
  eyebrow: {
    color: Colors.primary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 5,
  },
  title: { fontSize: 29, fontWeight: '800', color: Colors.text },
  description: {
    color: Colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 6,
  },
  placeholder: {
    marginTop: 28,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 22,
    padding: 30,
    alignItems: 'center',
  },
  icon: {
    width: 58,
    height: 58,
    borderRadius: 20,
    backgroundColor: Colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  placeholderTitle: {
    color: Colors.text,
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 6,
  },
  placeholderText: {
    color: Colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
});
