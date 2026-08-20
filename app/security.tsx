import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors } from '../constants/theme';
import { useSecurity } from '../contexts/SecurityContext';

const lockOptions = [
  { seconds: 0, label: 'Immediately' },
  { seconds: 60, label: '1 min' },
  { seconds: 300, label: '5 min' },
];

export default function SecurityScreen() {
  const router = useRouter();
  const {
    preferences,
    pinConfigured,
    biometricAvailable,
    setupPin,
    changePin,
    disableAppLock,
    updatePreferences,
    unlockWithBiometrics,
    lockNow,
  } = useSecurity();

  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');

  const [currentPin, setCurrentPin] = useState('');
  const [replacementPin, setReplacementPin] =
    useState('');
  const [replacementConfirm, setReplacementConfirm] =
    useState('');

  const [removePin, setRemovePin] = useState('');

  const setup = async () => {
    if (newPin.length !== 4) {
      Alert.alert(
        'Use a 4-digit PIN',
        'Enter exactly four numbers.'
      );
      return;
    }

    if (newPin !== confirmPin) {
      Alert.alert(
        'PINs do not match',
        'Enter the same PIN twice.'
      );
      return;
    }

    await setupPin(newPin);
    setNewPin('');
    setConfirmPin('');

    Alert.alert(
      'App lock enabled',
      'SaveTrack will now require your PIN after it locks.'
    );
  };

  const change = async () => {
    if (
      currentPin.length !== 4 ||
      replacementPin.length !== 4
    ) {
      Alert.alert(
        'Check your PINs',
        'Both PINs must contain four numbers.'
      );
      return;
    }

    if (replacementPin !== replacementConfirm) {
      Alert.alert(
        'New PINs do not match',
        'Enter the same new PIN twice.'
      );
      return;
    }

    const success = await changePin(
      currentPin,
      replacementPin
    );

    if (!success) {
      Alert.alert(
        'Current PIN is incorrect',
        'The app lock PIN was not changed.'
      );
      return;
    }

    setCurrentPin('');
    setReplacementPin('');
    setReplacementConfirm('');

    Alert.alert(
      'PIN changed',
      'Your new SaveTrack PIN is active.'
    );
  };

  const removeLock = async () => {
    if (removePin.length !== 4) {
      Alert.alert(
        'Enter your PIN',
        'Confirm your current 4-digit PIN first.'
      );
      return;
    }

    const success = await disableAppLock(removePin);

    if (!success) {
      Alert.alert(
        'Incorrect PIN',
        'App lock is still enabled.'
      );
      return;
    }

    setRemovePin('');
    Alert.alert(
      'App lock removed',
      'SaveTrack will no longer require a PIN.'
    );
  };

  const enableBiometrics = async (enabled: boolean) => {
    if (!enabled) {
      await updatePreferences({
        biometricUnlockEnabled: false,
      });
      return;
    }

    if (!biometricAvailable) {
      Alert.alert(
        'Device authentication unavailable',
        Platform.OS === 'ios'
          ? 'Face ID cannot be fully tested in Expo Go. Your SaveTrack PIN still works, and biometric unlock can be tested in a development or release build.'
          : 'Set up fingerprint or face authentication in your device settings first.'
      );
      return;
    }

    const verified = await unlockWithBiometrics();

    if (!verified) {
      Alert.alert(
        'Authentication failed',
        'Biometric quick unlock was not enabled.'
      );
      return;
    }

    await updatePreferences({
      biometricUnlockEnabled: true,
    });
  };

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
            <Pressable
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons
                name="chevron-back"
                size={22}
                color={Colors.text}
              />
            </Pressable>

            <View style={styles.topText}>
              <Text style={styles.title}>Security & privacy</Text>
              <Text style={styles.subtitle}>
                Protect financial data stored on this device.
              </Text>
            </View>
          </View>

          <View style={styles.statusCard}>
            <View style={styles.statusIcon}>
              <Ionicons
                name={
                  preferences.appLockEnabled
                    ? 'shield-checkmark-outline'
                    : 'shield-outline'
                }
                size={24}
                color={
                  preferences.appLockEnabled
                    ? Colors.success
                    : Colors.primary
                }
              />
            </View>

            <View style={styles.statusText}>
              <Text style={styles.statusTitle}>
                {preferences.appLockEnabled
                  ? 'App lock is active'
                  : 'App lock is off'}
              </Text>
              <Text style={styles.statusDescription}>
                {preferences.appLockEnabled
                  ? 'Your SaveTrack PIN protects access when the app locks.'
                  : 'Create a PIN to add another layer of protection.'}
              </Text>
            </View>
          </View>

          {!pinConfigured ? (
            <>
              <Text style={styles.sectionTitle}>
                Create app PIN
              </Text>

              <View style={styles.card}>
                <PinField
                  label="New 4-digit PIN"
                  value={newPin}
                  onChange={setNewPin}
                />
                <PinField
                  label="Confirm PIN"
                  value={confirmPin}
                  onChange={setConfirmPin}
                />

                <Pressable
                  style={styles.primaryButton}
                  onPress={setup}
                >
                  <Ionicons
                    name="lock-closed-outline"
                    size={18}
                    color="#FFFFFF"
                  />
                  <Text style={styles.primaryButtonText}>
                    Enable app lock
                  </Text>
                </Pressable>
              </View>
            </>
          ) : (
            <>
              <Text style={styles.sectionTitle}>
                Lock behavior
              </Text>

              <View style={styles.card}>
                <SettingRow
                  icon="finger-print-outline"
                  title="Biometric quick unlock"
                  description={
                    biometricAvailable
                      ? 'Use device authentication as a faster unlock option.'
                      : Platform.OS === 'ios'
                        ? 'PIN works in Expo Go; Face ID is tested later in a development/release build.'
                        : 'No enrolled biometric authentication was detected.'
                  }
                  value={
                    preferences.biometricUnlockEnabled
                  }
                  disabled={!preferences.appLockEnabled}
                  onValueChange={enableBiometrics}
                />

                <View style={styles.divider} />

                <Text style={styles.optionLabel}>
                  Auto-lock after leaving SaveTrack
                </Text>

                <View style={styles.chips}>
                  {lockOptions.map((option) => {
                    const active =
                      preferences.autoLockSeconds ===
                      option.seconds;

                    return (
                      <Pressable
                        key={option.seconds}
                        style={[
                          styles.chip,
                          active && styles.chipActive,
                        ]}
                        onPress={() =>
                          updatePreferences({
                            autoLockSeconds: option.seconds,
                          })
                        }
                      >
                        <Text
                          style={[
                            styles.chipText,
                            active &&
                              styles.chipTextActive,
                          ]}
                        >
                          {option.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                <Pressable
                  style={styles.lockNowButton}
                  onPress={() => {
                    lockNow();
                    router.back();
                  }}
                >
                  <Ionicons
                    name="lock-closed-outline"
                    size={18}
                    color={Colors.primary}
                  />
                  <Text style={styles.lockNowText}>
                    Lock SaveTrack now
                  </Text>
                </Pressable>
              </View>

              <Text style={styles.sectionTitle}>
                Change PIN
              </Text>

              <View style={styles.card}>
                <PinField
                  label="Current PIN"
                  value={currentPin}
                  onChange={setCurrentPin}
                />
                <PinField
                  label="New PIN"
                  value={replacementPin}
                  onChange={setReplacementPin}
                />
                <PinField
                  label="Confirm new PIN"
                  value={replacementConfirm}
                  onChange={setReplacementConfirm}
                />

                <Pressable
                  style={styles.secondaryButton}
                  onPress={change}
                >
                  <Text style={styles.secondaryButtonText}>
                    Change PIN
                  </Text>
                </Pressable>
              </View>
            </>
          )}

          <Text style={styles.sectionTitle}>
            Privacy
          </Text>

          <View style={styles.card}>
            <SettingRow
              icon="eye-off-outline"
              title="Hide financial amounts"
              description="Mask currency values throughout SaveTrack with ₱••••."
              value={preferences.hideBalancesEnabled}
              onValueChange={(value) =>
                updatePreferences({
                  hideBalancesEnabled: value,
                })
              }
            />

            <View style={styles.divider} />

            <View style={styles.privacyRow}>
              <View style={styles.settingIcon}>
                <Ionicons
                  name="phone-portrait-outline"
                  size={19}
                  color={Colors.primary}
                />
              </View>

              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>
                  App-switcher privacy shield
                </Text>
                <Text style={styles.settingDescription}>
                  Financial details are covered when SaveTrack leaves the foreground.
                </Text>
              </View>

              <View style={styles.activePill}>
                <Text style={styles.activePillText}>
                  Always on
                </Text>
              </View>
            </View>
          </View>

          <Text style={styles.sectionTitle}>
            Data protection
          </Text>

          <View style={styles.infoCard}>
            <InfoRow
              icon="key-outline"
              title="PIN storage"
              text="Your PIN is salted and hashed before its verifier is stored in the device secure storage."
            />
            <View style={styles.infoDivider} />
            <InfoRow
              icon="phone-portrait-outline"
              title="Local-first data"
              text="Transactions and finance data remain in the local SaveTrack database unless you choose cloud backup."
            />
            <View style={styles.infoDivider} />
            <InfoRow
              icon="cloud-outline"
              title="Cloud isolation"
              text="Firestore rules restrict each signed-in user to their own cloud backup area."
            />
          </View>

          {pinConfigured ? (
            <>
              <Text style={styles.sectionTitle}>
                Remove app lock
              </Text>

              <View style={styles.dangerCard}>
                <Text style={styles.dangerTitle}>
                  Disable PIN protection
                </Text>
                <Text style={styles.dangerDescription}>
                  Enter your current PIN to remove the secure app lock.
                </Text>

                <PinField
                  label="Current PIN"
                  value={removePin}
                  onChange={setRemovePin}
                />

                <Pressable
                  style={styles.dangerButton}
                  onPress={removeLock}
                >
                  <Ionicons
                    name="lock-open-outline"
                    size={18}
                    color={Colors.danger}
                  />
                  <Text style={styles.dangerButtonText}>
                    Remove app lock
                  </Text>
                </Pressable>
              </View>
            </>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

type PinFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
};

function PinField({
  label,
  value,
  onChange,
}: PinFieldProps) {
  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={(text) =>
          onChange(text.replace(/\D/g, '').slice(0, 4))
        }
        keyboardType="number-pad"
        secureTextEntry
        maxLength={4}
        style={styles.pinField}
        placeholder="••••"
        placeholderTextColor={Colors.textMuted}
      />
    </View>
  );
}

type SettingRowProps = {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  description: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
};

function SettingRow({
  icon,
  title,
  description,
  value,
  onValueChange,
  disabled = false,
}: SettingRowProps) {
  return (
    <View
      style={[
        styles.settingRow,
        disabled && styles.disabled,
      ]}
    >
      <View style={styles.settingIcon}>
        <Ionicons
          name={icon}
          size={19}
          color={Colors.primary}
        />
      </View>

      <View style={styles.settingText}>
        <Text style={styles.settingTitle}>
          {title}
        </Text>
        <Text style={styles.settingDescription}>
          {description}
        </Text>
      </View>

      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{
          false: '#CBD5E1',
          true: '#93C5FD',
        }}
        thumbColor={
          value ? Colors.primary : '#F8FAFC'
        }
      />
    </View>
  );
}

type InfoRowProps = {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  text: string;
};

function InfoRow({
  icon,
  title,
  text,
}: InfoRowProps) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIcon}>
        <Ionicons
          name={icon}
          size={18}
          color={Colors.primary}
        />
      </View>

      <View style={styles.infoTextWrap}>
        <Text style={styles.infoTitle}>
          {title}
        </Text>
        <Text style={styles.infoText}>
          {text}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 40,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topText: {
    flex: 1,
    marginLeft: 14,
  },
  title: {
    color: Colors.text,
    fontSize: 22,
    fontWeight: '800',
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 3,
  },
  statusCard: {
    backgroundColor: Colors.primarySoft,
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 25,
  },
  statusIcon: {
    width: 46,
    height: 46,
    borderRadius: 15,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusText: {
    flex: 1,
    marginLeft: 11,
  },
  statusTitle: {
    color: Colors.text,
    fontSize: 13,
    fontWeight: '800',
  },
  statusDescription: {
    color: Colors.textSecondary,
    fontSize: 9,
    lineHeight: 14,
    marginTop: 3,
  },
  sectionTitle: {
    color: Colors.text,
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 11,
  },
  card: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 20,
    padding: 16,
    marginBottom: 25,
  },
  label: {
    color: Colors.text,
    fontSize: 10,
    fontWeight: '800',
    marginBottom: 7,
    marginTop: 11,
  },
  pinField: {
    minHeight: 50,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
    color: Colors.text,
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 7,
    paddingHorizontal: 14,
  },
  primaryButton: {
    minHeight: 52,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    marginTop: 18,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },
  secondaryButton: {
    minHeight: 48,
    borderRadius: 15,
    backgroundColor: Colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 17,
  },
  secondaryButtonText: {
    color: Colors.primary,
    fontSize: 11,
    fontWeight: '900',
  },
  settingRow: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
  },
  disabled: {
    opacity: 0.45,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: Colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingText: {
    flex: 1,
    marginLeft: 11,
    marginRight: 10,
  },
  settingTitle: {
    color: Colors.text,
    fontSize: 11,
    fontWeight: '800',
  },
  settingDescription: {
    color: Colors.textSecondary,
    fontSize: 9,
    lineHeight: 14,
    marginTop: 3,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginLeft: 51,
  },
  optionLabel: {
    color: Colors.textSecondary,
    fontSize: 9,
    fontWeight: '800',
    marginTop: 15,
    marginBottom: 8,
  },
  chips: {
    flexDirection: 'row',
    gap: 7,
  },
  chip: {
    flex: 1,
    minHeight: 39,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: {
    color: Colors.textSecondary,
    fontSize: 9,
    fontWeight: '800',
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  lockNowButton: {
    minHeight: 48,
    borderRadius: 15,
    backgroundColor: Colors.primarySoft,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    marginTop: 16,
  },
  lockNowText: {
    color: Colors.primary,
    fontSize: 11,
    fontWeight: '900',
  },
  privacyRow: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
  },
  activePill: {
    borderRadius: 999,
    backgroundColor: Colors.successSoft,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },
  activePillText: {
    color: Colors.success,
    fontSize: 8,
    fontWeight: '900',
  },
  infoCard: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 20,
    paddingHorizontal: 15,
    marginBottom: 25,
  },
  infoRow: {
    minHeight: 76,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
  },
  infoIcon: {
    width: 39,
    height: 39,
    borderRadius: 13,
    backgroundColor: Colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoTextWrap: {
    flex: 1,
    marginLeft: 11,
  },
  infoTitle: {
    color: Colors.text,
    fontSize: 11,
    fontWeight: '800',
  },
  infoText: {
    color: Colors.textSecondary,
    fontSize: 9,
    lineHeight: 14,
    marginTop: 3,
  },
  infoDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginLeft: 50,
  },
  dangerCard: {
    backgroundColor: Colors.dangerSoft,
    borderRadius: 20,
    padding: 16,
  },
  dangerTitle: {
    color: Colors.danger,
    fontSize: 12,
    fontWeight: '900',
  },
  dangerDescription: {
    color: Colors.textSecondary,
    fontSize: 9,
    lineHeight: 14,
    marginTop: 4,
  },
  dangerButton: {
    minHeight: 48,
    borderRadius: 15,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    marginTop: 14,
  },
  dangerButtonText: {
    color: Colors.danger,
    fontSize: 11,
    fontWeight: '900',
  },
});
