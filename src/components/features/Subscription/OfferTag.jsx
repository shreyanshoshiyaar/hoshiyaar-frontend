import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAccess } from '../../../context/AccessContext.jsx';
import { useServerNow } from '../../../hooks/useServerNow.js';
import { offerEndsAtMs, offerRunning } from './ProOfferModal.jsx';

const pad = (n) => String(n).padStart(2, '0');

// "2d 05:12:31", or "05:12:31" on the last day
export const offerClock = (ms) => {
  const t = Math.max(0, Math.floor(ms / 1000));
  const d = Math.floor(t / 86400);
  const hms = `${pad(Math.floor((t % 86400) / 3600))}:${pad(Math.floor((t % 3600) / 60))}:${pad(t % 60)}`;
  return d > 0 ? `${d}d ${hms}` : hms;
};

const STYLES = `
  @keyframes hyOfferShine{0%,55%{transform:translateX(-120%) skewX(-20deg)}100%{transform:translateX(320%) skewX(-20deg)}}
  @keyframes hyOfferFlame{0%,100%{transform:scale(1) rotate(-5deg)}50%{transform:scale(1.15) rotate(5deg)}}
  @keyframes hyOfferTick{0%{transform:translateY(-55%);opacity:0}100%{transform:none;opacity:1}}
  @keyframes hyOfferBlink{0%,100%{opacity:1}50%{opacity:.25}}
  @keyframes hyOfferUrgent{0%,100%{box-shadow:0 0 0 0 rgba(220,38,38,.0)}50%{box-shadow:0 0 0 3px rgba(220,38,38,.35)}}
  .hy-offer-shine{animation:hyOfferShine 2.8s ease-in-out infinite}
  .hy-offer-flame{display:inline-block;transform-origin:50% 90%;animation:hyOfferFlame 1.1s ease-in-out infinite}
  .hy-offer-tick{display:inline-block;animation:hyOfferTick .35s ease-out}
  .hy-offer-blink{animation:hyOfferBlink 1s steps(1) infinite}
  .hy-offer-urgent{animation:hyOfferUrgent 1.2s ease-in-out infinite}
  @media (prefers-reduced-motion:reduce){.hy-offer-shine,.hy-offer-flame,.hy-offer-tick,.hy-offer-blink,.hy-offer-urgent{animation:none}}
`;

const parts = (ms) => {
  const t = Math.max(0, Math.floor(ms / 1000));
  return { d: Math.floor(t / 86400), h: Math.floor((t % 86400) / 3600), m: Math.floor((t % 3600) / 60), s: t % 60 };
};

// A small flame, drawn (no emoji)
const Flame = ({ className = '' }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    <defs>
      <linearGradient id="hyOfferFlameG" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#FB923C" />
        <stop offset="100%" stopColor="#DC2626" />
      </linearGradient>
    </defs>
    <path d="M12 2c.6 3.2 3 4.9 4.6 7 1.4 1.8 2.4 3.7 2.4 6a7 7 0 0 1-14 0c0-2.6 1.3-4.6 3-6.2.3 1.6 1 2.7 2.2 3.3C9.6 8.5 10.4 5 12 2Z" fill="url(#hyOfferFlameG)" />
    <path d="M12 12.5c1.6 1.4 2.8 2.6 2.8 4.3a2.8 2.8 0 0 1-5.6 0c0-1.5.9-2.6 2.8-4.3Z" fill="#FDE68A" />
  </svg>
);

// One flip-style box: number + small unit
const Seg = ({ value, unit, tick, lastDay, big }) => (
  <span className="flex items-baseline">
    <span className={`relative inline-flex items-center justify-center ${big ? 'min-w-[30px] h-[30px] text-[16px]' : 'min-w-[25px] h-[26px] text-[14px]'} px-1 rounded-[7px] bg-gradient-to-b from-[#4C1D95] to-[#2E0854] shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_2px_0_rgba(46,8,84,0.35)] overflow-hidden font-black tabular-nums leading-none ${lastDay ? 'text-[#FCA5A5]' : 'text-[#FDE68A]'}`}>
      <span className="absolute inset-x-0 top-1/2 h-px bg-black/30" aria-hidden="true" />
      <span key={tick ? value : undefined} className={tick ? 'hy-offer-tick relative' : 'relative'}>{String(value).padStart(2, '0')}</span>
    </span>
    <span className={`ml-[2px] ${big ? 'text-[10px]' : 'text-[9px]'} font-black uppercase text-[#3B0764]/70`}>{unit}</span>
  </span>
);

