import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { Colors } from '../../constants/theme';
import type { InsightItem } from '../../utils/analytics';

type Props = {
  insight: InsightItem;
};

const tones = {
  positive: {
    icon: 'trending-up-outline' as const,
    color: Colors.success,
    background: Colors.successSoft,
  },
  warning: {
    icon: 'warning-outline' as const,
    color: Colors.warning,
    background: Colors.warningSoft,
  },
  neutral: {
    icon: 'bulb-outline' as const,
    color: Colors.primary,
    background: Colors.primarySoft,
  },
};

export function InsightCard({ insight }: Props) {
  const tone = tones[insight.tone];

  return (
    <View style={styles.card}>
      <View style={[styles.icon, { backgroundColor: tone.background }]}>
        <Ionicons name={tone.icon} size={19} color={tone.color} />
      </View>

      <View style={styles.textWrap}>
        <Text style={styles.title}>{insight.title}</Text>
        <Text style={styles.body}>{insight.body}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 13,
  },
  icon: {
    width: 39,
    height: 39,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: {
    flex: 1,
    marginLeft: 11,
  },
  title: {
    color: Colors.text,
    fontSize: 12,
    fontWeight: '800',
  },
  body: {
    color: Colors.textSecondary,
    fontSize: 10,
    lineHeight: 16,
    marginTop: 3,
  },
});
