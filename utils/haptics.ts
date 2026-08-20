import * as Haptics from 'expo-haptics';

export async function selectionHaptic() {
  try {
    await Haptics.selectionAsync();
  } catch {
    // Haptics are optional polish and should never block an action.
  }
}

export async function successHaptic() {
  try {
    await Haptics.notificationAsync(
      Haptics.NotificationFeedbackType.Success
    );
  } catch {
    // Ignore unsupported or unavailable haptics.
  }
}

export async function warningHaptic() {
  try {
    await Haptics.notificationAsync(
      Haptics.NotificationFeedbackType.Warning
    );
  } catch {
    // Ignore unsupported or unavailable haptics.
  }
}

export async function errorHaptic() {
  try {
    await Haptics.notificationAsync(
      Haptics.NotificationFeedbackType.Error
    );
  } catch {
    // Ignore unsupported or unavailable haptics.
  }
}