const Countdown = ({ ms, lastDay, big = false }) => {
  const { d, h, m, s } = parts(ms);
  return (
    <span className={`flex items-center ${big ? 'gap-1.5' : 'gap-1'}`}>
      {d > 0 && <Seg value={d} unit="d" lastDay={lastDay} big={big} />}
      <Seg value={h} unit="h" lastDay={lastDay} big={big} />
      <Seg value={m} unit="m" lastDay={lastDay} big={big} />
      <Seg value={s} unit="s" tick lastDay={lastDay} big={big} />
    </span>
  );
};

/**
 * "Limited time offer" tag with the offer price and a live countdown, shown only while an offer runs
 * (Admin → Payments) and the student has no Pro. Tapping it opens the Pro page with checkout.
 *  - variant "strip": a slim bar (Learn top, Home); rounded adds corners (cards, lesson end)
 *  - variant "plan": the countdown line inside the Pro page's plan card (no tap)
 */
export default function OfferTag({ variant = 'strip', rounded = false, className = '', access: accessProp }) {
  const navigate = useNavigate();
  const { access: liveAccess } = useAccess();
  const access = accessProp || liveAccess;
  const now = useServerNow();
  if (!offerRunning(access, now)) return null;

  const msLeft = offerEndsAtMs(access) - now;
  const lastDay = msLeft < 24 * 3600 * 1000;
  const price = Number(access?.plan?.amount) || 99;
  const was = Number(access?.plan?.discountedFrom) || 0;

  if (variant === 'plan') {
    return (
      <div className={`relative flex items-center justify-between gap-2 rounded-2xl bg-gradient-to-r from-[#FDE68A] via-[#FCD34D] to-[#F59E0B] px-3 py-2.5 ${lastDay ? 'hy-offer-urgent' : ''} ${className}`} role="timer">
        <style>{STYLES}</style>
        <span className="flex items-center gap-1.5 text-[11.5px] min-[380px]:text-[12.5px] font-black uppercase tracking-wider text-[#3B0764] whitespace-nowrap">
          <Flame className="hy-offer-flame w-[18px] h-[18px]" />
          {lastDay ? 'Last day!' : 'Offer ends in'}
        </span>
        <Countdown ms={msLeft} lastDay={lastDay} />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => navigate('/subscription?offer=1')}
      className={`relative w-full overflow-hidden bg-gradient-to-r from-[#FDE68A] via-[#FCD34D] to-[#F59E0B] text-[#3B0764] cursor-pointer active:brightness-95 ${rounded ? 'rounded-2xl border border-[#F59E0B]/60 shadow-[0_6px_16px_rgba(245,158,11,0.3)]' : 'border-b border-[#D97706]/40 shadow-[0_2px_8px_rgba(180,83,9,0.2)]'} ${lastDay && rounded ? 'hy-offer-urgent' : ''} ${className}`}
      role="timer"
      aria-label={`Limited time offer: Pro for ₹${price}, ends in ${offerClock(msLeft)}`}
    >
      <style>{STYLES}</style>
      <span className="hy-offer-shine pointer-events-none absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r from-transparent via-white/60 to-transparent" aria-hidden="true" />
      <span className="relative flex items-center justify-between gap-2 pl-2.5 pr-2.5 min-[380px]:pl-3 py-1.5">
        <span className="flex items-center gap-1.5 min-w-0 whitespace-nowrap text-left">
          <Flame className="hy-offer-flame w-[22px] h-[22px] shrink-0" />
          <span className="flex flex-col leading-none">
            <span className="text-[10.5px] min-[380px]:text-[11px] font-black uppercase tracking-[0.08em]">Limited time offer</span>
            <span className="mt-[3px] flex items-baseline gap-1">
              <span className="text-[11px] font-bold text-[#3B0764]/80">Pro at</span>
              <span className="text-[15px] font-black text-[#7C2D12]">₹{price}</span>
              {was > price && <span className="text-[11px] font-bold text-[#3B0764]/50 line-through decoration-[#DC2626]">₹{was}</span>}
            </span>
          </span>
        </span>
        <Countdown ms={msLeft} lastDay={lastDay} />
      </span>
    </button>
  );
}
