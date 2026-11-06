import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAccess, trialMsLeft } from '../../../context/AccessContext.jsx';
import { useAuth } from '../../../context/AuthContext.jsx';
import GuestVerifyModal from '../../forms/GuestVerifyModal.jsx';
import PaywallModal from './PaywallModal.jsx';
import { useServerNow } from '../../../hooks/useServerNow.js';

const formatDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

// Hours and minutes left: "47h 54m", or "38m" in the last hour
// Hours, minutes and seconds left: "47h 30m 15s", or "38m 20s"
const clockParts = (ms) => {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return {
    h,
    m,
    s,
    text: h > 0
      ? `${h}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`
      : `${m}m ${String(s).padStart(2, '0')}s`
  };
};

// A trial 6 minutes in, with 2 of 7 lessons played; started once per page load
let previewStart = null;
const previewAccess = (now) => {
  previewStart = previewStart || now - 6 * 60000;
  return {
    state: 'trial_active', trialHours: 48, trialLessonLimit: 7, lessonLimit: 7, lessonsLeft: 5,
    trialEndsAt: new Date(previewStart + 48 * 3600000), isGuest: false
  };
};

const Stopwatch = ({ className = '' }) => (
  <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
    <defs>
      <linearGradient id="hyGold" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#FDE68A" />
        <stop offset="55%" stopColor="#F59E0B" />
        <stop offset="100%" stopColor="#B45309" />
      </linearGradient>
    </defs>
    <rect x="19" y="2" width="10" height="5" rx="2" fill="url(#hyGold)" />
    <rect x="22" y="6" width="4" height="5" fill="#D97706" />
    <rect x="35" y="9" width="6" height="4" rx="1.5" transform="rotate(45 38 11)" fill="#D97706" />
    <circle cx="24" cy="27" r="18" fill="url(#hyGold)" />
    <circle cx="24" cy="27" r="13.5" fill="#1E1B4B" />
    <circle cx="24" cy="27" r="13.5" fill="none" stroke="#FDE68A" strokeOpacity="0.5" strokeWidth="1" />
    <path d="M24 17v10l6 4" stroke="#FDE68A" strokeWidth="3" strokeLinecap="round" fill="none" />
  </svg>
);

