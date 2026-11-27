// What the server needs to tie a website sign-up or purchase to the Meta pixel visit (Conversions API): the
// pixel's own _fbp / _fbc cookies. Sent in the request body of sign-up and checkout calls. Nothing in the app:
// the Android app reports through the server as an app, with no browser cookies.
const cookie = (name) => {
  try {
    const m = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
    return m ? decodeURIComponent(m[1]) : '';
  } catch (_) {
    return '';
  }
};

const isNativeApp = () => Boolean(window.Capacitor?.isNativePlatform?.());

export const metaBrowser = () => (isNativeApp() ? {} : { fbp: cookie('_fbp'), fbc: cookie('_fbc') });

// The Play Store install referrer the Android app read at first launch (MainActivity puts it on window)
export const installReferrer = () => (typeof window.androidInstallReferrer === 'string' ? window.androidInstallReferrer.slice(0, 500) : null);
