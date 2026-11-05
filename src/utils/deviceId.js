// Identifies this install's device to the backend, so a guest who reinstalls the app
// keeps the same free trial. On Android this is the Android ID from cordova-plugin-device,
// which survives reinstalls; on the web it is a random id kept in localStorage.

const WEB_KEY = 'hy_device_id_v1';

const readNativeId = () => {
  try {
    const uuid = window.device?.uuid;
    return uuid ? `android:${uuid}` : '';
  } catch (_) {
    return '';
  }
};

const readWebId = () => {
  try {
    let id = localStorage.getItem(WEB_KEY);
    if (!id) {
      id = `web:${crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36)}`;
      localStorage.setItem(WEB_KEY, id);
    }
    return id;
  } catch (_) {
    return '';
  }
};

const isNative = () => Boolean(window.Capacitor?.isNativePlatform?.());

export function getDeviceId() {
  if (isNative()) return readNativeId();
  return readWebId();
}

// window.device is only filled in after Cordova's deviceready event
export function whenDeviceIdReady(timeoutMs = 3000) {
  if (!isNative() || readNativeId()) return Promise.resolve(getDeviceId());
  return new Promise((resolve) => {
    const done = () => resolve(getDeviceId());
    document.addEventListener('deviceready', done, { once: true });
    setTimeout(done, timeoutMs);
  });
}
