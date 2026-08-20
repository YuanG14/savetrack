import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import type {
  NotificationPermissionState,
  NotificationPreferences,
} from '../types/notification';

export const NOTIFICATION_CHANNEL_ID = 'savetrack-reminders';

export function permissionStateFromSettings(
  settings: Notifications.NotificationPermissionsStatus
): NotificationPermissionState {
  const provisional =
    settings.ios?.status ===
    Notifications.IosAuthorizationStatus.PROVISIONAL;

  if (settings.granted || provisional) return 'granted';

  if (settings.status === Notifications.PermissionStatus.DENIED) {
    return 'denied';
  }

  return 'undetermined';
}

export async function prepareNotificationChannel() {
  if (Platform.OS !== 'android') return;

  await Notifications.setNotificationChannelAsync(
    NOTIFICATION_CHANNEL_ID,
    {
      name: 'SaveTrack reminders',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 200],
    }
  );
}

export function buildDateAtLocalTime(
  dateString: string,
  hour: number,
  minute = 0,
  daysOffset = 0
): Date | null {
  const [year, month, day] = dateString.split('-').map(Number);

  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    !Number.isInteger(day)
  ) {
    return null;
  }

  const date = new Date(
    year,
    month - 1,
    day + daysOffset,
    hour,
    minute,
    0,
    0
  );

  if (Number.isNaN(date.getTime())) return null;

  return date;
}

export function serializeNotificationPreferences(
  preferences: NotificationPreferences
): Record<string, string> {
  return {
    notifications_enabled: String(preferences.enabled),
    notification_daily_enabled: String(
      preferences.dailyCheckInEnabled
    ),
    notification_daily_hour: String(preferences.dailyHour),
    notification_weekly_savings_enabled: String(
      preferences.weeklySavingsEnabled
    ),
    notification_weekly_day: String(preferences.weeklyDay),
    notification_commitments_enabled: String(
      preferences.commitmentRemindersEnabled
    ),
    notification_income_enabled: String(
      preferences.incomeReminderEnabled
    ),
    notification_budget_alerts_enabled: String(
      preferences.budgetAlertsEnabled
    ),
  };
}
