import { useEffect, useRef } from 'react';
import {
  Animated,
  StyleSheet,
  View,
} from 'react-native';

import { Colors } from '../../constants/theme';

export function TransactionListSkeleton() {
  const opacity = useRef(new Animated.Value(0.45)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.9,
          duration: 650,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.45,
          duration: 650,
          useNativeDriver: true,
        }),
      ])
    );

    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View style={[styles.card, { opacity }]}>
      {[0, 1, 2, 3, 4].map((item) => (
        <View key={item}>
          <View style={styles.row}>
            <View style={styles.icon} />

            <View style={styles.center}>
              <View style={styles.title} />
              <View style={styles.meta} />
            </View>

            <View style={styles.amount} />
          </View>

          {item < 4 ? <View style={styles.divider} /> : null}
        </View>
      ))}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 22,
    overflow: 'hidden',
  },
  row: {
    height: 72,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#E2E8F0',
  },
  center: {
    flex: 1,
    marginLeft: 11,
  },
  title: {
    width: '48%',
    height: 10,
    borderRadius: 5,
    backgroundColor: '#E2E8F0',
  },
  meta: {
    width: '68%',
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F1F5F9',
    marginTop: 7,
  },
  amount: {
    width: 66,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#E2E8F0',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginLeft: 68,
  },
});
