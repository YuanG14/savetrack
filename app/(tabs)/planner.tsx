import { StyleSheet, Text, View } from 'react-native';

export default function PlannerScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Savings Planner</Text>
      <Text style={styles.description}>
        Calculate how long it will take to afford something.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 20,
    paddingTop: 70,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0F172A',
  },
  description: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 8,
  },
});
