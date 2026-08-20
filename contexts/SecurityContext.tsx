import * as Crypto from 'expo-crypto';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  AppState,
  type AppStateStatus,
} from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';

import type {
  PinVerificationResult,
  SecurityPreferences,
} from '../types/security';
import {
  defaultSecurityPreferences,
} from '../types/security';
import { setCurrencyPrivacyMask } from '../utils/currency';

const PIN_HASH_KEY = 'savetrack.security.pin_hash';
const PIN_SALT_KEY = 'savetrack.security.pin_salt';

const settingKeys = [
  'security_app_lock_enabled',
  'security_biometric_unlock_enabled',
  'security_hide_balances_enabled',
  'security_auto_lock_seconds',
];

type SecurityContextValue = {
  preferences: SecurityPreferences;
  loading: boolean;
  locked: boolean;
  privacyShieldVisible: boolean;
  pinConfigured: boolean;
  biometricAvailable: boolean;
  failedAttempts: number;
  lockoutUntil: number | null;
  setupPin: (pin: string) => Promise<void>;
  verifyPin: (pin: string) => Promise<PinVerificationResult>;
  changePin: (
    currentPin: string,
    newPin: string
  ) => Promise<boolean>;
  disableAppLock: (pin: string) => Promise<boolean>;
  updatePreferences: (
    updates: Partial<SecurityPreferences>
  ) => Promise<void>;
  unlockWithBiometrics: () => Promise<boolean>;
  lockNow: () => void;
};

const SecurityContext =
  createContext<SecurityContextValue | null>(null);

function readBoolean(
  map: Map<string, string>,
  key: string,
  fallback: boolean
) {
  const value = map.get(key);
  if (value === undefined) return fallback;
  return value === 'true';
}

function readNumber(
  map: Map<string, string>,
  key: string,
  fallback: number
) {
  const value = map.get(key);
  if (value === undefined) return fallback;

  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function preferencesFromRows(
  rows: { key: string; value: string }[]
): SecurityPreferences {
  const map = new Map(rows.map((row) => [row.key, row.value]));

  return {
    appLockEnabled: readBoolean(
      map,
      'security_app_lock_enabled',
      defaultSecurityPreferences.appLockEnabled
    ),
    biometricUnlockEnabled: readBoolean(
      map,
      'security_biometric_unlock_enabled',
      defaultSecurityPreferences.biometricUnlockEnabled
    ),
    hideBalancesEnabled: readBoolean(
      map,
      'security_hide_balances_enabled',
      defaultSecurityPreferences.hideBalancesEnabled
    ),
    autoLockSeconds: readNumber(
      map,
      'security_auto_lock_seconds',
      defaultSecurityPreferences.autoLockSeconds
    ),
  };
}

async function hashPin(pin: string, salt: string) {
  return Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    `${salt}:${pin}`
  );
}

async function checkStoredPin(pin: string) {
  const [storedHash, salt] = await Promise.all([
    SecureStore.getItemAsync(PIN_HASH_KEY),
    SecureStore.getItemAsync(PIN_SALT_KEY),
  ]);

  if (!storedHash || !salt) return false;

  const candidate = await hashPin(pin, salt);
  return candidate === storedHash;
}

