import { Ionicons } from '@expo/vector-icons';
import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  AccessibilityInfo,
  Animated,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Colors } from '../constants/theme';
import {
  errorHaptic,
  successHaptic,
  warningHaptic,
} from '../utils/haptics';

export type ToastTone = 'success' | 'error' | 'warning' | 'info';

type ToastOptions = {
  title: string;
  message?: string;
  tone?: ToastTone;
  durationMs?: number;
};

type ToastContextValue = {
  showToast: (options: ToastOptions) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const tones = {
  success: {
    icon: 'checkmark-circle-outline' as const,
    color: Colors.success,
    background: Colors.successSoft,
  },
  error: {
    icon: 'close-circle-outline' as const,
    color: Colors.danger,
    background: Colors.dangerSoft,
  },
  warning: {
    icon: 'warning-outline' as const,
    color: Colors.warning,
    background: Colors.warningSoft,
  },
  info: {
    icon: 'information-circle-outline' as const,
    color: Colors.primary,
    background: Colors.primarySoft,
  },
};

export function ToastProvider({ children }: PropsWithChildren) {
  const [toast, setToast] = useState<ToastOptions | null>(null);
  const animation = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hideToast = useCallback(() => {
    Animated.timing(animation, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => setToast(null));
  }, [animation]);

  const showToast = useCallback(
    (options: ToastOptions) => {
      const tone = options.tone ?? 'info';

      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      setToast({
        ...options,
        tone,
      });

      animation.stopAnimation();
      animation.setValue(0);

      Animated.timing(animation, {
        toValue: 1,
        duration: 140,
        useNativeDriver: true,
      }).start();

      AccessibilityInfo.announceForAccessibility(
        [options.title, options.message].filter(Boolean).join('. ')
      );

      if (tone === 'success') {
        void successHaptic();
      } else if (tone === 'error') {
        void errorHaptic();
      } else if (tone === 'warning') {
        void warningHaptic();
      }

      timerRef.current = setTimeout(
        hideToast,
        options.durationMs ?? 2400
      );
    },
    [animation, hideToast]
  );

  const value = useMemo(
    () => ({
      showToast,
    }),
    [showToast]
  );

  const tone = toast ? tones[toast.tone ?? 'info'] : tones.info;

  return (
    <ToastContext.Provider value={value}>
      {children}

      {toast ? (
        <Animated.View
          pointerEvents="none"
          accessibilityRole="alert"
          style={[
            styles.viewport,
            {
              opacity: animation,
            },
          ]}
        >
          <View style={[styles.toast, { backgroundColor: tone.background }]}>
            <View style={styles.icon}>
              <Ionicons name={tone.icon} size={20} color={tone.color} />
            </View>

            <View style={styles.textWrap}>
              <Text style={[styles.title, { color: tone.color }]}>
                {toast.title}
              </Text>

              {toast.message ? (
                <Text style={styles.message}>{toast.message}</Text>
              ) : null}
            </View>
          </View>
        </Animated.View>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error('useToast must be used inside ToastProvider.');
  }

  return context;
}

const styles = StyleSheet.create({
  viewport: {
    position: 'absolute',
    zIndex: 20000,
    top: 58,
    left: 18,
    right: 18,
    alignItems: 'center',
  },
  toast: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 18,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    shadowColor: '#000000',
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  icon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: {
    flex: 1,
    marginLeft: 10,
  },
  title: {
    fontSize: 12,
    fontWeight: '900',
  },
  message: {
    color: Colors.textSecondary,
    fontSize: 10,
    lineHeight: 15,
    marginTop: 3,
  },
});
