import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Colors } from '../../constants/theme';
import { useSecurity } from '../../contexts/SecurityContext';

export function AppLockOverlay() {
  const {
    loading,
    locked,
    privacyShieldVisible,
    preferences,
    biometricAvailable,
    failedAttempts,
    lockoutUntil,
    verifyPin,
    unlockWithBiometrics,
  } = useSecurity();

  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!lockoutUntil || lockoutUntil <= Date.now()) {
      return;
    }

    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, [lockoutUntil]);

  useEffect(() => {
    if (!locked) {
      setPin('');
      setError('');
      setVerifying(false);
    }
  }, [locked]);

  const secondsRemaining = useMemo(() => {
    if (!lockoutUntil) return 0;

    return Math.max(
      0,
      Math.ceil((lockoutUntil - now) / 1000)
    );
  }, [lockoutUntil, now]);

  const submit = async () => {
    if (pin.length !== 4 || verifying) return;

    setVerifying(true);
    setError('');

    try {
      const result = await verifyPin(pin);

      if (!result.success) {
        setPin('');

        if (result.reason === 'locked-out') {
          setError(
            'Too many attempts. Try again shortly.'
          );
        } else {
          setError(
            `Incorrect PIN${
              failedAttempts < 4
                ? ` · ${4 - failedAttempts} tries before timeout`
                : ''
            }`
          );
        }
      }
    } finally {
      setVerifying(false);
    }
  };

  const biometricUnlock = async () => {
    setError('');
    const success = await unlockWithBiometrics();

    if (!success) {
      setError(
        Platform.OS === 'ios'
          ? 'Biometric unlock was not available. Use your SaveTrack PIN.'
          : 'Biometric unlock failed. Use your SaveTrack PIN.'
      );
    }
  };

  if (!loading && !locked && !privacyShieldVisible) {
    return null;
  }

  if (privacyShieldVisible && !locked) {
    return (
      <View style={styles.privacyShield}>
        <View style={styles.shieldIcon}>
          <Ionicons
            name="shield-checkmark-outline"
            size={30}
            color={Colors.primary}
          />
        </View>
        <Text style={styles.shieldTitle}>SaveTrack</Text>
        <Text style={styles.shieldText}>
          Financial details hidden while the app is away.
        </Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.lockScreen}>
        <ActivityIndicator color={Colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.lockScreen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.logoIcon}>
        <Ionicons
          name="lock-closed-outline"
          size={28}
          color={Colors.primary}
        />
      </View>

      <Text style={styles.brand}>SAVETRACK</Text>
      <Text style={styles.title}>App locked</Text>
      <Text style={styles.subtitle}>
        Enter your 4-digit SaveTrack PIN.
      </Text>

      <TextInput
        value={pin}
        onChangeText={(value) => {
          setPin(value.replace(/\D/g, '').slice(0, 4));
          setError('');
        }}
        keyboardType="number-pad"
        secureTextEntry
        maxLength={4}
        autoFocus
        style={styles.pinInput}
        textAlign="center"
        editable={secondsRemaining === 0}
        onSubmitEditing={submit}
      />

      {secondsRemaining > 0 ? (
        <Text style={styles.lockoutText}>
          Try again in {secondsRemaining}s
        </Text>
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : (
        <Text style={styles.attempts}>
          {failedAttempts > 0
            ? `${failedAttempts} failed ${
                failedAttempts === 1 ? 'attempt' : 'attempts'
              }`
            : ' '}
        </Text>
      )}

      <Pressable
        style={[
          styles.unlockButton,
          (pin.length !== 4 ||
            verifying ||
            secondsRemaining > 0) &&
            styles.disabled,
        ]}
        onPress={submit}
        disabled={
          pin.length !== 4 ||
          verifying ||
          secondsRemaining > 0
        }
      >
        {verifying ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.unlockText}>Unlock</Text>
        )}
      </Pressable>

      {preferences.biometricUnlockEnabled &&
      biometricAvailable ? (
        <Pressable
          style={styles.biometricButton}
          onPress={biometricUnlock}
        >
          <Ionicons
            name="finger-print-outline"
            size={21}
            color={Colors.primary}
          />
          <Text style={styles.biometricText}>
            Use device authentication
          </Text>
        </Pressable>
      ) : null}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  privacyShield: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  shieldIcon: {
    width: 66,
    height: 66,
    borderRadius: 22,
    backgroundColor: Colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  shieldTitle: {
    color: Colors.text,
    fontSize: 20,
    fontWeight: '900',
  },
  shieldText: {
    color: Colors.textSecondary,
    fontSize: 11,
    lineHeight: 17,
    textAlign: 'center',
    marginTop: 6,
  },
  lockScreen: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10000,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  logoIcon: {
    width: 66,
    height: 66,
    borderRadius: 22,
    backgroundColor: Colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  brand: {
    color: Colors.primary,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2,
  },
  title: {
    color: Colors.text,
    fontSize: 25,
    fontWeight: '900',
    marginTop: 8,
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: 11,
    marginTop: 5,
  },
  pinInput: {
    width: 180,
    height: 62,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    color: Colors.text,
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: 12,
    paddingLeft: 18,
    marginTop: 24,
  },
  error: {
    color: Colors.danger,
    fontSize: 10,
    fontWeight: '700',
    marginTop: 9,
  },
  attempts: {
    color: Colors.textMuted,
    fontSize: 9,
    marginTop: 9,
  },
  lockoutText: {
    color: Colors.warning,
    fontSize: 10,
    fontWeight: '800',
    marginTop: 9,
  },
  unlockButton: {
    width: 180,
    minHeight: 50,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
  },
  unlockText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },
  disabled: {
    opacity: 0.5,
  },
  biometricButton: {
    minHeight: 44,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: Colors.primarySoft,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginTop: 12,
  },
  biometricText: {
    color: Colors.primary,
    fontSize: 10,
    fontWeight: '800',
  },
});
