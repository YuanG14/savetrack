import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { Colors } from '../../constants/theme';
import type { CloudBackupMetadata } from '../../types/cloud';

type Props = {
  metadata: CloudBackupMetadata | null;
  signedIn: boolean;
};

export function CloudStatusCard({ metadata, signedIn }: Props) {
  const title = !signedIn
    ? 'Local-only mode'
    : metadata?.exists
      ? 'Cloud backup available'
      : 'No cloud backup yet';

  const description = !signedIn
    ? 'Your SaveTrack data remains stored on this device until you sign in and back it up.'
    : metadata?.exists
      ? metadata.updatedAt
        ? `Last backup ${new Intl.DateTimeFormat('en-PH', {
            dateStyle: 'medium',
            timeStyle: 'short',
          }).format(metadata.updatedAt)}`
        : 'A backup exists in your account.'
      : 'Create your first cloud backup when you are ready.';

  return (
    <View style={styles.card}>
      <View style={styles.icon}>
        <Ionicons
          name={signedIn ? 'cloud-done-outline' : 'cloud-offline-outline'}
          size={22}
          color={signedIn ? Colors.primary : Colors.textSecondary}
        />
      </View>

      <View style={styles.textWrap}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    width: 45,
    height: 45,
    borderRadius: 15,
    backgroundColor: Colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: {
    flex: 1,
    marginLeft: 12,
  },
  title: {
    color: Colors.text,
    fontSize: 13,
    fontWeight: '800',
  },
  description: {
    color: Colors.textSecondary,
    fontSize: 10,
    lineHeight: 15,
    marginTop: 4,
  },
});
