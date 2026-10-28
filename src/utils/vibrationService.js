/**
 * Unified Haptics and Vibration Service
 * Works seamlessly on Capacitor (iOS/Android) and Web / Mobile Browsers (navigator.vibrate).
 */

import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

// Local cache for vibration preference
const STORAGE_KEY = 'hoshiyaar_vibration_enabled';

export const isVibrationEnabled = () => {
  try {
    const val = localStorage.getItem(STORAGE_KEY);
    return val !== 'false'; // default true
  } catch (_) {
    return true;
  }
};

export const setVibrationEnabled = (enabled) => {
  try {
    localStorage.setItem(STORAGE_KEY, enabled ? 'true' : 'false');
  } catch (_) {}
};

/**
 * Light tap / scrub / selection vibration (~10ms)
 */
export const vibrateLight = async () => {
  if (!isVibrationEnabled()) return;
  try {
    await Haptics.impact({ style: ImpactStyle.Light });
  } catch (_) {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(12);
    }
  }
};

/**
 * Medium tap / button press (~25ms)
 */
export const vibrateMedium = async () => {
  if (!isVibrationEnabled()) return;
  try {
    await Haptics.impact({ style: ImpactStyle.Medium });
  } catch (_) {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(25);
    }
  }
};

/**
 * Success notification vibration (Correct answer, Level Complete)
 */
export const vibrateSuccess = async () => {
  if (!isVibrationEnabled()) return;
  try {
    await Haptics.notification({ type: NotificationType.Success });
  } catch (_) {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([20, 40, 30]);
    }
  }
};

/**
 * Error / Warning vibration (Wrong answer, Validation block)
 */
export const vibrateError = async () => {
  if (!isVibrationEnabled()) return;
  try {
    await Haptics.notification({ type: NotificationType.Error });
  } catch (_) {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([40, 60, 40]);
    }
  }
};

export default {
  isVibrationEnabled,
  setVibrationEnabled,
  vibrateLight,
  vibrateMedium,
  vibrateSuccess,
  vibrateError
};
