import React from 'react';
import WelcomeShell from './WelcomeShell.jsx';

// What Android phone browsers see on the website: the app's welcome screen (same artwork, WhatsApp help and
// tagline), with one button that opens the app on Google Play instead of "Start my adventure" and "Log in".
const PLAY_STORE = 'https://play.google.com/store/apps/details?id=com.hoshiyaarlearning.app';

const AndroidForcedInstall = () => (
  <WelcomeShell>
    <a
      href={PLAY_STORE}
      onClick={() => { try { window.hyTrack?.('download_app_click', { from: 'android_web' }); } catch (_) {} }}
      style={{ height: 'clamp(50px, 7.4dvh, 58px)', fontSize: 'clamp(20px, 3.1dvh, 23px)' }}
      className="w-full shrink-0 rounded-full bg-gradient-to-b from-[#2F6BFF] to-[#1743D8] text-white font-dialogue font-bold tracking-tight shadow-[0_6px_0_0_#0F2E9E,0_14px_28px_rgba(23,67,216,0.35)] active:translate-y-[3px] active:shadow-[0_3px_0_0_#0F2E9E,0_8px_18px_rgba(23,67,216,0.3)] transition-all flex items-center justify-center gap-3 no-underline"
    >
      <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor" aria-hidden="true">
        <path d="M12 3a1 1 0 0 1 1 1v9.6l3.3-3.3a1 1 0 1 1 1.4 1.4l-5 5a1 1 0 0 1-1.4 0l-5-5a1 1 0 1 1 1.4-1.4l3.3 3.3V4a1 1 0 0 1 1-1zM5 19a1 1 0 0 1 1-1h12a1 1 0 1 1 0 2H6a1 1 0 0 1-1-1z" />
      </svg>
      <span>Download the app</span>
    </a>
    <p className="shrink-0 font-dialogue text-[14.5px] font-medium text-slate-600 text-center">
      Get it free on Google Play
    </p>
  </WelcomeShell>
);

export default AndroidForcedInstall;
