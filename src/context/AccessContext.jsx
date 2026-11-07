import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { App as CapacitorApp } from '@capacitor/app';
import { useAuth } from './AuthContext.jsx';
import paymentService from '../services/paymentService.js';
import { recoverPlayPurchases } from '../services/billingService.js';
import { isUserAdmin } from '../utils/adminCheck.js';

// Shares the learner's trial / pass status (from /api/payments/access) across the app.
// The countdown runs on server time: we keep the gap between the server clock and the
// device clock, so changing the phone's time does not change the trial.

const AccessContext = createContext(null);

// Trial test view, for checking the trial and paywall screens without waiting 48 hours.
// Admin accounts get a switch for it (More tab and Pro page); in dev builds ?trial=running,
// ?trial=ended and ?trial=off also work. It only changes what this device shows: the server
// still decides what lessons can actually be opened.
const TEST_VIEW_KEY = 'hy_trial_test_view';
const TEST_START_KEY = 'hy_trial_test_start';

const readTestView = (allowed) => {
  try {
    if (import.meta.env.DEV) {
      const param = new URLSearchParams(window.location.search).get('trial');
      if (param === 'running' || param === 'ended' || param === 'pro') saveTestView(param);
      if (param === 'off') saveTestView('');
    }
    if (!allowed) return '';
    return localStorage.getItem(TEST_VIEW_KEY) || '';
  } catch (_) {
    return '';
  }
};

const saveTestView = (view) => {
  try {
    if (view) {
      localStorage.setItem(TEST_VIEW_KEY, view);
      // A fresh 48 hours each time "running" is switched on, starting a few minutes in
      if (view === 'running') localStorage.setItem(TEST_START_KEY, String(Date.now() - 6 * 60000));
    } else {
      localStorage.removeItem(TEST_VIEW_KEY);
      localStorage.removeItem(TEST_START_KEY);
    }
  } catch (_) {}
};

const testAccess = (view, real) => {
  const base = { trialHours: 48, trialLessonLimit: 7, lessonLimit: 7, isGuest: false, hasPass: false, playedModuleIds: [], testView: true };
  if (view === 'pro') {
    // An admin who really bought the pass sees their real end date; otherwise a fresh 180-day sample
    const realEnd = real?.passExpiresAt ? new Date(real.passExpiresAt) : null;
    const days = real?.plan?.durationDays || 180;
    return {
      ...base, state: 'pass', locked: false, hasPass: true, plan: real?.plan,
      passExpiresAt: realEnd || new Date(Date.now() + days * 86400000), passSource: real?.passSource || ''
    };
  }
  if (view === 'ended') {
    return { ...base, state: 'trial_ended', locked: true, trialEndReason: 'time', lessonsUsed: 7, lessonsLeft: 0 };
  }
  let start = Date.now() - 6 * 60000;
  try { start = Number(localStorage.getItem(TEST_START_KEY)) || start; } catch (_) {}
  return {
    ...base, state: 'trial_active', locked: false, lessonsUsed: 2, lessonsLeft: 5,
    trialStartedAt: new Date(start), trialEndsAt: new Date(start + 48 * 3600000)
  };
};

export const useAccess = () => useContext(AccessContext) || {
  access: null, loading: false, refresh: async () => null, now: Date.now(), serverOffset: 0, setAccess: () => {},
  testView: '', setTestView: () => {}, canUseTestView: false
};