export function SecurityProvider({
  children,
}: PropsWithChildren) {
  const db = useSQLiteContext();

  const [preferences, setPreferences] =
    useState<SecurityPreferences>(
      defaultSecurityPreferences
    );
  const [loading, setLoading] = useState(true);
  const [locked, setLocked] = useState(false);
  const [privacyShieldVisible, setPrivacyShieldVisible] =
    useState(false);
  const [pinConfigured, setPinConfigured] = useState(false);
  const [biometricAvailable, setBiometricAvailable] =
    useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] =
    useState<number | null>(null);

  const backgroundedAtRef = useRef<number | null>(null);
  const preferencesRef = useRef(preferences);

  useEffect(() => {
    preferencesRef.current = preferences;
  }, [preferences]);

  const savePreferences = useCallback(
    async (next: SecurityPreferences) => {
      const pairs: [string, string][] = [
        [
          'security_app_lock_enabled',
          String(next.appLockEnabled),
        ],
        [
          'security_biometric_unlock_enabled',
          String(next.biometricUnlockEnabled),
        ],
        [
          'security_hide_balances_enabled',
          String(next.hideBalancesEnabled),
        ],
        [
          'security_auto_lock_seconds',
          String(next.autoLockSeconds),
        ],
      ];

      await db.withTransactionAsync(async () => {
        for (const [key, value] of pairs) {
          await db.runAsync(
            `INSERT INTO app_settings (key, value)
             VALUES (?, ?)
             ON CONFLICT(key)
             DO UPDATE SET value = excluded.value`,
            key,
            value
          );
        }
      });
    },
    [db]
  );

  const updatePreferences = useCallback(
    async (
      updates: Partial<SecurityPreferences>
    ) => {
      const next = {
        ...preferencesRef.current,
        ...updates,
      };

      if (!next.appLockEnabled) {
        next.biometricUnlockEnabled = false;
      }

      setPreferences(next);
      preferencesRef.current = next;
      setCurrencyPrivacyMask(next.hideBalancesEnabled);
      await savePreferences(next);
    },
    [savePreferences]
  );

  const setupPin = useCallback(
    async (pin: string) => {
      const salt = Crypto.randomUUID();
      const digest = await hashPin(pin, salt);

      await Promise.all([
        SecureStore.setItemAsync(PIN_SALT_KEY, salt),
        SecureStore.setItemAsync(PIN_HASH_KEY, digest),
      ]);

      setPinConfigured(true);
      setLocked(false);
      setFailedAttempts(0);
      setLockoutUntil(null);

      await updatePreferences({
        appLockEnabled: true,
      });
    },
    [updatePreferences]
  );

  const verifyPin = useCallback(
    async (pin: string): Promise<PinVerificationResult> => {
      const now = Date.now();

      if (
        lockoutUntil !== null &&
        now < lockoutUntil
      ) {
        return {
          success: false,
          reason: 'locked-out',
          lockoutUntil,
        };
      }

      const configured = await SecureStore.getItemAsync(
        PIN_HASH_KEY
      );

      if (!configured) {
        return {
          success: false,
          reason: 'not-configured',
        };
      }

      const valid = await checkStoredPin(pin);

      if (valid) {
        setLocked(false);
        setFailedAttempts(0);
        setLockoutUntil(null);
        return { success: true };
      }

      const nextAttempts = failedAttempts + 1;

      if (nextAttempts >= 5) {
        const nextLockout = Date.now() + 30_000;
        setFailedAttempts(0);
        setLockoutUntil(nextLockout);

        return {
          success: false,
          reason: 'locked-out',
          lockoutUntil: nextLockout,
        };
      }

      setFailedAttempts(nextAttempts);

      return {
        success: false,
        reason: 'invalid',
      };
    },
    [failedAttempts, lockoutUntil]
  );

  const changePin = useCallback(
    async (
      currentPin: string,
      newPin: string
    ) => {
      const valid = await checkStoredPin(currentPin);

      if (!valid) return false;

      const salt = Crypto.randomUUID();
      const digest = await hashPin(newPin, salt);

      await Promise.all([
        SecureStore.setItemAsync(PIN_SALT_KEY, salt),
        SecureStore.setItemAsync(PIN_HASH_KEY, digest),
      ]);

      setFailedAttempts(0);
      setLockoutUntil(null);
      return true;
    },
    []
  );

  const disableAppLock = useCallback(
    async (pin: string) => {
      const valid = await checkStoredPin(pin);

      if (!valid) return false;

      await Promise.all([
        SecureStore.deleteItemAsync(PIN_SALT_KEY),
        SecureStore.deleteItemAsync(PIN_HASH_KEY),
      ]);

      setPinConfigured(false);
      setLocked(false);
      setFailedAttempts(0);
      setLockoutUntil(null);

      await updatePreferences({
        appLockEnabled: false,
        biometricUnlockEnabled: false,
      });

      return true;
    },
    [updatePreferences]
  );

  const unlockWithBiometrics = useCallback(async () => {
    if (!biometricAvailable) return false;

    try {
      const result =
        await LocalAuthentication.authenticateAsync({
          promptMessage: 'Unlock SaveTrack',
          cancelLabel: 'Cancel',
          fallbackLabel: 'Use device passcode',
          disableDeviceFallback: false,
        });

      if (result.success) {
        setLocked(false);
        setFailedAttempts(0);
        setLockoutUntil(null);
        return true;
      }

      return false;
    } catch (error) {
      console.error(
        'Biometric authentication failed:',
        error
      );
      return false;
    }
  }, [biometricAvailable]);

  const lockNow = useCallback(() => {
    if (
      preferencesRef.current.appLockEnabled &&
      pinConfigured
    ) {
      setLocked(true);
    }
  }, [pinConfigured]);

  useEffect(() => {
    let mounted = true;

    async function initialize() {
      setLoading(true);

      try {
        const [
          rows,
          storedPin,
          hardware,
          enrolled,
        ] = await Promise.all([
          db.getAllAsync<{ key: string; value: string }>(
            `SELECT key, value
             FROM app_settings
             WHERE key IN (${settingKeys
               .map(() => '?')
               .join(',')})`,
            ...settingKeys
          ),
          SecureStore.getItemAsync(PIN_HASH_KEY),
          LocalAuthentication.hasHardwareAsync(),
          LocalAuthentication.isEnrolledAsync(),
        ]);

        if (!mounted) return;

        const storedPreferences =
          preferencesFromRows(rows);
        const hasPin = Boolean(storedPin);

        if (!hasPin) {
          storedPreferences.appLockEnabled = false;
          storedPreferences.biometricUnlockEnabled = false;
        }

        setPreferences(storedPreferences);
        preferencesRef.current = storedPreferences;
        setCurrencyPrivacyMask(
          storedPreferences.hideBalancesEnabled
        );

        setPinConfigured(hasPin);
        setBiometricAvailable(hardware && enrolled);
        setLocked(
          storedPreferences.appLockEnabled && hasPin
        );
      } catch (error) {
        console.error(
          'Failed to initialize security settings:',
          error
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    initialize();

    return () => {
      mounted = false;
    };
  }, [db]);

  useEffect(() => {
    function onAppStateChange(nextState: AppStateStatus) {
      const current = preferencesRef.current;

      if (
        nextState === 'inactive' ||
        nextState === 'background'
      ) {
        setPrivacyShieldVisible(true);

        if (backgroundedAtRef.current === null) {
          backgroundedAtRef.current = Date.now();
        }

        if (
          current.appLockEnabled &&
          current.autoLockSeconds === 0 &&
          pinConfigured
        ) {
          setLocked(true);
        }

        return;
      }

      if (nextState === 'active') {
        const leftAt = backgroundedAtRef.current;
        backgroundedAtRef.current = null;

        if (
          current.appLockEnabled &&
          pinConfigured &&
          leftAt !== null &&
          Date.now() - leftAt >=
            current.autoLockSeconds * 1000
        ) {
          setLocked(true);
        }

        setPrivacyShieldVisible(false);
      }
    }

    const subscription =
      AppState.addEventListener(
        'change',
        onAppStateChange
      );

    return () => {
      subscription.remove();
    };
  }, [pinConfigured]);

  const value = useMemo<SecurityContextValue>(
    () => ({
      preferences,
      loading,
      locked,
      privacyShieldVisible,
      pinConfigured,
      biometricAvailable,
      failedAttempts,
      lockoutUntil,
      setupPin,
      verifyPin,
      changePin,
      disableAppLock,
      updatePreferences,
      unlockWithBiometrics,
      lockNow,
    }),
    [
      preferences,
      loading,
      locked,
      privacyShieldVisible,
      pinConfigured,
      biometricAvailable,
      failedAttempts,
      lockoutUntil,
      setupPin,
      verifyPin,
      changePin,
      disableAppLock,
      updatePreferences,
      unlockWithBiometrics,
      lockNow,
    ]
  );

  return (
    <SecurityContext.Provider value={value}>
      {children}
    </SecurityContext.Provider>
  );
}

export function useSecurity() {
  const context = useContext(SecurityContext);

  if (!context) {
    throw new Error(
      'useSecurity must be used inside SecurityProvider.'
    );
  }

  return context;
}
