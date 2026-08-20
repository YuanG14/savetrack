import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Switch, Text, View } from 'react-native';

import { Colors } from '../../constants/theme';

type Props = {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  description: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
};

export function NotificationSettingRow({
  icon,
  title,
  description,
  value,
  onValueChange,
  disabled = false,
}: Props) {
  return (
    <View style={[styles.row, disabled && styles.disabled]}>
      <View style={styles.icon}>
        <Ionicons name={icon} size={19} color={Colors.primary} />
      </View>

      <View style={styles.textWrap}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>

      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{
          false: '#CBD5E1',
          true: '#93C5FD',
        }}
        thumbColor={value ? Colors.primary : '#F8FAFC'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 76,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  disabled: {
    opacity: 0.45,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: Colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: {
    flex: 1,
    marginLeft: 11,
    marginRight: 10,
  },
  title: {
    color: Colors.text,
    fontSize: 12,
    fontWeight: '800',
  },
  description: {
    color: Colors.textSecondary,
    fontSize: 9,
    lineHeight: 14,
    marginTop: 3,
  },
});
