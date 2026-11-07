// Microphone permission for "say the word" questions (speech recognition). Hoshi's voice plays
// without it; the microphone is only for hearing the learner.
//
// Android shows the system pop-up only a couple of times: after the learner refuses twice it
// stops appearing, and the only way back is the app's page in phone Settings. So:
//   - a missed or refused pop-up is asked again when a lesson opens (15 min apart, 4 a day)
//   - once Android stops showing it, an in-app card offers "Open Settings" (once a day)
//   - turning the microphone off on the More page stops all reminders
// Browsers are left alone: Safari forgets the permission between visits, so asking at every
// lesson start meant a pop-up every lesson. There the question that needs it asks.
import { Capacitor } from '@capacitor/core';
import { SpeechRecognition as NativeSpeech } from '@capacitor-community/speech-recognition';

const KEY_REMINDERS_OFF = 'hy_mic_reminders_off';
const KEY_ASKS = 'hy_mic_asks'; // { day: 'YYYY-MM-DD', count, lastAt }
const KEY_SETTINGS_NUDGE = 'hy_mic_settings_nudge_day';
const ASK_GAP_MS = 15 * 60 * 1000;
const MAX_ASKS_PER_DAY = 4;

const isNative = () => Capacitor.isNativePlatform() && Capacitor.isPluginAvailable('SpeechRecognition');
const today = () => new Date().toISOString().slice(0, 10);
const read = (k, fallback) => { try { const v = localStorage.getItem(k); return v == null ? fallback : JSON.parse(v); } catch (_) { return fallback; } };
const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (_) {} };

export const micRemindersOff = () => read(KEY_REMINDERS_OFF, false) === true;
export const setMicRemindersOff = (off) => write(KEY_REMINDERS_OFF, Boolean(off));

/**
 * 'granted' | 'prompt' (can still show the pop-up) | 'blocked' (only Settings can allow it)
 * | 'unsupported' (no microphone API here)
 */
export async function getMicStatus() {
  try {
    if (isNative()) {
      const { speechRecognition } = await NativeSpeech.checkPermissions();
      if (speechRecognition === 'granted') return 'granted';
      // After a refusal Android reports 'prompt-with-rationale' while it will still ask; plain
      // 'denied' means the pop-up won't appear any more
      if (speechRecognition === 'denied') return 'blocked';
      return 'prompt';
    }
    if (navigator.permissions?.query) {
      const res = await navigator.permissions.query({ name: 'microphone' });
      return res.state === 'granted' ? 'granted' : res.state === 'denied' ? 'blocked' : 'prompt';
    }
    return navigator.mediaDevices?.getUserMedia ? 'prompt' : 'unsupported';
  } catch (_) {
    return navigator.mediaDevices?.getUserMedia ? 'prompt' : 'unsupported';
  }
}

/** Shows the system pop-up. Resolves with the status afterwards. */
export async function requestMic() {
  try {
    if (isNative()) {
      const { speechRecognition } = await NativeSpeech.requestPermissions();
      if (speechRecognition === 'granted') return 'granted';
      return (await getMicStatus());
    }
    if (navigator.mediaDevices?.getUserMedia) {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(t => t.stop());
      return 'granted';
    }
  } catch (_) {}
  return getMicStatus();
}

/** Opens this app's page in phone Settings (Android app), where Microphone can be allowed */
export function openAppSettings() {
  try {
    if (window.NativeSettings?.openAppSettings) { window.NativeSettings.openAppSettings(); return true; }
  } catch (_) {}
  return false;
}

/**
 * Called when a lesson opens. Shows the system pop-up again if it was missed or refused, within
 * the limits above. Returns 'show-settings-card' when Android no longer shows the pop-up and
 * it's time for the once-a-day "Open Settings" card, otherwise null.
 */
export async function remindMicIfNeeded() {
  if (!isNative() || micRemindersOff()) return null;
  const status = await getMicStatus();
  if (status === 'granted' || status === 'unsupported') return null;

  if (status === 'blocked') {
    if (read(KEY_SETTINGS_NUDGE, '') === today()) return null;
    write(KEY_SETTINGS_NUDGE, today());
    return 'show-settings-card';
  }

  const asks = read(KEY_ASKS, { day: '', count: 0, lastAt: 0 });
  const fresh = asks.day === today() ? asks : { day: today(), count: 0, lastAt: 0 };
  if (fresh.count >= MAX_ASKS_PER_DAY || Date.now() - fresh.lastAt < ASK_GAP_MS) return null;
  write(KEY_ASKS, { day: fresh.day, count: fresh.count + 1, lastAt: Date.now() });
  await requestMic();
  return null;
}
