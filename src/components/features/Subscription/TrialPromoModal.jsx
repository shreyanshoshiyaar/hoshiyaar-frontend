import React, { useState, useEffect, useRef } from 'react';
import { useAccess, trialMsLeft } from '../../../context/AccessContext.jsx';
import { useServerNow } from '../../../hooks/useServerNow.js';

const StopwatchIcon = ({ className = '' }) => (
  <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
    <defs>
      <linearGradient id="promoGold" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#FDE68A" />
        <stop offset="55%" stopColor="#F59E0B" />
        <stop offset="100%" stopColor="#B45309" />
      </linearGradient>
      <linearGradient id="ringGlow" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#FDE68A" stopOpacity="0.8" />
        <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.2" />
      </linearGradient>
    </defs>
    <rect x="19" y="2" width="10" height="5" rx="2" fill="url(#promoGold)" />
    <rect x="22" y="6" width="4" height="5" fill="#D97706" />
    <rect x="35" y="9" width="6" height="4" rx="1.5" transform="rotate(45 38 11)" fill="#D97706" />
    <circle cx="24" cy="27" r="18" fill="url(#promoGold)" />
    <circle cx="24" cy="27" r="13.5" fill="#1E1B4B" />
    <circle cx="24" cy="27" r="13.5" fill="none" stroke="url(#ringGlow)" strokeWidth="1.5" />
    <path d="M24 18v9l5.5 3.5" stroke="#FDE68A" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </svg>
);

const clockParts = (ms) => {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return { h, m, s };
};

const AUTO_DISMISS_SECONDS = 5;

/**
 * TrialPromoModal: Clean, animated pop-up that only displays the Free Trial timer
 * and automatically dismisses itself with exit animation after 5 seconds.
 */
export default function TrialPromoModal({ isOpen, onClose }) {
  const { access } = useAccess();
  const now = useServerNow();

  const [remainingSecs, setRemainingSecs] = useState(AUTO_DISMISS_SECONDS);
  const [isExiting, setIsExiting] = useState(false);
  const timerRef = useRef(null);
  const exitTimeoutRef = useRef(null);

  // Trigger smooth exit animation before calling onClose
  const handleDismiss = () => {
    if (isExiting) return;
    setIsExiting(true);
    exitTimeoutRef.current = setTimeout(() => {
      onClose?.();
    }, 320); // 320ms matching CSS transition
  };

  useEffect(() => {
    if (!isOpen) {
      setIsExiting(false);
      setRemainingSecs(AUTO_DISMISS_SECONDS);
      return;
    }

    setIsExiting(false);
    setRemainingSecs(AUTO_DISMISS_SECONDS);

    const interval = setInterval(() => {
      setRemainingSecs((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleDismiss();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(interval);
      if (exitTimeoutRef.current) clearTimeout(exitTimeoutRef.current);
    };
  }, [isOpen]);

  if (!isOpen || !access || access.state === 'pass') return null;

  const msLeft = trialMsLeft(access, now);
  const notStarted = access.state === 'trial_not_started';
  const clock = notStarted ? { h: access.trialHours || 48, m: 0, s: 0 } : clockParts(msLeft);

  const progressPercent = Math.max(0, (remainingSecs / AUTO_DISMISS_SECONDS) * 100);

  return (
    <div
      onClick={handleDismiss}
      className={`fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 font-sans select-none transition-opacity duration-300 ${
        isExiting ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full max-w-xs sm:max-w-sm rounded-[32px] p-[2.5px] bg-gradient-to-br from-[#FDE68A] via-[#F59E0B] to-[#B45309] shadow-[0_24px_60px_rgba(76,29,149,0.55)] transition-all duration-300 transform ${
          isExiting
            ? 'scale-90 opacity-0 translate-y-3'
            : 'scale-100 opacity-100 translate-y-0 animate-in zoom-in-95 ease-out'
        }`}
      >
        {/* Card inner */}
        <div className="relative overflow-hidden rounded-[30px] bg-gradient-to-br from-[#2E0854] via-[#4C1D95] to-[#1E1B4B] px-6 py-6 text-center text-white">
          
          {/* 5-second animated top progress bar */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-white/10 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-300 via-amber-400 to-yellow-200 transition-all duration-1000 ease-linear rounded-r-full shadow-[0_0_8px_rgba(252,211,77,0.7)]"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Background decorative glows */}
          <span
            className="pointer-events-none absolute -top-10 -left-10 w-36 h-36 rounded-full bg-[radial-gradient(closest-side,rgba(252,211,77,0.25),transparent)] animate-pulse"
            aria-hidden="true"
          />
          <span
            className="pointer-events-none absolute -bottom-10 -right-10 w-40 h-40 rounded-full bg-[radial-gradient(closest-side,rgba(168,85,247,0.35),transparent)]"
            aria-hidden="true"
          />

          {/* Close button with remaining seconds */}
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Close"
            className="absolute top-3.5 right-3.5 px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 active:scale-90 text-white/80 hover:text-white flex items-center gap-1.5 text-[11px] font-bold transition-all cursor-pointer z-20"
          >
            <span className="text-[10px] text-amber-200 font-mono font-bold">{remainingSecs}s</span>
            <span>✕</span>
          </button>

          {/* Top Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/25 to-purple-500/25 border border-amber-300/40 text-amber-300 text-[11px] font-black uppercase tracking-wider mb-3.5 shadow-sm">
            <span>⏳</span>
            <span>{notStarted ? 'Free Trial Ready' : 'Free Trial Active'}</span>
          </div>

          {/* Big Animated Stopwatch */}
          <div className="relative mx-auto w-20 h-20 mb-3 flex items-center justify-center">
            {/* Outer pulse ring */}
            <span className="absolute inset-0 rounded-full bg-amber-400/20 animate-ping opacity-60" />
            <span className="absolute inset-1 rounded-full bg-gradient-to-tr from-amber-400/30 to-purple-500/30 blur-sm" />
            <StopwatchIcon className="relative w-16 h-16 drop-shadow-[0_4px_12px_rgba(245,158,11,0.5)] transform hover:scale-105 transition-transform" />
          </div>

          {/* Title */}
          <h3 className="text-sm font-black uppercase tracking-[0.2em] text-amber-300 mb-1">
            {notStarted ? '48-Hour Free Trial' : 'Remaining Free Trial'}
          </h3>

          {/* Huge Live Timer */}
          <div className="my-2.5 py-2.5 px-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
            <p className="font-black tabular-nums tracking-tight text-3xl sm:text-4xl text-white leading-none">
              {clock.h > 0 && (
                <>
                  {clock.h}
                  <span className="text-base font-black text-indigo-200 ml-0.5 mr-1.5">h</span>
                </>
              )}
              {String(clock.m).padStart(clock.h > 0 ? 2 : 1, '0')}
              <span className="text-base font-black text-indigo-200 ml-0.5 mr-1.5">m</span>
              {String(clock.s ?? 0).padStart(2, '0')}
              <span className="text-base font-black text-indigo-200 ml-0.5">s</span>
            </p>
          </div>

          {/* Subtitle / Caption */}
          <p className="text-xs font-semibold text-indigo-200/90 leading-snug mt-2">
            {notStarted
              ? 'Starts automatically when you play your first lesson!'
              : 'Enjoy full access to your lessons during your free trial!'}
          </p>

          {/* Auto-closing animated indicator pill at bottom */}
          <div className="mt-4 pt-2 border-t border-white/10 flex items-center justify-center gap-1.5 text-[11px] font-medium text-indigo-200/60">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            <span>Closes in {remainingSecs}s</span>
          </div>

        </div>
      </div>
    </div>
  );
}
