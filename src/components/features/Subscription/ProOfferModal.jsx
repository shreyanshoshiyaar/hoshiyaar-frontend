import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useServerNow } from '../../../hooks/useServerNow.js';
import { useAuth } from '../../../context/AuthContext.jsx';
import { getIntroVideoUrl, hasSeenIntro, isIntroOpen, INTRO_CLOSED_EVENT } from '../../../utils/onboardingVideo.js';

const pad = (n) => String(n).padStart(2, '0');

// The offer runs while Admin → Payments has an end time in the future
export const offerEndsAtMs = (access) => {
  const t = access?.plan?.offerEndsAt ? new Date(access.plan.offerEndsAt).getTime() : 0;
  return Number.isFinite(t) ? t : 0;
};

export const offerRunning = (access, now = Date.now()) => {
  if (!access || access.state === 'pass' || access.state === 'open') return false;
  const ends = offerEndsAtMs(access);
  return Boolean(ends && ends > now);
};

// How often: every 15 minutes, counted from when the student last closed it
const LAST_KEY = 'hy_pro_offer_last';
const EVERY_MS = 15 * 60 * 1000;
const lastShown = () => { try { return Number(localStorage.getItem(LAST_KEY)) || 0; } catch (_) { return 0; } };
const markNow = () => { try { localStorage.setItem(LAST_KEY, String(Date.now())); } catch (_) {} };

/**
 * The app's one pop-up: the limited time offer. While an offer runs (Admin → Payments), students without
 * Pro see it on the Home or Learn page, the first time they get there and then every 15 minutes
 * (counted from when they last closed it), including while they stay on the page.
 */
export function ProOfferHost({ active, access }) {
  const [open, setOpen] = useState(false);
  const running = offerRunning(access);
  const { user } = useAuth();
  const userId = user?._id ? String(user._id) : '';

  useEffect(() => {
    if (!active || !running || open) return;
    let timer = null;
    let stopped = false;
    // The onboarding video comes first: wait while it plays, or while it is still due to open
    const videoFirst = async () => {
      if (isIntroOpen()) return true;
      if (!userId || hasSeenIntro(userId)) return false;
      const url = await getIntroVideoUrl().catch(() => '');
      return Boolean(url) && !hasSeenIntro(userId);
    };
    const check = async () => {
      if (timer || stopped || document.visibilityState === 'hidden') return;
      if (Date.now() - lastShown() < EVERY_MS) return;
      if (await videoFirst()) return;
      if (timer || stopped) return;
      timer = setTimeout(() => {
        timer = null;
        if (stopped || isIntroOpen()) return;
        markNow();
        setOpen(true);
      }, 900);
    };
    const afterVideo = () => setTimeout(check, 1500);
    check();
    const id = setInterval(check, 20 * 1000);
    document.addEventListener('visibilitychange', check);
    window.addEventListener(INTRO_CLOSED_EVENT, afterVideo);
    return () => {
      stopped = true;
      clearInterval(id);
      if (timer) clearTimeout(timer);
      document.removeEventListener('visibilitychange', check);
      window.removeEventListener(INTRO_CLOSED_EVENT, afterVideo);
    };
  }, [active, running, open, userId]);

  return <ProOfferModal isOpen={open} onClose={() => { markNow(); setOpen(false); }} access={access} />;
}

const Box = ({ value, label }) => (
  <div className="flex flex-col items-center">
    <div className="relative w-[52px] h-[50px] rounded-xl bg-[#1A0B2E] border border-[#FCD34D]/30 shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_6px_14px_rgba(0,0,0,0.35)] flex items-center justify-center overflow-hidden">
      <span className="absolute left-0 right-0 top-1/2 h-px bg-black/40" aria-hidden="true" />
      <span key={value} className="relative text-[26px] font-black tabular-nums leading-none text-[#FDE68A] animate-[offerTick_0.35s_ease-out]">
        {value}
      </span>
    </div>
    <span className="mt-1 text-[10px] font-black uppercase tracking-[0.14em] text-amber-200/80">{label}</span>
  </div>
);