export const AccessProvider = ({ children }) => {
  const { user } = useAuth();
  const [access, setAccessState] = useState(null);
  const [loading, setLoading] = useState(false);
  const [now, setNow] = useState(Date.now());
  const offsetRef = useRef(0);
  // Server clock minus device clock, for live countdowns (see hooks/useServerNow.js)
  const [serverOffset, setServerOffset] = useState(0);

  const setAccess = useCallback((next) => {
    if (!next) return;
    if (next.serverNow) {
      offsetRef.current = new Date(next.serverNow).getTime() - Date.now();
      setServerOffset(offsetRef.current);
    }
    setAccessState(next);
    setNow(Date.now() + offsetRef.current);
  }, []);

  // { reconcile: true } asks the server to check Razorpay for a payment it has not confirmed yet
  const refresh = useCallback(async (opts = {}) => {
    if (!user?._id || !user?.token) return null;
    setLoading(true);
    try {
      const next = await paymentService.getAccess(opts);
      setAccess(next);
      return next;
    } catch (_) {
      return null;
    } finally {
      setLoading(false);
    }
  }, [user?._id, user?.token, setAccess]);

  // Load on login, and pick up any Play purchase that was paid but not yet confirmed
  useEffect(() => {
    if (!user?._id) { setAccessState(null); return; }
    refresh();
    if (!user.isGuest) {
      recoverPlayPurchases().then((granted) => { if (granted) refresh(); });
    }
  }, [user?._id, user?.isGuest, refresh]);

  // Re-sync when the app comes back to the foreground, so the countdown is right after reopening
  useEffect(() => {
    const onVisible = () => { if (document.visibilityState === 'visible') refresh(); };
    document.addEventListener('visibilitychange', onVisible);
    let handle;
    try {
      CapacitorApp.addListener('resume', () => refresh()).then(h => { handle = h; }).catch(() => {});
    } catch (_) {}
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      try { handle?.remove(); } catch (_) {}
    };
  }, [refresh]);

  // Tick once a minute while the trial clock is running, and re-check when it runs out
  useEffect(() => {
    if (access?.state !== 'trial_active' && access?.state !== 'guest_limit') return undefined;
    const id = setInterval(() => {
      const serverNow = Date.now() + offsetRef.current;
      setNow(serverNow);
      if (access?.trialEndsAt && serverNow >= new Date(access.trialEndsAt).getTime()) refresh();
    }, 30 * 1000);
    return () => clearInterval(id);
  }, [access?.state, access?.trialEndsAt, refresh]);

  const canUseTestView = Boolean(import.meta.env.DEV || isUserAdmin(user));
  const [testView, setTestViewState] = useState(() => readTestView(canUseTestView));
  useEffect(() => { setTestViewState(readTestView(canUseTestView)); }, [canUseTestView]);
  const setTestView = useCallback((view) => {
    saveTestView(view);
    setTestViewState(view);
  }, []);

  const shownAccess = useMemo(() => (testView ? testAccess(testView, access) : access), [testView, access]);
  const value = useMemo(
    () => ({ access: shownAccess, loading, refresh, now, serverOffset, setAccess, testView, setTestView, canUseTestView }),
    [shownAccess, loading, refresh, now, serverOffset, setAccess, testView, setTestView, canUseTestView]
  );
  return <AccessContext.Provider value={value}>{children}</AccessContext.Provider>;
};

// Pro pass time left: whole days, or hours in the last day. null without a pass.
export const passTimeLeft = (access, now) => {
  if (!access?.passExpiresAt) return null;
  const ms = Math.max(0, new Date(access.passExpiresAt).getTime() - now);
  const days = Math.ceil(ms / 86400000);
  if (ms < 86400000) {
    const hours = Math.max(1, Math.ceil(ms / 3600000));
    return { days: 0, hours, text: `${hours} ${hours === 1 ? 'hour' : 'hours'} left` };
  }
  return { days, hours: null, text: `${days} ${days === 1 ? 'day' : 'days'} left` };
};

/**
 * Milliseconds of trial left, or null when there is no clock. Before the first lesson the
 * server sends a running pre-trial clock that holds at trialHoldMs (half the trial).
 */
export const trialMsLeft = (access, now) => {
  if (!access?.trialEndsAt) return null;
  const left = Math.max(0, new Date(access.trialEndsAt).getTime() - now);
  return access.state === 'trial_not_started' && access.trialHoldMs ? Math.max(access.trialHoldMs, left) : left;
};

/** "47h 30m 12s" / "38m 20s" */
export const clockParts = (ms) => {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return { h, m, s, text: h > 0 ? `${h}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s` : `${m}m ${String(s).padStart(2, '0')}s` };
};

export const formatTrialLeft = (ms) => {
  if (ms == null) return '';
  const totalMin = Math.floor(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h <= 0) return `${m}m`;
  return `${h}h ${String(m).padStart(2, '0')}m`;
};
