import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { Colors } from '../../constants/theme';
import type { AffordabilityStatus } from '../../utils/affordability';

type Props = {
  status: AffordabilityStatus;
};

const content = {
  comfortable: {
    title: 'Looks affordable',
    body: 'This purchase stays within your current safe-to-spend amount.',
    icon: 'checkmark-circle-outline' as const,
    color: Colors.success,
    background: Colors.successSoft,
  },
  possible: {
    title: 'Affordable, but expensive',
    body: 'You can cover it, but it uses a large part of your safe-to-spend money.',
    icon: 'alert-circle-outline' as const,
    color: Colors.warning,
    background: Colors.warningSoft,
  },
  risky: {
    title: 'This would touch protected money',
    body: 'The purchase is larger than your safe-to-spend amount and may require money reserved for savings or commitments.',
    icon: 'warning-outline' as const,
    color: Colors.danger,
    background: Colors.dangerSoft,
  },
  'not-recommended': {
    title: 'Not affordable right now',
    body: 'The purchase is larger than your current available balance.',
    icon: 'close-circle-outline' as const,
    color: Colors.danger,
    background: Colors.dangerSoft,
  },
};

export function AffordabilityStatusCard({ status }: Props) {
  const item = content[status];

  return (
    <View style={[styles.card, { backgroundColor: item.background }]}>
      <View style={styles.iconWrap}>
        <Ionicons name={item.icon} size={24} color={item.color} />
      </View>

      <View style={styles.textWrap}>
        <Text style={[styles.title, { color: item.color }]}>{item.title}</Text>
        <Text style={styles.body}>{item.body}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: 17,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '800',
  },
  body: {
    color: Colors.textSecondary,
    fontSize: 11,
    lineHeight: 17,
    marginTop: 4,
  },
});