// The client's home-screen trial card: countdown on the left, "Go Pro" and the price on the right.
// During the trial it should feel time-limited, not restricted: every lesson is still open.
export default function TrialBanner() {
  const { access: liveAccess, refresh } = useAccess();
  const { user } = useAuth();
  // Ticks every second on server time, so the countdown is live
  const now = useServerNow();
  const [showPaywall, setShowPaywall] = useState(false);
  const [showGuestVerify, setShowGuestVerify] = useState(false);
  // Must run before the early return below, or React sees a different hook count
  const navigate = useNavigate();

  // Dev builds only: with no live trial (old backend, or trial not enforced) show a
  // sample countdown so the design can be checked. Production never shows this.
  const isPreview = import.meta.env.DEV && (!liveAccess || liveAccess.state === 'open');
  const access = isPreview ? previewAccess(now) : liveAccess;

  if (!access || access.state === 'open') return null;

  const msLeft = trialMsLeft(access, now);
  const urgent = msLeft != null && msLeft < 6 * 60 * 60 * 1000;

  // Dynamic pricing from backend access.plan or config
  const planPrice = access?.plan?.amount ?? 99;
  const planOriginalPrice = access?.plan?.discountedFrom ?? 599;

  // Before payment for guest accounts, prompt login/verification first!
  const open = () => {
    if (access?.isGuest || user?.isGuest) {
      setShowGuestVerify(true);
      return;
    }
    if (access.state === 'guest_limit') {
      setShowPaywall(true);
    } else {
      navigate('/subscription');
    }
  };

  const priceLine = (
    <div className="flex items-baseline gap-1.5">
      <span className="text-[20px] min-[380px]:text-[24px] leading-none font-black text-white">₹{planPrice}</span>
      <span className="text-xs min-[380px]:text-sm font-bold text-white/55 line-through decoration-[#FB7185] decoration-2">₹{planOriginalPrice}</span>
    </div>
  );

  const goPro = (label = 'Go Pro Now') => (
    <div className="relative flex flex-col items-center gap-1 shrink-0">
      <span className="absolute -top-[15px] -left-2.5 z-10 text-[20px] min-[380px]:text-[24px] rotate-[-22deg] drop-shadow-[0_2px_1px_rgba(0,0,0,0.2)]" aria-hidden="true">👑</span>
      <button
        onClick={open}
        className="px-2.5 min-[380px]:px-4 py-1.5 min-[380px]:py-2 rounded-full bg-gradient-to-b from-[#FEF3C7] via-[#FCD34D] to-[#F59E0B] border border-[#FFF7D6] text-[#3B0764] font-black text-[13px] min-[380px]:text-[15px] whitespace-nowrap shadow-[0_3px_0_0_#B45309,0_0_16px_rgba(252,211,77,0.45)] active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
      >
        {label} →
      </button>
      {priceLine}
    </div>
  );

  let left;
  let right = goPro();

  if (access.state === 'pass') {
    left = (
      <div className="flex items-center gap-3 min-w-0">
        <span className="text-4xl shrink-0" aria-hidden="true">👑</span>
        <div className="min-w-0">
          <p className="text-[11px] font-black uppercase tracking-[0.15em] text-[#FCD34D]">HoshiYaar Pro</p>
          <p className="font-black text-white text-base sm:text-lg leading-tight">All lessons unlocked</p>
          <p className="text-xs font-bold text-indigo-200">Till {formatDate(access.passExpiresAt)}</p>
        </div>
      </div>
    );
    right = null;
  } else if (access.state === 'trial_ended') {
    left = (
      <div className="flex items-center gap-3 min-w-0">
        <Stopwatch className="w-11 h-11 min-[380px]:w-12 min-[380px]:h-12 shrink-0 opacity-80" />
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-wider text-[#FDA4AF] whitespace-nowrap">Free trial ended</p>
          <p className="font-black text-white text-sm sm:text-base leading-tight">
            {access.trialEndReason === 'lessons' ? `All ${access.trialLessonLimit} free lessons played` : 'Your 48 hours are over'}
          </p>
          <p className="text-[11px] font-bold text-indigo-200">Played lessons stay open</p>
        </div>
      </div>
    );
    right = goPro('Unlock');
  } else if (access.state === 'guest_limit') {
    const clock = msLeft != null ? clockParts(msLeft) : null;
    left = (
      <div className="flex items-center gap-3 min-w-0">
        <Stopwatch className="w-11 h-11 min-[380px]:w-12 min-[380px]:h-12 shrink-0" />
        <div className="min-w-0">
          <p className="text-[11px] font-black uppercase tracking-[0.15em] text-[#FCD34D]">Free trial</p>
          <p className="font-black text-white text-sm sm:text-base leading-tight">
            {access.trialLessonLimit - access.lessonsUsed} more free lessons waiting!
          </p>
          {clock && <p className="text-[11px] font-bold text-indigo-200">{clock.text} left</p>}
        </div>
      </div>
    );
    // Guests see the price too; the button asks them to log in first
    right = (
      <div className="flex flex-col items-center gap-1 shrink-0">
        <button
          onClick={open}
          className="px-3 py-1.5 min-[380px]:py-2 rounded-full bg-gradient-to-b from-[#FEF3C7] via-[#FCD34D] to-[#F59E0B] border border-[#FFF7D6] text-[#3B0764] font-black text-[13px] whitespace-nowrap shadow-[0_3px_0_0_#B45309] active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
        >
          Log in to continue →
        </button>
        {priceLine}
      </div>
    );
  } else {
    const notStarted = access.state === 'trial_not_started';
    const clock = notStarted ? { h: access.trialHours || 48, m: 0, s: 0 } : clockParts(msLeft);
    left = (
      <div className="flex items-center gap-2 min-[380px]:gap-3 shrink-0">
        <Stopwatch className="w-11 h-11 min-[380px]:w-[56px] min-[380px]:h-[56px] shrink-0" />
        <div className="min-w-0">
          <p className="text-[11px] min-[380px]:text-[13px] font-black uppercase tracking-[0.2em] text-[#FCD34D] whitespace-nowrap leading-none mb-1.5">Free trial</p>
          <p className={`hy-timer-bob font-black leading-none tabular-nums text-[1.55rem] min-[360px]:text-[1.85rem] min-[390px]:text-[2.2rem] tracking-tight ${urgent ? 'text-[#FDA4AF]' : 'text-white'}`}>
            {clock.h > 0 && (
              <>
                <span key={`h${clock.h}`} className="hy-tick inline-block">{clock.h}</span><span className="text-[0.52em] font-black text-indigo-200 ml-0.5 mr-1">h</span>
              </>
            )}
            <span key={`m${clock.m}`} className="hy-tick inline-block">{String(clock.m).padStart(clock.h > 0 ? 2 : 1, '0')}</span><span className="text-[0.52em] font-black text-indigo-200 ml-0.5 mr-1">m</span>
            {/* Re-keyed every second, so each new value pops in */}
            <span key={`s${clock.s}`} className={`${notStarted ? '' : 'hy-tick'} inline-block text-[#FCD34D]`}>{String(clock.s ?? 0).padStart(2, '0')}</span><span className="text-[0.52em] font-black text-indigo-200 ml-0.5">s</span>
          </p>
          <p className="text-[12px] min-[380px]:text-[14px] font-bold text-indigo-200 leading-tight whitespace-nowrap mt-0.5">{notStarted ? '48 hours free' : 'left'}</p>
        </div>
      </div>
    );
    // Guests can also see the Pro plan and price!
  }

  return (
    <>
      <style>{`
        @keyframes hyTimerBob { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-3px); } }
        @keyframes hyTick { 0% { transform: translateY(-45%) scale(1.25); opacity: 0.2; } 60% { transform: translateY(6%) scale(0.96); opacity: 1; } 100% { transform: none; } }
        .hy-timer-bob { animation: hyTimerBob 2s ease-in-out infinite; }
        .hy-tick { animation: hyTick 0.42s cubic-bezier(0.34, 1.56, 0.64, 1); }
        @media (prefers-reduced-motion: reduce) { .hy-timer-bob, .hy-tick { animation: none; } }
      `}</style>
      <div className="relative w-full rounded-[22px] p-[2px] mb-4 lg:mb-3 bg-gradient-to-br from-[#FDE68A] via-[#D97706] to-[#FDE68A] shadow-[0_10px_24px_rgba(76,29,149,0.35)]">
       {(isPreview || liveAccess?.testView) && (
         <span className="absolute -top-2 left-4 z-20 rounded-full bg-[#1E1B4B] border border-[#FCD34D]/60 px-1.5 py-px text-[8px] font-black uppercase tracking-wider text-[#FCD34D]">
           {liveAccess?.testView ? 'Test view' : 'Preview · dev only'}
         </span>
       )}
       <div className="relative overflow-hidden rounded-[20px] bg-gradient-to-br from-[#3B0764] via-[#4C1D95] to-[#1E1B4B] px-2.5 min-[380px]:px-4 py-3">
        <span className="pointer-events-none absolute -top-10 -left-6 w-40 h-24 rounded-full bg-[radial-gradient(closest-side,rgba(255,255,255,0.14),rgba(255,255,255,0))]" aria-hidden="true" />
        <span className="pointer-events-none absolute -bottom-10 right-0 w-36 h-24 rounded-full bg-[radial-gradient(closest-side,rgba(245,158,11,0.28),rgba(245,158,11,0))]" aria-hidden="true" />
        <div className="relative flex items-center justify-between gap-2 min-[380px]:gap-3">
          {left}
          {right && <div className="w-px self-stretch my-1 bg-gradient-to-b from-transparent via-[#FCD34D]/60 to-transparent" />}
          {right}
        </div>
       </div>
      </div>
      {showGuestVerify && (
        <GuestVerifyModal
          onClose={() => { setShowGuestVerify(false); refresh(); }}
        />
      )}
      {showPaywall && (
        <PaywallModal
          isOpen={showPaywall}
          onClose={() => { setShowPaywall(false); refresh(); }}
          onSuccess={() => setShowPaywall(false)}
        />
      )}
    </>
  );
}
