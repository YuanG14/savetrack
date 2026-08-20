import * as Notifications from 'expo-notifications';
import { router, type Href } from 'expo-router';
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
import { useSQLiteContext } from 'expo-sqlite';

import type {
  NotificationPermissionState,
  NotificationPreferences,
} from '../types/notification';
import {
  defaultNotificationPreferences,
} from '../types/notification';
import { useBudgets } from './BudgetContext';
import { useSafeSpend } from './SafeSpendContext';
import { useTransactions } from './TransactionContext';
import {
  calculateBudgetProgress,
} from '../utils/budget';
import {
  buildDateAtLocalTime,
  NOTIFICATION_CHANNEL_ID,
  permissionStateFromSettings,
  prepareNotificationChannel,
  serializeNotificationPreferences,
} from '../utils/notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

type NotificationContextValue = {
  preferences: NotificationPreferences;
  permissionState: NotificationPermissionState;
  loading: boolean;
  scheduledCount: number;
  requestPermission: () => Promise<boolean>;
  updatePreferences: (
    updates: Partial<NotificationPreferences>
  ) => Promise<boolean>;
  refreshScheduledCount: () => Promise<void>;
  sendTestNotification: () => Promise<boolean>;
};

const NotificationContext =
  createContext<NotificationContextValue | null>(null);

const settingKeys = [
  'notifications_enabled',
  'notification_daily_enabled',
  'notification_daily_hour',
  'notification_weekly_savings_enabled',
  'notification_weekly_day',
  'notification_commitments_enabled',
  'notification_income_enabled',
  'notification_budget_alerts_enabled',
];

function readBoolean(
  map: Map<string, string>,
  key: string,
  fallback: boolean
): boolean {
  const value = map.get(key);
  if (value === undefined) return fallback;
  return value === 'true';
}

