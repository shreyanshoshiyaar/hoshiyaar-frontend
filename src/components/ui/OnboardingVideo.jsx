import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { stopAllAudio } from '../../utils/audioPreloadService.js';
import {
  getIntroVideoUrl, getIntroVideoElement, preloadIntroVideo, parkIntroVideo,
  hasSeenIntro, markIntroSeen, INTRO_CLOSED_EVENT,
} from '../../utils/onboardingVideo.js';

// Screens where the video may open: the home and learn pages a learner lands on after login, signup or as a guest.
// Not lessons (a notification can open one directly), admin, teacher or legal pages.
const SHOW_ON = new Set(['/', '/home', '/learn', '/welcome']);

// Full-screen onboarding video, once per account on this device. Autoplays (with sound when the device allows,
// otherwise muted with a "Tap for sound" button), can be skipped, and closes by itself at the end.
export default function OnboardingVideo() {
  const { user } = useAuth();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const [muted, setMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const holderRef = useRef(null);
  const closedRef = useRef(false);
  const userId = user?._id ? String(user._id) : '';

  // Start downloading as soon as we know this learner hasn't seen it
  useEffect(() => {
    if (userId && !hasSeenIntro(userId)) preloadIntroVideo();
  }, [userId]);

  // Open on the first allowed screen
  useEffect(() => {
    if (!userId || open || hasSeenIntro(userId) || !SHOW_ON.has(location.pathname)) return;
    let cancelled = false;
    getIntroVideoUrl().then((url) => {
      if (!cancelled && url && !hasSeenIntro(userId)) setOpen(true);
    });
    return () => { cancelled = true; };
  }, [userId, location.pathname, open]);

  const close = useCallback(() => {
    closedRef.current = true;
    markIntroSeen(userId);
    parkIntroVideo({ release: true });
    setOpen(false);
    window.__hyIntroVideoOpen = false;
    window.dispatchEvent(new Event(INTRO_CLOSED_EVENT));
  }, [userId]);

  // Move the already-downloading element on screen and play it
  useEffect(() => {
    if (!open) return undefined;
    window.__hyIntroVideoOpen = true;
    closedRef.current = false;
    stopAllAudio();
    preloadIntroVideo();
    const el = getIntroVideoElement();
    const holder = holderRef.current;
    if (!el || !holder) return undefined;

    Object.assign(el.style, { position: 'absolute', left: '0', top: '0', width: '100%', height: '100%', opacity: '1', objectFit: 'contain', pointerEvents: 'none', background: '#000' });
    holder.appendChild(el);
    el.currentTime = 0;

    const onReady = () => setReady(true);
    const onTime = () => setProgress(el.duration ? el.currentTime / el.duration : 0);
    const onEnded = () => close();
    el.addEventListener('canplay', onReady);
    el.addEventListener('playing', onReady);
    el.addEventListener('timeupdate', onTime);
    el.addEventListener('ended', onEnded);
    if (el.readyState >= 3) setReady(true);

    // Sound first; if the device blocks autoplay with sound, play muted and offer "Tap for sound"
    el.muted = false;
    el.play().then(() => setMuted(false)).catch((err) => {
      // Only a real "sound not allowed" falls back to muted. A play cancelled by Skip (AbortError) must not
      // restart the video off screen.
      if (closedRef.current || err?.name !== 'NotAllowedError') return;
      el.muted = true;
      setMuted(true);
      el.play().catch(() => { /* still blocked: the cover image stays and the learner can tap */ });
    });

    return () => {
      el.removeEventListener('canplay', onReady);
      el.removeEventListener('playing', onReady);
      el.removeEventListener('timeupdate', onTime);
      el.removeEventListener('ended', onEnded);
    };
  }, [open, close]);

  if (!open) return null;

  const unmute = () => {
    const el = getIntroVideoElement();
    if (!el) return;
    el.muted = false;
    setMuted(false);
    el.play().catch(() => {});
  };

  return (
    <div
      className="fixed inset-0 z-[9000] bg-black flex items-center justify-center"
      role="dialog"
      aria-label="Welcome video"
      onClick={muted ? unmute : undefined}
    >
      <div ref={holderRef} className="relative w-full h-full max-w-[min(100vw,56.25vh)] mx-auto" />

      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-10 h-10 rounded-full border-[3px] border-white/30 border-t-white animate-spin" />
        </div>
      )}

      {/* Progress along the top */}
      <div className="absolute left-0 right-0 h-1 bg-white/15" style={{ top: 'env(safe-area-inset-top, 0px)' }}>
        <div className="h-full bg-amber-400 transition-[width] duration-200" style={{ width: `${Math.round(progress * 100)}%` }} />
      </div>

      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); close(); }}
        className="absolute right-4 rounded-full bg-black/55 backdrop-blur-sm border border-white/25 px-4 py-2 text-sm font-black text-white active:scale-95"
        style={{ top: 'calc(env(safe-area-inset-top, 0px) + 16px)' }}
      >
        Skip ›
      </button>

      {muted && ready && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); unmute(); }}
          className="absolute left-1/2 -translate-x-1/2 rounded-full bg-white px-5 py-2.5 text-sm font-black text-slate-900 shadow-lg active:scale-95"
          style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 28px)' }}
        >
          🔊 Tap for sound
        </button>
      )}
    </div>
  );
}
