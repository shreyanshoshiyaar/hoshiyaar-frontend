import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAccess, trialMsLeft, clockParts } from '../../../context/AccessContext.jsx';
import { useServerNow } from '../../../hooks/useServerNow.js';

const TIMER_STATES = ['trial_not_started', 'trial_active', 'guest_limit', 'trial_ended'];

// Slim trial countdown with a "Go Pro" pill: a bar pinned above the Learn map, or a card
// above the NEXT button on the lesson complete page. Hidden for Pro holders and when the
// trial doesn't apply.
export default function TrialTimerBar({ variant = 'bar', className = '' }) {
  const navigate = useNavigate();
  const { access } = useAccess();
  const now = useServerNow();
  if (!access || !TIMER_STATES.includes(access.state)) return null;

  const ended = access.state === 'trial_ended';
  const msLeft = ended ? null : trialMsLeft(access, now);
  if (!ended && msLeft == null) return null;
  const clock = msLeft != null ? clockParts(msLeft) : null;
  const urgent = msLeft != null && msLeft < 6 * 60 * 60 * 1000;
  const price = access?.plan?.amount ?? 99;
  const card = variant === 'card';
  // Share of the trial still left, drawn as a draining gold line along the bottom
  const trialMs = (access.trialHours || 48) * 3600000;
  const share = msLeft != null ? Math.max(0.02, Math.min(1, msLeft / trialMs)) : 0;

  const digit = (key, value, unit) => (
    <>
      <span key={key} className="hy-bar-tick inline-block">{value}</span>
      <span className="text-[0.72em] font-black text-indigo-200 ml-px mr-1">{unit}</span>
    </>
  );

  return (
    <div
      className={`relative overflow-hidden ${card ? 'rounded-2xl border border-[#FCD34D]/50 shadow-[0_6px_16px_rgba(76,29,149,0.25)]' : 'border-b border-[#FCD34D]/40 shadow-[0_2px_10px_rgba(30,27,75,0.25)]'} bg-gradient-to-r from-[#3B0764] via-[#4C1D95] to-[#1E1B4B] ${urgent ? 'hy-bar-urgent' : ''} ${className}`}
      role="timer"
      aria-label={ended ? 'Free trial ended' : `Free trial: ${clock.text} left`}
    >
      <style>{`
        @keyframes hyBarTick{0%{transform:translateY(-40%);opacity:.25}100%{transform:none;opacity:1}}
        @keyframes hyHourglass{0%,70%{transform:rotate(0)}85%,100%{transform:rotate(180deg)}}
        @keyframes hyShine{0%,55%{transform:translateX(-120%) skewX(-20deg)}100%{transform:translateX(260%) skewX(-20deg)}}
        @keyframes hyGlow{0%,100%{box-shadow:inset 0 0 0 rgba(251,113,133,0)}50%{box-shadow:inset 0 0 18px rgba(251,113,133,.45)}}
        @keyframes hyBreathe{0%,100%{opacity:.25}50%{opacity:.55}}
        .hy-bar-tick{animation:hyBarTick .35s ease-out}
        .hy-hourglass{display:inline-block;animation:hyHourglass 2.4s ease-in-out infinite}
        .hy-shine{animation:hyShine 2.6s ease-in-out infinite}
        .hy-bar-urgent{animation:hyGlow 1.6s ease-in-out infinite}
        .hy-breathe{animation:hyBreathe 3s ease-in-out infinite}
        @media (prefers-reduced-motion:reduce){.hy-bar-tick,.hy-hourglass,.hy-shine,.hy-bar-urgent,.hy-breathe{animation:none}}
      `}</style>
      {/* soft gold glow behind the clock */}
      <span className="hy-breathe pointer-events-none absolute -left-6 top-1/2 -translate-y-1/2 w-28 h-16 rounded-full bg-[radial-gradient(closest-side,rgba(252,211,77,0.35),rgba(252,211,77,0))]" aria-hidden="true" />
      <div className={`relative flex items-center justify-between gap-2 ${card ? 'px-3 min-[380px]:px-3.5 py-3' : 'px-2.5 min-[380px]:px-3.5 py-2.5'}`}>
        <div className="flex items-center gap-1.5 min-[380px]:gap-2 min-w-0 overflow-hidden">
          <span className={`${card ? 'text-xl' : 'text-xl min-[380px]:text-2xl'} shrink-0 ${ended ? '' : 'hy-hourglass'}`} aria-hidden="true">{ended ? '🔒' : '⏳'}</span>
          {ended ? (
            <p className="min-w-0 text-[14px] min-[380px]:text-[15px] font-black text-white leading-tight truncate">
              Free trial ended <span className="font-bold text-indigo-200">· played lessons stay open</span>
            </p>
          ) : (
            <p className="min-w-0 flex items-baseline gap-1.5 whitespace-nowrap">
              <span className={`${card ? 'hidden min-[380px]:inline' : ''} text-[11px] min-[380px]:text-[12px] font-black uppercase tracking-wider text-[#FCD34D]`}>Free trial</span>
              <span className={`${card ? 'text-[15px] min-[380px]:text-[16px]' : 'text-[16px] min-[380px]:text-[17px]'} font-black tabular-nums ${urgent ? 'text-[#FDA4AF]' : 'text-white'}`}>
                {clock.h > 0 && digit(`h${clock.h}`, clock.h, 'h')}
                {digit(`m${clock.m}`, String(clock.m).padStart(clock.h > 0 ? 2 : 1, '0'), 'm')}
                <span key={`s${clock.s}`} className="hy-bar-tick inline-block text-[#FCD34D]">{String(clock.s).padStart(2, '0')}</span>
                <span className="text-[0.72em] font-black text-indigo-200 ml-px">s</span>
              </span>
            </p>
          )}
        </div>
        <button
          onClick={() => navigate('/subscription')}
          className="relative overflow-hidden shrink-0 rounded-full bg-gradient-to-b from-[#FEF3C7] via-[#FCD34D] to-[#F59E0B] py-1.5 text-[12px] min-[380px]:text-[14px] font-black text-[#3B0764] shadow-[0_2px_0_0_#B45309,0_0_12px_rgba(252,211,77,0.45)] px-2.5 min-[380px]:px-3 active:translate-y-px active:shadow-none whitespace-nowrap cursor-pointer"
        >
          <span className="hy-shine pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/80 to-transparent" aria-hidden="true" />
          <span className="relative">{!card && <span className="hidden min-[380px]:inline">👑 </span>}{ended ? `Unlock ₹${price}` : `Go Pro ₹${price}`}</span>
        </button>
      </div>
      {/* how much of the trial is left */}
      {!ended && (
        <div className="absolute inset-x-0 bottom-0 h-1 bg-white/10" aria-hidden="true">
          <div
            className={`h-full rounded-r-full transition-[width] duration-1000 ${urgent ? 'bg-gradient-to-r from-[#FB7185] to-[#FDA4AF]' : 'bg-gradient-to-r from-[#F59E0B] to-[#FDE68A]'}`}
            style={{ width: `${share * 100}%` }}
          />
        </div>
      )}
    </div>
  );
}
