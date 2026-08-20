import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { NotificationSettingRow } from '../components/notifications/NotificationSettingRow';
import { Colors } from '../constants/theme';
import { useNotifications } from '../contexts/NotificationContext';

const hourOptions = [
  { hour: 8, label: '8 AM' },
  { hour: 12, label: '12 PM' },
  { hour: 18, label: '6 PM' },
  { hour: 20, label: '8 PM' },
];

const weekDays = [
  { day: 1, label: 'Sun' },
  { day: 2, label: 'Mon' },
  { day: 3, label: 'Tue' },
  { day: 4, label: 'Wed' },
  { day: 5, label: 'Thu' },
  { day: 6, label: 'Fri' },
  { day: 7, label: 'Sat' },
];

export default function NotificationsScreen() {
  const router = useRouter();
  const {
    preferences,
    permissionState,
    loading,
    scheduledCount,
    requestPermission,
    updatePreferences,
    sendTestNotification,
  } = useNotifications();

  const [testing, setTesting] = useState(false);

  const notificationsAvailable =
    permissionState === 'granted';

  const toggleMaster = async (enabled: boolean) => {
    const success = await updatePreferences({ enabled });

    if (enabled && !success) {
      Alert.alert(
        'Notifications are off',
        'SaveTrack needs notification permission from iOS or Android before reminders can be enabled.'
      );
    }
  };

  const enablePermission = async () => {
    const granted = await requestPermission();

    if (granted) {
      await updatePreferences({ enabled: true });
    } else {
      Alert.alert(
        'Permission not granted',
        'You can allow SaveTrack notifications later from your phone settings.'
      );
    }
  };

  const testNotification = async () => {
    setTesting(true);

    try {
      const success = await sendTestNotification();

      if (!success) {
        Alert.alert(
          'Notifications are not allowed',
          'Enable notification permission first.'
        );
      }
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loading}>
          <ActivityIndicator color={Colors.primary} />
          <Text style={styles.loadingText}>
            Loading notification settings...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topBar}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={22} color={Colors.text} />
          </Pressable>

          <View style={styles.topText}>
            <Text style={styles.title}>Notifications</Text>
            <Text style={styles.subtitle}>
              Choose the reminders that are actually useful to you.
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.permissionCard,
            notificationsAvailable
              ? styles.permissionGranted
              : styles.permissionNeeded,
          ]}
        >
          <View
            style={[
              styles.permissionIcon,
              notificationsAvailable
                ? styles.permissionIconGranted
                : styles.permissionIconNeeded,
            ]}
          >
            <Ionicons
              name={
                notificationsAvailable
                  ? 'notifications-outline'
                  : 'notifications-off-outline'
              }
              size={24}
              color={
                notificationsAvailable
                  ? Colors.success
                  : Colors.warning
              }
            />
          </View>

          <View style={styles.permissionText}>
            <Text style={styles.permissionTitle}>
              {notificationsAvailable
                ? 'Notifications allowed'
                : 'Notification permission needed'}
            </Text>

            <Text style={styles.permissionDescription}>
              {notificationsAvailable
                ? `${scheduledCount} ${
                    scheduledCount === 1
                      ? 'reminder is'
                      : 'reminders are'
                  } currently scheduled.`
                : permissionState === 'denied'
                  ? 'Permission is currently disabled on this device.'
                  : 'Enable permission to receive local SaveTrack reminders.'}
            </Text>
          </View>

          {!notificationsAvailable ? (
            <Pressable
              style={styles.allowButton}
              onPress={enablePermission}
            >
              <Text style={styles.allowText}>Allow</Text>
            </Pressable>
          ) : null}
        </View>

        <View style={styles.masterCard}>
          <View style={styles.masterText}>
            <Text style={styles.masterTitle}>
              SaveTrack reminders
            </Text>
            <Text style={styles.masterDescription}>
              Master switch for all scheduled reminders and alerts.
            </Text>
          </View>

          <Pressable
            style={[
              styles.masterToggle,
              preferences.enabled && styles.masterToggleActive,
            ]}
            onPress={() =>
              toggleMaster(!preferences.enabled)
            }
          >
            <Text
              style={[
                styles.masterToggleText,
                preferences.enabled &&
                  styles.masterToggleTextActive,
              ]}
            >
              {preferences.enabled ? 'On' : 'Off'}
            </Text>
          </Pressable>
        </View>

        <Text style={styles.sectionTitle}>Money reminders</Text>

        <View style={styles.settingsCard}>
          <NotificationSettingRow
            icon="sunny-outline"
            title="Daily money check-in"
            description="A quick reminder to review what is safe to spend."
            value={preferences.dailyCheckInEnabled}
            disabled={!preferences.enabled}
            onValueChange={(value) =>
              updatePreferences({
                dailyCheckInEnabled: value,
              })
            }
          />

          {preferences.dailyCheckInEnabled &&
          preferences.enabled ? (
            <View style={styles.optionBlock}>
              <Text style={styles.optionLabel}>Check-in time</Text>

              <View style={styles.chips}>
                {hourOptions.map((item) => {
                  const active =
                    preferences.dailyHour === item.hour;

                  return (
                    <Pressable
                      key={item.hour}
                      style={[
                        styles.chip,
                        active && styles.chipActive,
                      ]}
                      onPress={() =>
                        updatePreferences({
                          dailyHour: item.hour,
                        })
                      }
                    >
                      <Text
                        style={[
                          styles.chipText,
                          active && styles.chipTextActive,
                        ]}
                      >
                        {item.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ) : null}

          <View style={styles.divider} />

          <NotificationSettingRow
            icon="flag-outline"
            title="Weekly savings reminder"
            description="A weekly nudge to add money toward your goals."
            value={preferences.weeklySavingsEnabled}
            disabled={!preferences.enabled}
            onValueChange={(value) =>
              updatePreferences({
                weeklySavingsEnabled: value,
              })
            }
          />

          {preferences.weeklySavingsEnabled &&
          preferences.enabled ? (
            <View style={styles.optionBlock}>
              <Text style={styles.optionLabel}>
                Reminder day · 9 AM
              </Text>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.dayChips}
              >
                {weekDays.map((item) => {
                  const active =
                    preferences.weeklyDay === item.day;

                  return (
                    <Pressable
                      key={item.day}
                      style={[
                        styles.dayChip,
                        active && styles.dayChipActive,
                      ]}
                      onPress={() =>
                        updatePreferences({
                          weeklyDay: item.day,
                        })
                      }
                    >
                      <Text
                        style={[
                          styles.dayChipText,
                          active && styles.dayChipTextActive,
                        ]}
                      >
                        {item.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          ) : null}
        </View>

        <Text style={styles.sectionTitle}>Smart alerts</Text>

        <View style={styles.settingsCard}>
          <NotificationSettingRow
            icon="calendar-outline"
            title="Upcoming commitments"
            description="Remind me before bills and planned commitments are due."
            value={preferences.commitmentRemindersEnabled}
            disabled={!preferences.enabled}
            onValueChange={(value) =>
              updatePreferences({
                commitmentRemindersEnabled: value,
              })
            }
          />

          <View style={styles.divider} />

          <NotificationSettingRow
            icon="cash-outline"
            title="Next income reminder"
            description="Remind me on the income date saved in Safe-to-Spend."
            value={preferences.incomeReminderEnabled}
            disabled={!preferences.enabled}
            onValueChange={(value) =>
              updatePreferences({
                incomeReminderEnabled: value,
              })
            }
          />

          <View style={styles.divider} />

          <NotificationSettingRow
            icon="pie-chart-outline"
            title="Budget warnings"
            description="Alert me when a category reaches 80% or goes over budget."
            value={preferences.budgetAlertsEnabled}
            disabled={!preferences.enabled}
            onValueChange={(value) =>
              updatePreferences({
                budgetAlertsEnabled: value,
              })
            }
          />
        </View>

        <Pressable
          style={[
            styles.testButton,
            !notificationsAvailable && styles.testButtonDisabled,
          ]}
          onPress={testNotification}
          disabled={testing}
        >
          {testing ? (
            <ActivityIndicator color={Colors.primary} />
          ) : (
            <>
              <Ionicons
                name="notifications-outline"
                size={19}
                color={Colors.primary}
              />
              <Text style={styles.testText}>
                Send test notification
              </Text>
            </>
          )}
        </Pressable>

        <View style={styles.infoCard}>
          <Ionicons
            name="phone-portrait-outline"
            size={19}
            color={Colors.primary}
          />
          <Text style={styles.infoText}>
            These are local device reminders. SaveTrack does not need a paid
            notification server for this phase.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 40,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  loadingText: {
    color: Colors.textSecondary,
    fontSize: 11,
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
  permissionCard: {
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  permissionGranted: {
    backgroundColor: Colors.successSoft,
  },
  permissionNeeded: {
    backgroundColor: Colors.warningSoft,
  },
  permissionIcon: {
    width: 44,
    height: 44,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  permissionIconGranted: {
    backgroundColor: '#FFFFFF',
  },
  permissionIconNeeded: {
    backgroundColor: '#FFFFFF',
  },
  permissionText: {
    flex: 1,
    marginLeft: 11,
    marginRight: 8,
  },
  permissionTitle: {
    color: Colors.text,
    fontSize: 12,
    fontWeight: '800',
  },
  permissionDescription: {
    color: Colors.textSecondary,
    fontSize: 9,
    lineHeight: 14,
    marginTop: 3,
  },
  allowButton: {
    backgroundColor: Colors.warning,
    minHeight: 35,
    borderRadius: 11,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  allowText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  masterCard: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 19,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 25,
  },
  masterText: {
    flex: 1,
    marginRight: 12,
  },
  masterTitle: {
    color: Colors.text,
    fontSize: 13,
    fontWeight: '800',
  },
  masterDescription: {
    color: Colors.textSecondary,
    fontSize: 9,
    lineHeight: 14,
    marginTop: 3,
  },
  masterToggle: {
    minWidth: 50,
    minHeight: 35,
    borderRadius: 999,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 11,
  },
  masterToggleActive: {
    backgroundColor: Colors.primary,
  },
  masterToggleText: {
    color: Colors.textSecondary,
    fontSize: 10,
    fontWeight: '900',
  },
  masterToggleTextActive: {
    color: '#FFFFFF',
  },
  sectionTitle: {
    color: Colors.text,
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 11,
  },
  settingsCard: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 20,
    paddingHorizontal: 15,
    marginBottom: 25,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginLeft: 51,
  },
  optionBlock: {
    backgroundColor: Colors.background,
    borderRadius: 15,
    padding: 12,
    marginBottom: 12,
  },
  optionLabel: {
    color: Colors.textSecondary,
    fontSize: 9,
    fontWeight: '800',
    marginBottom: 8,
  },
  chips: {
    flexDirection: 'row',
    gap: 7,
  },
  chip: {
    flex: 1,
    minHeight: 37,
    borderRadius: 11,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
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
  dayChips: {
    gap: 7,
  },
  dayChip: {
    minWidth: 47,
    minHeight: 37,
    borderRadius: 11,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  dayChipText: {
    color: Colors.textSecondary,
    fontSize: 9,
    fontWeight: '800',
  },
  dayChipTextActive: {
    color: '#FFFFFF',
  },
  testButton: {
    minHeight: 52,
    borderRadius: 16,
    backgroundColor: Colors.primarySoft,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  testButtonDisabled: {
    opacity: 0.55,
  },
  testText: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '800',
  },
  infoCard: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 17,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
    marginTop: 12,
  },
  infoText: {
    flex: 1,
    color: Colors.textSecondary,
    fontSize: 10,
    lineHeight: 16,
  },
});
