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
  @keyframes hyOfferTick{0%{transform:translateY(-45%);opacity:.3}100%{transform:none;opacity:1}}
  @keyframes hyOfferBlink{0%,100%{opacity:1}50%{opacity:.25}}
  @keyframes hyOfferUrgent{0%,100%{box-shadow:0 0 0 0 rgba(220,38,38,.0)}50%{box-shadow:0 0 0 3px rgba(220,38,38,.35)}}
  .hy-offer-shine{animation:hyOfferShine 2.8s ease-in-out infinite}
  .hy-offer-tick{display:inline-block;animation:hyOfferTick .35s ease-out}
  .hy-offer-blink{animation:hyOfferBlink 1s steps(1) infinite}
  .hy-offer-urgent{animation:hyOfferUrgent 1.2s ease-in-out infinite}
  @media (prefers-reduced-motion:reduce){.hy-offer-shine,.hy-offer-tick,.hy-offer-blink,.hy-offer-urgent{animation:none}}
`;

const parts = (ms) => {
  const t = Math.max(0, Math.floor(ms / 1000));
  return { d: Math.floor(t / 86400), h: Math.floor((t % 86400) / 3600), m: Math.floor((t % 3600) / 60), s: t % 60 };
};

// One flip-style box: number + small unit
const Seg = ({ value, unit, tick, lastDay, big }) => (
  <span className="flex items-baseline">
    <span className={`relative inline-flex items-center justify-center ${big ? 'min-w-[30px] h-[30px] text-[16px]' : 'min-w-[22px] h-[24px] text-[12.5px] ph:min-w-[25px] ph:h-[26px] ph:text-[14px]'} px-[3px] ph:px-1 rounded-[6px] ph:rounded-[7px] bg-gradient-to-b from-[#4C1D95] to-[#2E0854] shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_2px_0_rgba(46,8,84,0.35)] overflow-hidden font-black tabular-nums leading-none ${lastDay ? 'text-[#FCA5A5]' : 'text-[#FDE68A]'}`}>
      <span className="absolute inset-x-0 top-1/2 h-px bg-black/30" aria-hidden="true" />
      <span key={tick ? value : undefined} className={tick ? 'hy-offer-tick relative' : 'relative'}>{String(value).padStart(2, '0')}</span>
    </span>
    <span className={`ml-px ph:ml-[2px] ${big ? 'text-[10px]' : 'text-[8px] ph:text-[9px]'} font-black uppercase text-[#3B0764]/70`}>{unit}</span>
  </span>
);

const Countdown = ({ ms, lastDay, big = false }) => {
  const { d, h, m, s } = parts(ms);
  return (
    <span className={`shrink-0 flex items-center ${big ? 'gap-1.5' : 'gap-[3px] ph:gap-1'}`}>
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
export default function OfferTag({ variant = 'strip', rounded = false, className = '', access: accessProp, world = 'science' }) {
  const navigate = useNavigate();
  const { access: liveAccess } = useAccess();
  const access = accessProp || liveAccess;
  const now = useServerNow();
  // Gita: the same offer end time (Admin → Payments), for a Gita chapter, to learners without every chapter open
  const gita = world === 'gita';
  // Gita has its own offer end time (Admin → Payments → Gita world), separate from Science's
  const endsMs = gita ? (access?.gita?.offerEndsAt ? new Date(access.gita.offerEndsAt).getTime() || 0 : 0) : offerEndsAtMs(access);
  if (gita ? (!access?.gita || access.gita.hasPass || !(endsMs > now)) : !offerRunning(access, now)) return null;

  const msLeft = endsMs - now;
  const lastDay = msLeft < 24 * 3600 * 1000;
  const price = gita ? (Number(access.gita.price) || 99) : (Number(access?.plan?.amount) || 99);
  const was = gita ? (Number(access.gita.originalPrice) || 0) : (Number(access?.plan?.discountedFrom) || 0);
  const proName = gita ? 'A Gita chapter' : 'Pro';

  if (variant === 'plan') {
    return (
      <div className={`relative flex items-center justify-between gap-2 rounded-2xl bg-gradient-to-r from-[#FDE68A] via-[#FCD34D] to-[#F59E0B] px-2.5 ph:px-3 py-2.5 ${lastDay ? 'hy-offer-urgent' : ''} ${className}`} role="timer">
        <style>{STYLES}</style>
        <span className="min-w-0 truncate text-[11px] ph:text-[12.5px] font-black uppercase tracking-wide ph:tracking-wider text-[#3B0764]">
          {lastDay ? 'Last day!' : <><span className="hidden ph:inline">Offer </span>ends in</>}
        </span>
        <Countdown ms={msLeft} lastDay={lastDay} />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => navigate(gita ? '/gita-pro' : '/subscription?offer=1')}
      className={`relative w-full overflow-hidden bg-gradient-to-r from-[#FDE68A] via-[#FCD34D] to-[#F59E0B] text-[#3B0764] cursor-pointer active:brightness-95 ${rounded ? 'rounded-2xl border border-[#F59E0B]/60 shadow-[0_6px_16px_rgba(245,158,11,0.3)]' : 'border-b border-[#D97706]/40 shadow-[0_2px_8px_rgba(180,83,9,0.2)]'} ${lastDay && rounded ? 'hy-offer-urgent' : ''} ${className}`}
      role="timer"
      aria-label={`Limited time offer: ${proName} for ₹${price}, ends in ${offerClock(msLeft)}`}
    >
      <style>{STYLES}</style>
      <span className="hy-offer-shine pointer-events-none absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r from-transparent via-white/60 to-transparent" aria-hidden="true" />
      <span className="relative flex items-center justify-between gap-2 pl-2.5 pr-2.5 ph:pl-3 py-1.5">
        <span className="flex items-center gap-1.5 min-w-0 overflow-hidden whitespace-nowrap text-left">
          <span className="flex flex-col leading-none">
            <span className="text-[10.5px] ph:text-[11px] font-black uppercase tracking-[0.08em]">Limited time offer</span>
            <span className="mt-[3px] flex items-baseline gap-1">
              <span className="text-[11px] font-bold text-[#3B0764]/80">{proName} at</span>
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