// Drawn crown (no emoji)
const Crown = ({ className = '' }) => (
  <svg viewBox="0 0 64 48" className={className} aria-hidden="true">
    <defs>
      <linearGradient id="hyCrownG" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#FEF3C7" />
        <stop offset="45%" stopColor="#FCD34D" />
        <stop offset="100%" stopColor="#D97706" />
      </linearGradient>
    </defs>
    <path d="M6 16 L19 27 L32 6 L45 27 L58 16 L53 40 H11 Z" fill="url(#hyCrownG)" stroke="#B45309" strokeWidth="2" strokeLinejoin="round" />
    <rect x="10" y="39" width="44" height="6" rx="2" fill="#D97706" />
    <circle cx="32" cy="6" r="3.5" fill="#FEF3C7" /><circle cx="6" cy="16" r="3" fill="#FEF3C7" /><circle cx="58" cy="16" r="3" fill="#FEF3C7" />
    <circle cx="32" cy="29" r="4" fill="#A855F7" stroke="#FEF3C7" strokeWidth="1.5" />
    <circle cx="20" cy="33" r="2.6" fill="#F43F5E" /><circle cx="44" cy="33" r="2.6" fill="#22C55E" />
  </svg>
);

const Tick = () => (
  <span className="w-[18px] h-[18px] shrink-0 rounded-full bg-[#22C55E] flex items-center justify-center" aria-hidden="true">
    <svg viewBox="0 0 12 12" className="w-2.5 h-2.5"><path d="M2.5 6.2 5 8.5 9.5 3.5" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
  </span>
);

const Colon = () => <span className="mt-3 text-xl font-black text-[#FCD34D]/70">:</span>;

/**
 * Limited time offer pop-up: Pro price against the struck-through price, and a live countdown
 * to the end time set in Admin → Payments. "Grab the offer" opens the Pro page with checkout.
 */
