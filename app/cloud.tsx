import { Ionicons } from '@expo/vector-icons';
import { FirebaseError } from 'firebase/app';
import { useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CloudStatusCard } from '../components/cloud/CloudStatusCard';
import { Colors } from '../constants/theme';
import { useAuth } from '../contexts/AuthContext';
import { useBudgets } from '../contexts/BudgetContext';
import { useGoals } from '../contexts/GoalContext';
import { useSafeSpend } from '../contexts/SafeSpendContext';
import { useSavings } from '../contexts/SavingsContext';
import { useTransactions } from '../contexts/TransactionContext';
import {
  createCloudBackup,
  getCloudBackupMetadata,
  restoreCloudBackup,
} from '../services/cloudBackup';
import type { CloudActionState, CloudBackupMetadata } from '../types/cloud';

type AuthMode = 'sign-in' | 'sign-up';

function friendlyFirebaseError(error: unknown): string {
  if (!(error instanceof FirebaseError)) {
    return error instanceof Error ? error.message : 'Something went wrong.';
  }

  switch (error.code) {
    case 'auth/invalid-email':
      return 'Enter a valid email address.';
    case 'auth/invalid-credential':
      return 'The email or password is incorrect.';
    case 'auth/email-already-in-use':
      return 'An account already exists for this email.';
    case 'auth/weak-password':
      return 'Choose a stronger password.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Try again later.';
    case 'permission-denied':
      return 'Cloud access was denied. Check your Firestore security rules.';
    default:
      return error.message;
  }
}

