export type SecurityPreferences = {
  appLockEnabled: boolean;
  biometricUnlockEnabled: boolean;
  hideBalancesEnabled: boolean;
  autoLockSeconds: number;
};

export const defaultSecurityPreferences: SecurityPreferences = {
  appLockEnabled: false,
  biometricUnlockEnabled: false,
  hideBalancesEnabled: false,
  autoLockSeconds: 0,
};

export type PinVerificationResult =
  | { success: true }
  | {
      success: false;
      reason: 'invalid' | 'locked-out' | 'not-configured';
      lockoutUntil?: number;
    };