function readNumber(
  map: Map<string, string>,
  key: string,
  fallback: number
): number {
  const value = map.get(key);
  if (value === undefined) return fallback;

  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function preferencesFromSettings(
  rows: { key: string; value: string }[]
): NotificationPreferences {
  const map = new Map(rows.map((row) => [row.key, row.value]));

  return {
    enabled: readBoolean(
      map,
      'notifications_enabled',
      defaultNotificationPreferences.enabled
    ),
    dailyCheckInEnabled: readBoolean(
      map,
      'notification_daily_enabled',
      defaultNotificationPreferences.dailyCheckInEnabled
    ),
    dailyHour: readNumber(
      map,
      'notification_daily_hour',
      defaultNotificationPreferences.dailyHour
    ),
    weeklySavingsEnabled: readBoolean(
      map,
      'notification_weekly_savings_enabled',
      defaultNotificationPreferences.weeklySavingsEnabled
    ),
    weeklyDay: readNumber(
      map,
      'notification_weekly_day',
      defaultNotificationPreferences.weeklyDay
    ),
    commitmentRemindersEnabled: readBoolean(
      map,
      'notification_commitments_enabled',
      defaultNotificationPreferences.commitmentRemindersEnabled
    ),
    incomeReminderEnabled: readBoolean(
      map,
      'notification_income_enabled',
      defaultNotificationPreferences.incomeReminderEnabled
    ),
    budgetAlertsEnabled: readBoolean(
      map,
      'notification_budget_alerts_enabled',
      defaultNotificationPreferences.budgetAlertsEnabled
    ),
  };
}

export function NotificationProvider({ children }: PropsWithChildren) {
  const db = useSQLiteContext();
  const { commitments, nextIncomeDate } = useSafeSpend();
  const { budgets } = useBudgets();
  const { transactions } = useTransactions();

  const [preferences, setPreferences] =
    useState<NotificationPreferences>(
      defaultNotificationPreferences
    );
  const [permissionState, setPermissionState] =
    useState<NotificationPermissionState>('undetermined');
  const [scheduledCount, setScheduledCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const initializedRef = useRef(false);
  const budgetCheckRunningRef = useRef(false);

  const refreshScheduledCount = useCallback(async () => {
    const scheduled =
      await Notifications.getAllScheduledNotificationsAsync();
    setScheduledCount(scheduled.length);
  }, []);

  const savePreferences = useCallback(
    async (next: NotificationPreferences) => {
      const values = serializeNotificationPreferences(next);

      await db.withTransactionAsync(async () => {
        for (const [key, value] of Object.entries(values)) {
          await db.runAsync(
            `INSERT INTO app_settings (key, value)
             VALUES (?, ?)
             ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
            key,
            value
          );
        }
      });
    },
    [db]
  );

  const requestPermission = useCallback(async () => {
    await prepareNotificationChannel();

    const existing = await Notifications.getPermissionsAsync();
    let state = permissionStateFromSettings(existing);

    if (state !== 'granted') {
      const requested =
        await Notifications.requestPermissionsAsync({
          ios: {
            allowAlert: true,
            allowBadge: false,
            allowSound: true,
          },
        });

      state = permissionStateFromSettings(requested);
    }

    setPermissionState(state);
    return state === 'granted';
  }, []);

  const rescheduleReminders = useCallback(
    async (nextPreferences: NotificationPreferences) => {
      await Notifications.cancelAllScheduledNotificationsAsync();

      if (!nextPreferences.enabled) {
        await refreshScheduledCount();
        return;
      }

      const currentPermissions =
        await Notifications.getPermissionsAsync();

      if (
        permissionStateFromSettings(currentPermissions) !==
        'granted'
      ) {
        await refreshScheduledCount();
        return;
      }

      await prepareNotificationChannel();

      if (nextPreferences.dailyCheckInEnabled) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Quick money check-in',
            body:
              'Open SaveTrack and see what is safe to spend today.',
            data: {
              url: '/safe-to-spend',
              kind: 'daily-check-in',
            },
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DAILY,
            hour: nextPreferences.dailyHour,
            minute: 0,
            channelId: NOTIFICATION_CHANNEL_ID,
          },
        });
      }

      if (nextPreferences.weeklySavingsEnabled) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Savings check-in',
            body:
              'A small savings update today can move your goals forward.',
            data: {
              url: '/goals',
              kind: 'weekly-savings',
            },
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
            weekday: nextPreferences.weeklyDay,
            hour: 9,
            minute: 0,
            channelId: NOTIFICATION_CHANNEL_ID,
          },
        });
      }

      if (
        nextPreferences.incomeReminderEnabled &&
        nextIncomeDate
      ) {
        const reminderDate = buildDateAtLocalTime(
          nextIncomeDate,
          8
        );

        if (reminderDate && reminderDate.getTime() > Date.now()) {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: 'Income day',
              body:
                'Your planned income date is today. Update SaveTrack when the money arrives.',
              data: {
                url: '/safe-to-spend',
                kind: 'income-reminder',
              },
            },
            trigger: {
              type: Notifications.SchedulableTriggerInputTypes.DATE,
              date: reminderDate,
              channelId: NOTIFICATION_CHANNEL_ID,
            },
          });
        }
      }

      if (nextPreferences.commitmentRemindersEnabled) {
        for (const commitment of commitments) {
          let reminderDate = buildDateAtLocalTime(
            commitment.dueDate,
            9,
            0,
            -1
          );

          if (
            !reminderDate ||
            reminderDate.getTime() <= Date.now()
          ) {
            reminderDate = buildDateAtLocalTime(
              commitment.dueDate,
              9
            );
          }

          if (
            !reminderDate ||
            reminderDate.getTime() <= Date.now()
          ) {
            continue;
          }

          await Notifications.scheduleNotificationAsync({
            content: {
              title: `${commitment.name} is coming up`,
              body:
                'You already reserved money for this commitment in Safe-to-Spend.',
              data: {
                url: '/safe-to-spend',
                kind: 'commitment-reminder',
                commitmentId: commitment.id,
              },
            },
            trigger: {
              type: Notifications.SchedulableTriggerInputTypes.DATE,
              date: reminderDate,
              channelId: NOTIFICATION_CHANNEL_ID,
            },
          });
        }
      }

      await refreshScheduledCount();
    },
    [
      commitments,
      nextIncomeDate,
      refreshScheduledCount,
    ]
  );

  const updatePreferences = useCallback(
    async (
      updates: Partial<NotificationPreferences>
    ) => {
      let next = {
        ...preferences,
        ...updates,
      };

      if (next.enabled && permissionState !== 'granted') {
        const granted = await requestPermission();

        if (!granted) {
          next = {
            ...next,
            enabled: false,
          };
        }
      }

      setPreferences(next);
      await savePreferences(next);
      await rescheduleReminders(next);

      return next.enabled
        ? true
        : updates.enabled !== true;
    },
    [
      preferences,
      permissionState,
      requestPermission,
      savePreferences,
      rescheduleReminders,
    ]
  );

  const sendTestNotification = useCallback(async () => {
    const granted =
      permissionState === 'granted'
        ? true
        : await requestPermission();

    if (!granted) return false;

    await prepareNotificationChannel();

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'SaveTrack notifications are ready',
        body:
          'You will receive the reminders you choose in Notification Settings.',
        data: {
          url: '/notifications',
          kind: 'test',
        },
      },
      trigger: null,
    });

    return true;
  }, [permissionState, requestPermission]);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);

      try {
        const [rows, permissions] = await Promise.all([
          db.getAllAsync<{ key: string; value: string }>(
            `SELECT key, value
             FROM app_settings
             WHERE key IN (${settingKeys
               .map(() => '?')
               .join(',')})`,
            ...settingKeys
          ),
          Notifications.getPermissionsAsync(),
        ]);

        if (!mounted) return;

        const storedPreferences =
          preferencesFromSettings(rows);

        setPreferences(storedPreferences);
        setPermissionState(
          permissionStateFromSettings(permissions)
        );

        initializedRef.current = true;

        await rescheduleReminders(storedPreferences);
      } catch (error) {
        console.error(
          'Failed to initialize notifications:',
          error
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, [db]);

  useEffect(() => {
    if (!initializedRef.current) return;

    rescheduleReminders(preferences).catch((error) => {
      console.error(
        'Failed to refresh scheduled reminders:',
        error
      );
    });
  }, [
    commitments,
    nextIncomeDate,
    preferences,
    rescheduleReminders,
  ]);

  useEffect(() => {
    if (
      !initializedRef.current ||
      !preferences.enabled ||
      !preferences.budgetAlertsEnabled ||
      permissionState !== 'granted' ||
      budgetCheckRunningRef.current
    ) {
      return;
    }

    budgetCheckRunningRef.current = true;

    async function checkBudgetAlerts() {
      try {
        const progress = calculateBudgetProgress(
          budgets,
          transactions
        );

        const rows = await db.getAllAsync<{
          category: string;
          status: string;
        }>(
          `SELECT category, status
           FROM budget_notification_state`
        );

        const previousStates = new Map(
          rows.map((row) => [row.category, row.status])
        );

        for (const budget of progress) {
          const previous =
            previousStates.get(budget.category) ?? 'good';

          if (
            (budget.status === 'warning' ||
              budget.status === 'over') &&
            budget.status !== previous
          ) {
            await Notifications.scheduleNotificationAsync({
              content: {
                title:
                  budget.status === 'over'
                    ? `${budget.category} is over budget`
                    : `${budget.category} is near its budget limit`,
                body:
                  budget.status === 'over'
                    ? `You have used ${budget.percentUsed}% of this month's ${budget.category} budget.`
                    : `You have already used ${budget.percentUsed}% of this month's ${budget.category} budget.`,
                data: {
                  url: '/budgets',
                  kind: 'budget-alert',
                  category: budget.category,
                },
              },
              trigger: null,
            });
          }

          if (budget.status === 'good') {
            await db.runAsync(
              `DELETE FROM budget_notification_state
               WHERE category = ?`,
              budget.category
            );
          } else {
            await db.runAsync(
              `INSERT INTO budget_notification_state
                (category, status)
               VALUES (?, ?)
               ON CONFLICT(category)
               DO UPDATE SET status = excluded.status`,
              budget.category,
              budget.status
            );
          }
        }

        const liveCategories = new Set(
          progress.map((item) => item.category)
        );

        for (const row of rows) {
          if (!liveCategories.has(row.category)) {
            await db.runAsync(
              `DELETE FROM budget_notification_state
               WHERE category = ?`,
              row.category
            );
          }
        }
      } catch (error) {
        console.error(
          'Failed to check budget notifications:',
          error
        );
      } finally {
        budgetCheckRunningRef.current = false;
      }
    }

    checkBudgetAlerts();
  }, [
    budgets,
    transactions,
    db,
    preferences.enabled,
    preferences.budgetAlertsEnabled,
    permissionState,
  ]);

  useEffect(() => {
    function redirect(
      notification: Notifications.Notification
    ) {
      const url = notification.request.content.data?.url;

      if (typeof url === 'string') {
        router.push(url as Href);
      }
    }

    const response =
      Notifications.getLastNotificationResponse();

    if (response?.notification) {
      redirect(response.notification);
    }

    const subscription =
      Notifications.addNotificationResponseReceivedListener(
        (nextResponse) => {
          redirect(nextResponse.notification);
        }
      );

    return () => {
      subscription.remove();
    };
  }, []);

  const value = useMemo<NotificationContextValue>(
    () => ({
      preferences,
      permissionState,
      loading,
      scheduledCount,
      requestPermission,
      updatePreferences,
      refreshScheduledCount,
      sendTestNotification,
    }),
    [
      preferences,
      permissionState,
      loading,
      scheduledCount,
      requestPermission,
      updatePreferences,
      refreshScheduledCount,
      sendTestNotification,
    ]
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);

  if (!context) {
    throw new Error(
      'useNotifications must be used inside NotificationProvider.'
    );
  }

  return context;
}
