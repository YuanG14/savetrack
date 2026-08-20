export type NotificationPermissionState =
  | 'granted'
  | 'denied'
  | 'undetermined';

export type NotificationPreferences = {
  enabled: boolean;
  dailyCheckInEnabled: boolean;
  dailyHour: number;
  weeklySavingsEnabled: boolean;
  weeklyDay: number;
  commitmentRemindersEnabled: boolean;
  incomeReminderEnabled: boolean;
  budgetAlertsEnabled: boolean;
};

export const defaultNotificationPreferences: NotificationPreferences = {
  enabled: false,
  dailyCheckInEnabled: true,
  dailyHour: 20,
  weeklySavingsEnabled: true,
  weeklyDay: 1,
  commitmentRemindersEnabled: true,
  incomeReminderEnabled: true,
  budgetAlertsEnabled: true,
};