export default function CloudScreen() {
  const router = useRouter();
  const db = useSQLiteContext();
  const {
    user,
    loading: authLoading,
    configured,
    signIn,
    signUp,
    signOut,
    resetPassword,
  } = useAuth();

  const { refreshTransactions } = useTransactions();
  const { refreshSavings } = useSavings();
  const { refreshGoals } = useGoals();
  const { refreshSafeSpend } = useSafeSpend();
  const { refreshBudgets } = useBudgets();

  const [mode, setMode] = useState<AuthMode>('sign-in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authBusy, setAuthBusy] = useState(false);
  const [cloudAction, setCloudAction] = useState<CloudActionState>('idle');
  const [metadata, setMetadata] = useState<CloudBackupMetadata | null>(null);
  const [metadataLoading, setMetadataLoading] = useState(false);

  const refreshMetadata = async () => {
    if (!user) {
      setMetadata(null);
      return;
    }

    setMetadataLoading(true);
    try {
      setMetadata(await getCloudBackupMetadata(user.uid));
    } catch (error) {
      console.error(error);
      setMetadata(null);
    } finally {
      setMetadataLoading(false);
    }
  };

  useEffect(() => {
    refreshMetadata();
  }, [user?.uid]);

  const submitAuth = async () => {
    const cleanEmail = email.trim();

    if (!cleanEmail || !password) {
      Alert.alert('Complete the form', 'Enter your email and password.');
      return;
    }

    if (mode === 'sign-up' && password.length < 6) {
      Alert.alert('Password too short', 'Use at least 6 characters.');
      return;
    }

    setAuthBusy(true);
    try {
      if (mode === 'sign-up') {
        await signUp(cleanEmail, password);
      } else {
        await signIn(cleanEmail, password);
      }
      setPassword('');
    } catch (error) {
      Alert.alert('Could not continue', friendlyFirebaseError(error));
    } finally {
      setAuthBusy(false);
    }
  };

  const handleResetPassword = async () => {
    const cleanEmail = email.trim();

    if (!cleanEmail) {
      Alert.alert('Enter your email', 'Type your account email first.');
      return;
    }

    try {
      await resetPassword(cleanEmail);
      Alert.alert('Email sent', 'Check your inbox for the password reset link.');
    } catch (error) {
      Alert.alert('Could not send reset email', friendlyFirebaseError(error));
    }
  };

  const backupNow = async () => {
    if (!user) return;

    setCloudAction('backing-up');
    try {
      const result = await createCloudBackup(db, user.uid);
      setMetadata(result);
      Alert.alert('Backup complete', 'Your current SaveTrack data is now stored in your cloud account.');
    } catch (error) {
      Alert.alert('Backup failed', friendlyFirebaseError(error));
    } finally {
      setCloudAction('idle');
    }
  };

  const restoreNow = async () => {
    if (!user) return;

    setCloudAction('restoring');
    try {
      await restoreCloudBackup(db, user.uid);
      await Promise.all([
        refreshTransactions(),
        refreshSavings(),
        refreshGoals(),
        refreshSafeSpend(),
        refreshBudgets(),
      ]);
      await refreshMetadata();
      Alert.alert('Restore complete', 'Your local SaveTrack data now matches the cloud backup.');
    } catch (error) {
      Alert.alert('Restore failed', friendlyFirebaseError(error));
    } finally {
      setCloudAction('idle');
    }
  };

  const confirmRestore = () => {
    Alert.alert(
      'Restore cloud backup?',
      'This replaces your current local transactions, savings, goals, commitments, and budgets with the cloud copy. Notification preferences on this phone are kept.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Restore', style: 'destructive', onPress: restoreNow },
      ]
    );
  };

  if (authLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingView}>
          <ActivityIndicator color={Colors.primary} />
          <Text style={styles.loadingText}>Loading account...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.topBar}>
            <Pressable style={styles.backButton} onPress={() => router.back()}>
              <Ionicons name="chevron-back" size={22} color={Colors.text} />
            </Pressable>

            <View style={styles.topText}>
              <Text style={styles.title}>Account & backup</Text>
              <Text style={styles.subtitle}>Keep local-first control with an optional cloud copy.</Text>
            </View>
          </View>

          {!configured ? (
            <View style={styles.setupCard}>
              <View style={styles.setupIcon}>
                <Ionicons name="construct-outline" size={23} color={Colors.warning} />
              </View>
              <View style={styles.setupText}>
                <Text style={styles.setupTitle}>Firebase setup required</Text>
                <Text style={styles.setupBody}>
                  SaveTrack is still working locally. Add your Firebase values to .env.local when you are ready to enable accounts and cloud backup.
                </Text>
              </View>
            </View>
          ) : null}

          <CloudStatusCard metadata={metadata} signedIn={Boolean(user)} />

          <Pressable
            style={styles.securityShortcut}
            onPress={() => router.push('/security')}
          >
            <View style={styles.securityShortcutIcon}>
              <Ionicons
                name="shield-checkmark-outline"
                size={21}
                color={Colors.primary}
              />
            </View>

            <View style={styles.securityShortcutText}>
              <Text style={styles.securityShortcutTitle}>
                Security & privacy
              </Text>
              <Text style={styles.securityShortcutDescription}>
                App PIN, auto-lock, privacy masking, and device authentication.
              </Text>
            </View>

            <Ionicons
              name="chevron-forward"
              size={17}
              color={Colors.textMuted}
            />
          </Pressable>

          {configured && !user ? (
            <View style={styles.authCard}>
              <View style={styles.segment}>
                <Pressable
                  style={[styles.segmentButton, mode === 'sign-in' && styles.segmentActive]}
                  onPress={() => setMode('sign-in')}
                >
                  <Text style={[styles.segmentText, mode === 'sign-in' && styles.segmentTextActive]}>Sign in</Text>
                </Pressable>
                <Pressable
                  style={[styles.segmentButton, mode === 'sign-up' && styles.segmentActive]}
                  onPress={() => setMode('sign-up')}
                >
                  <Text style={[styles.segmentText, mode === 'sign-up' && styles.segmentTextActive]}>Create account</Text>
                </Pressable>
              </View>

              <Text style={styles.label}>Email</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                placeholderTextColor={Colors.textMuted}
                autoCapitalize="none"
                keyboardType="email-address"
                style={styles.input}
              />

              <Text style={styles.label}>Password</Text>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder={mode === 'sign-up' ? 'At least 6 characters' : 'Your password'}
                placeholderTextColor={Colors.textMuted}
                secureTextEntry
                autoCapitalize="none"
                style={styles.input}
              />

              <Pressable
                style={[styles.primaryButton, authBusy && styles.disabled]}
                onPress={submitAuth}
                disabled={authBusy}
              >
                {authBusy ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.primaryButtonText}>
                    {mode === 'sign-up' ? 'Create account' : 'Sign in'}
                  </Text>
                )}
              </Pressable>

              {mode === 'sign-in' ? (
                <Pressable onPress={handleResetPassword}>
                  <Text style={styles.linkText}>Forgot password?</Text>
                </Pressable>
              ) : null}
            </View>
          ) : null}

          {configured && user ? (
            <>
              <View style={styles.accountCard}>
                <View style={styles.avatar}>
                  <Ionicons name="person-outline" size={22} color={Colors.primary} />
                </View>
                <View style={styles.accountText}>
                  <Text style={styles.accountLabel}>Signed in as</Text>
                  <Text style={styles.accountEmail}>{user.email ?? 'SaveTrack user'}</Text>
                </View>
              </View>

              <Text style={styles.sectionTitle}>Cloud backup</Text>

              <View style={styles.actionsCard}>
                <Pressable
                  style={styles.actionRow}
                  onPress={backupNow}
                  disabled={cloudAction !== 'idle'}
                >
                  <View style={styles.actionIcon}>
                    <Ionicons name="cloud-upload-outline" size={21} color={Colors.primary} />
                  </View>
                  <View style={styles.actionText}>
                    <Text style={styles.actionTitle}>Back up now</Text>
                    <Text style={styles.actionDescription}>Upload the current local SaveTrack database to your account.</Text>
                  </View>
                  {cloudAction === 'backing-up' ? (
                    <ActivityIndicator color={Colors.primary} />
                  ) : (
                    <Ionicons name="chevron-forward" size={17} color={Colors.textMuted} />
                  )}
                </Pressable>

                <View style={styles.divider} />

                <Pressable
                  style={[styles.actionRow, !metadata?.exists && styles.disabledRow]}
                  onPress={confirmRestore}
                  disabled={!metadata?.exists || cloudAction !== 'idle'}
                >
                  <View style={styles.actionIcon}>
                    <Ionicons name="cloud-download-outline" size={21} color={Colors.primary} />
                  </View>
                  <View style={styles.actionText}>
                    <Text style={styles.actionTitle}>Restore backup</Text>
                    <Text style={styles.actionDescription}>Replace local finance data with the latest cloud copy.</Text>
                  </View>
                  {cloudAction === 'restoring' ? (
                    <ActivityIndicator color={Colors.primary} />
                  ) : (
                    <Ionicons name="chevron-forward" size={17} color={Colors.textMuted} />
                  )}
                </Pressable>
              </View>

              {metadataLoading ? (
                <View style={styles.metadataLoading}>
                  <ActivityIndicator size="small" color={Colors.primary} />
                  <Text style={styles.metadataLoadingText}>Checking cloud backup...</Text>
                </View>
              ) : null}

              <View style={styles.localFirstCard}>
                <Ionicons name="phone-portrait-outline" size={19} color={Colors.primary} />
                <Text style={styles.localFirstText}>
                  SaveTrack remains local-first. Signing in does not automatically upload every change; you decide when to create a cloud backup.
                </Text>
              </View>

              <Pressable
                style={styles.signOutButton}
                onPress={async () => {
                  try {
                    await signOut();
                    setMetadata(null);
                  } catch (error) {
                    Alert.alert('Could not sign out', friendlyFirebaseError(error));
                  }
                }}
              >
                <Ionicons name="log-out-outline" size={18} color={Colors.danger} />
                <Text style={styles.signOutText}>Sign out</Text>
              </Pressable>
            </>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safeArea: { flex: 1, backgroundColor: Colors.background },
  content: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 40 },
  loadingView: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  loadingText: { color: Colors.textSecondary, fontSize: 11 },
  topBar: { flexDirection: 'row', alignItems: 'center', marginBottom: 18 },
  backButton: { width: 42, height: 42, borderRadius: 14, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  topText: { flex: 1, marginLeft: 14 },
  title: { color: Colors.text, fontSize: 22, fontWeight: '800' },
  subtitle: { color: Colors.textSecondary, fontSize: 11, lineHeight: 16, marginTop: 3 },
  setupCard: { backgroundColor: Colors.warningSoft, borderRadius: 19, padding: 16, flexDirection: 'row', marginBottom: 12 },
  setupIcon: { width: 44, height: 44, borderRadius: 15, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  setupText: { flex: 1, marginLeft: 11 },
  setupTitle: { color: Colors.text, fontSize: 12, fontWeight: '800' },
  setupBody: { color: Colors.textSecondary, fontSize: 10, lineHeight: 15, marginTop: 4 },
  securityShortcut: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 19,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
  },
  securityShortcutIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: Colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  securityShortcutText: {
    flex: 1,
    marginLeft: 11,
    marginRight: 8,
  },
  securityShortcutTitle: {
    color: Colors.text,
    fontSize: 12,
    fontWeight: '800',
  },
  securityShortcutDescription: {
    color: Colors.textSecondary,
    fontSize: 9,
    lineHeight: 14,
    marginTop: 3,
  },
  authCard: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 21, padding: 17, marginTop: 14 },
  segment: { flexDirection: 'row', backgroundColor: Colors.background, borderRadius: 14, padding: 4 },
  segmentButton: { flex: 1, minHeight: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  segmentActive: { backgroundColor: Colors.primary },
  segmentText: { color: Colors.textSecondary, fontSize: 11, fontWeight: '800' },
  segmentTextActive: { color: '#FFFFFF' },
  label: { color: Colors.text, fontSize: 11, fontWeight: '800', marginTop: 15, marginBottom: 7 },
  input: { minHeight: 50, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.background, color: Colors.text, paddingHorizontal: 14, fontSize: 13 },
  primaryButton: { minHeight: 50, borderRadius: 15, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', marginTop: 18 },
  primaryButtonText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
  linkText: { color: Colors.primary, fontSize: 10, fontWeight: '800', textAlign: 'center', marginTop: 13 },
  disabled: { opacity: 0.65 },
  accountCard: { backgroundColor: Colors.primarySoft, borderRadius: 19, padding: 16, flexDirection: 'row', alignItems: 'center', marginTop: 14, marginBottom: 24 },
  avatar: { width: 44, height: 44, borderRadius: 15, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  accountText: { flex: 1, marginLeft: 11 },
  accountLabel: { color: Colors.textMuted, fontSize: 9 },
  accountEmail: { color: Colors.text, fontSize: 12, fontWeight: '800', marginTop: 3 },
  sectionTitle: { color: Colors.text, fontSize: 17, fontWeight: '800', marginBottom: 11 },
  actionsCard: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 20, paddingHorizontal: 15 },
  actionRow: { minHeight: 78, flexDirection: 'row', alignItems: 'center' },
  actionIcon: { width: 42, height: 42, borderRadius: 14, backgroundColor: Colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  actionText: { flex: 1, marginLeft: 11, marginRight: 8 },
  actionTitle: { color: Colors.text, fontSize: 12, fontWeight: '800' },
  actionDescription: { color: Colors.textSecondary, fontSize: 9, lineHeight: 14, marginTop: 3 },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginLeft: 53 },
  disabledRow: { opacity: 0.45 },
  metadataLoading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 10 },
  metadataLoadingText: { color: Colors.textMuted, fontSize: 9 },
  localFirstCard: { backgroundColor: Colors.primarySoft, borderRadius: 17, padding: 14, flexDirection: 'row', alignItems: 'flex-start', gap: 9, marginTop: 14 },
  localFirstText: { flex: 1, color: Colors.textSecondary, fontSize: 10, lineHeight: 16 },
  signOutButton: { minHeight: 50, borderRadius: 16, backgroundColor: Colors.dangerSoft, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, marginTop: 12 },
  signOutText: { color: Colors.danger, fontSize: 11, fontWeight: '800' },
});