export default function ProOfferModal({ isOpen, onClose, access }) {
  const navigate = useNavigate();
  const now = useServerNow();
  const [leaving, setLeaving] = useState(false);

  useEffect(() => { if (isOpen) setLeaving(false); }, [isOpen]);

  const ends = offerEndsAtMs(access);
  const msLeft = Math.max(0, ends - now);

  // The offer ran out while the pop-up was open
  useEffect(() => {
    if (isOpen && ends && msLeft <= 0) onClose?.();
  }, [isOpen, ends, msLeft, onClose]);

  if (!isOpen || !ends) return null;

  const close = () => {
    if (leaving) return;
    setLeaving(true);
    setTimeout(() => onClose?.(), 260);
  };
  const grab = () => {
    onClose?.();
    navigate('/subscription?offer=1');
  };

  const price = Number(access?.plan?.amount) || 99;
  const was = Number(access?.plan?.discountedFrom) || 0;
  const off = was > price ? Math.round((1 - price / was) * 100) : 0;
  const months = Math.round((Number(access?.plan?.durationDays) || 180) / 30);

  const total = Math.floor(msLeft / 1000);
  const d = Math.floor(total / 86400);
  const h = Math.floor((total % 86400) / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const lastDay = msLeft < 24 * 3600 * 1000;

  return (
    <div
      onClick={close}
      className={`fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-4 select-none transition-opacity duration-300 ${leaving ? 'opacity-0' : 'opacity-100'}`}
    >
      <style>{`
        @keyframes offerTick{0%{transform:translateY(-35%);opacity:0}100%{transform:translateY(0);opacity:1}}
        @keyframes offerPop{0%{transform:scale(.8) translateY(20px);opacity:0}60%{transform:scale(1.03)}100%{transform:scale(1) translateY(0);opacity:1}}
        @keyframes offerShine{0%{transform:translateX(-120%) skewX(-20deg)}60%,100%{transform:translateX(320%) skewX(-20deg)}}
        @keyframes offerWiggle{0%,100%{transform:rotate(-4deg)}50%{transform:rotate(4deg) scale(1.06)}}
        @keyframes offerGlow{0%,100%{box-shadow:0 0 0 0 rgba(251,191,36,.55)}50%{box-shadow:0 0 0 10px rgba(251,191,36,0)}}
      `}</style>

      <div
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Limited time offer"
        className={`relative w-full max-w-[340px] rounded-[30px] p-[2.5px] bg-gradient-to-br from-[#FDE68A] via-[#F59E0B] to-[#B45309] shadow-[0_24px_70px_rgba(245,158,11,0.35)] transition-all duration-300 ${leaving ? 'scale-90 opacity-0' : 'animate-[offerPop_0.5s_ease-out]'}`}
      >
        {/* Ribbon */}
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20 whitespace-nowrap px-4 py-1.5 rounded-full bg-gradient-to-r from-[#FDE68A] via-[#FCD34D] to-[#F59E0B] text-[#3B0764] text-[12px] font-black uppercase tracking-[0.16em] shadow-[0_6px_16px_rgba(245,158,11,0.5)] animate-[offerGlow_1.6s_ease-in-out_infinite]">
          Limited time offer
        </div>

        <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-b from-[#3B0764] via-[#4C1D95] to-[#1E1B4B] px-5 pt-7 pb-4 text-center text-white">
          <span className="pointer-events-none absolute -top-12 -right-10 w-44 h-44 rounded-full bg-[#F59E0B]/25 blur-3xl" aria-hidden="true" />
          <span className="pointer-events-none absolute -bottom-12 -left-10 w-44 h-44 rounded-full bg-[#A855F7]/30 blur-3xl" aria-hidden="true" />

          <button
            type="button"
            onClick={close}
            aria-label="Close"
            className="absolute top-3 right-3 z-20 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white/80 flex items-center justify-center text-sm font-bold cursor-pointer"
          >
            ✕
          </button>

          <div className="relative">
            <Crown className="mx-auto w-14 h-11 drop-shadow-[0_4px_10px_rgba(245,158,11,0.5)] animate-[offerWiggle_1.8s_ease-in-out_infinite]" />
            <h3 className="mt-1.5 text-[22px] font-black leading-tight">
              Get <span className="bg-gradient-to-r from-[#FDE68A] to-[#F59E0B] bg-clip-text text-transparent">HoshiYaar Pro</span>
            </h3>
            <p className="text-[13px] font-semibold text-indigo-200">Every chapter, every lesson · {months} months</p>

            {/* Price: offer price first, then the old price struck through and the discount */}
            <div className="mt-3 flex items-center justify-center gap-3">
              <span className="text-[54px] font-black leading-none bg-gradient-to-b from-[#FEF3C7] to-[#FBBF24] bg-clip-text text-transparent">₹{price}</span>
              {off > 0 && (
                <span className="flex flex-col items-start gap-1">
                  <span className="text-[19px] font-bold leading-none text-white/55 line-through decoration-[#F87171] decoration-[2.5px]">₹{was}</span>
                  <span className="px-2 py-0.5 rounded-md bg-[#22C55E] text-white text-[12.5px] font-black shadow-md">{off}% OFF</span>
                </span>
              )}
            </div>
            <p className="mt-1.5 text-[12.5px] font-bold text-indigo-200">
              {off > 0 && <>You save <span className="text-[#86EFAC] font-black">₹{was - price}</span> · </>}just ₹{Math.round(price / months)} a month
            </p>

            {/* What they get */}
            <div className="mt-3 mx-auto w-fit flex flex-col gap-1.5 text-left">
              <span className="flex items-center gap-2 text-[13px] font-bold text-white/90"><Tick />Every chapter and lesson unlocked</span>
              <span className="flex items-center gap-2 text-[13px] font-bold text-white/90"><Tick />Comics, blackboard and quizzes</span>
              <span className="flex items-center gap-2 text-[13px] font-bold text-white/90"><Tick />One-time payment, no auto-renewal</span>
            </div>

            {/* Countdown */}
            <p className={`mt-3.5 text-[12px] font-black uppercase tracking-[0.14em] ${lastDay ? 'text-[#FCA5A5] animate-pulse' : 'text-amber-200'}`}>
              {lastDay ? 'Last day! Offer ends in' : 'Offer ends in'}
            </p>
            <div className="mt-2 flex items-start justify-center gap-1.5" role="timer">
              {d > 0 && (<><Box value={pad(d)} label="Days" /><Colon /></>)}
              <Box value={pad(h)} label="Hrs" />
              <Colon />
              <Box value={pad(m)} label="Mins" />
              <Colon />
              <Box value={pad(s)} label="Secs" />
            </div>

            {/* Buy */}
            <button
              type="button"
              onClick={grab}
              className="relative overflow-hidden mt-4 w-full h-[54px] rounded-full bg-gradient-to-b from-[#FCD34D] to-[#F59E0B] text-[#3B0764] text-[18px] font-black shadow-[0_5px_0_0_#B45309,0_12px_24px_rgba(245,158,11,0.4)] active:translate-y-[3px] active:shadow-[0_2px_0_0_#B45309] transition-all cursor-pointer"
            >
              <span className="pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-white/50 animate-[offerShine_2.4s_ease-in-out_infinite]" aria-hidden="true" />
              <span className="relative">Grab the offer at ₹{price} →</span>
            </button>
            <button type="button" onClick={close} className="mt-2.5 text-[13px] font-semibold text-indigo-200/80 cursor-pointer">
              Maybe later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
