import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAccess } from '../../context/AccessContext.jsx';
import { useWorlds } from '../../hooks/useWorlds.js';
import { clarityEvent } from '../../utils/clarity.js';
import StatusIcon from './StatusIcon.jsx';

// The Gita world's own prompts (the Science trial and offer never show in the Gita world). Gita is sold per chapter:
// the first free lessons, then ₹99 opens one chapter for good.
//   GitaOfferModal  the pop-up, shown by ProOfferHost while the learner is in the Gita world
//   GitaFreeCard    the free lessons card on the Gita page, the Gita lesson map and lesson-complete screen

/** Whether a Gita chapter is open for this learner: bought it, or every chapter is open (admin, paywall off) */
export const gitaChapterOpen = (gita, chapterId) =>
  Boolean(gita?.hasPass) || Boolean(chapterId && (gita?.ownedChapters || []).includes(String(chapterId)));

/** The Gita chapters still to buy, in order */
export const gitaChaptersToBuy = (gita, chapters = []) =>
  (gita?.hasPass ? [] : chapters.filter((c) => !gitaChapterOpen(gita, c._id)));

/** Where "unlock" goes: the chapter's checkout, or the chapters page */
export const gitaBuyPath = (chapterId) =>
  (chapterId ? `/gita-pro?chapter=${encodeURIComponent(chapterId)}&buy=1` : '/gita-pro');

/** How many Gita lessons are free (Admin → Payments → Gita world; 0 allowed). 5 only if the server sent none */
export const gitaFreeTotal = (gita) => {
  const n = Number(gita?.freeLessons);
  return Number.isFinite(n) && gita?.freeLessons != null ? Math.max(0, n) : 5;
};

/** Free Gita lessons left (null when every chapter is open) */
export const gitaFreeLeft = (gita) => {
  if (!gita || gita.hasPass) return null;
  const total = gitaFreeTotal(gita);
  return { left: Math.max(0, gita.freeLeft ?? total), total };
};

const Tick = () => (
  <span className="w-[18px] h-[18px] shrink-0 rounded-full bg-[#22C55E] flex items-center justify-center" aria-hidden="true">
    <svg viewBox="0 0 12 12" className="w-2.5 h-2.5"><path d="M2.5 6.2 5 8.5 9.5 3.5" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
  </span>
);

export function GitaOfferModal({ isOpen, onClose, access }) {
  const navigate = useNavigate();
  const { gitaChapters } = useWorlds();
  const [leaving, setLeaving] = useState(false);
  useEffect(() => { if (isOpen) { setLeaving(false); clarityEvent('paywall_seen'); } }, [isOpen]);
  const g = access?.gita;
  const free = gitaFreeLeft(g);
  // The chapter to offer: the first one not bought yet
  const next = gitaChaptersToBuy(g, gitaChapters)[0];
  if (!isOpen || !free || !next) return null;

  const price = Number(g.price) || 99;
  const was = Number(g.originalPrice) || 0;
  const off = was > price ? Math.round((1 - price / was) * 100) : 0;
  const close = () => {
    if (leaving) return;
    setLeaving(true);
    setTimeout(() => onClose?.(), 260);
  };
  const grab = () => { onClose?.(); navigate(gitaBuyPath(next._id)); };

  return (
    <div onClick={close} className={`fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-4 select-none transition-opacity duration-300 ${leaving ? 'opacity-0' : 'opacity-100'}`}>
      <style>{'@keyframes gitaPop{0%{transform:scale(.85) translateY(18px);opacity:0}60%{transform:scale(1.03)}100%{transform:scale(1) translateY(0);opacity:1}}'}</style>
      <div
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Unlock a Gita chapter"
        className={`relative w-full max-w-[340px] overflow-hidden rounded-[28px] bg-gradient-to-b from-[#FB923C] via-[#F97316] to-[#EA580C] px-5 pt-7 pb-4 text-center text-white shadow-[0_24px_70px_rgba(234,88,12,0.4)] ring-1 ring-white/30 transition-all duration-300 ${leaving ? 'scale-90 opacity-0' : 'animate-[gitaPop_0.45s_ease-out]'}`}
      >
        <span className="pointer-events-none absolute -top-12 -right-10 w-44 h-44 rounded-full bg-[#F59E0B]/30 blur-3xl" aria-hidden="true" />
        <button type="button" onClick={close} aria-label="Close" className="absolute top-3 right-3 z-20 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white/80 flex items-center justify-center text-sm font-bold cursor-pointer">✕</button>

        <div className="relative">
          <p className="text-[12px] font-black uppercase tracking-[0.2em] text-white/85">Gita world</p>
          <h3 className="mt-1 text-[24px] font-black leading-tight">
            Unlock <span className="text-[#FEF3C7]">a chapter</span>
          </h3>
          <p className="mt-1 text-[13px] font-semibold text-white/90">
            {free.left > 0 ? `${free.left} of ${free.total} free lessons left` : free.total ? `You've finished the ${free.total} free lessons` : 'Every chapter, one at a time'}
          </p>

          <div className="mt-3 flex items-center justify-center gap-3">
            <span className="text-[50px] font-black leading-none text-white drop-shadow-[0_2px_6px_rgba(124,45,18,0.35)]">₹{price}</span>
            {off > 0 && (
              <span className="flex flex-col items-start gap-1">
                <span className="text-[18px] font-bold leading-none text-white/75 line-through decoration-[#7C2D12] decoration-[2.5px]">₹{was}</span>
                <span className="px-2 py-0.5 rounded-md bg-[#22C55E] text-white text-[12px] font-black shadow-md">{off}% OFF</span>
              </span>
            )}
          </div>
          <p className="mt-1 text-[12px] font-bold text-white/85">per chapter</p>

          <div className="mt-3.5 mx-auto w-fit flex flex-col gap-1.5 text-left">
            <span className="flex items-center gap-2 text-[13px] font-bold text-white/90"><Tick />Every lesson and shloka in it</span>
            <span className="flex items-center gap-2 text-[13px] font-bold text-white/90"><Tick />Stories of Arjuna and Krishna</span>
            <span className="flex items-center gap-2 text-[13px] font-bold text-white/90"><Tick />Pay once, it stays open for good</span>
          </div>

          <button
            type="button"
            onClick={grab}
            className="mt-4 w-full h-[52px] rounded-full bg-gradient-to-b from-[#FDE68A] to-[#F59E0B] text-[#431407] text-[17px] font-black shadow-[0_5px_0_0_#B45309,0_12px_24px_rgba(245,158,11,0.35)] active:translate-y-[3px] active:shadow-[0_2px_0_0_#B45309] transition-all cursor-pointer"
          >
            Unlock chapter at ₹{price} →
          </button>
          <button type="button" onClick={close} className="mt-2.5 text-[13px] font-semibold text-white/80 cursor-pointer">Maybe later</button>
        </div>
      </div>
    </div>
  );
}


// What the Gita banners need: free lessons left, the next chapter to buy, the price. null = nothing to show
// (every chapter open, or all bought)
const useGitaBanner = () => {
  const { access } = useAccess();
  const { gitaChapters } = useWorlds();
  const g = access?.gita;
  const free = gitaFreeLeft(g);
  const toBuy = gitaChaptersToBuy(g, gitaChapters);
  if (!free || (gitaChapters.length > 0 && toBuy.length === 0)) return null;
  return {
    free,
    done: free.left <= 0,
    next: toBuy[0] || null,
    bought: (g.ownedChapters || []).length > 0,
    price: Number(g.price) || 99,
    was: Number(g.originalPrice) || 0,
    testView: Boolean(access?.testView),
  };
};

const BANNER_CSS = `
  @keyframes hyGitaBob{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}
  @keyframes hyGitaShine{0%,55%{transform:translateX(-120%) skewX(-20deg)}100%{transform:translateX(260%) skewX(-20deg)}}
  @keyframes hyGitaBreathe{0%,100%{opacity:.25}50%{opacity:.55}}
  .hy-gita-bob{animation:hyGitaBob 2s ease-in-out infinite}
  .hy-gita-shine{animation:hyGitaShine 2.6s ease-in-out infinite}
  .hy-gita-breathe{animation:hyGitaBreathe 3s ease-in-out infinite}
  @media (prefers-reduced-motion:reduce){.hy-gita-bob,.hy-gita-shine,.hy-gita-breathe{animation:none}}
`;

// Gold medallion with the gift (free lessons) or the lock (done), in the place of the Science stopwatch
const Medallion = ({ done, className = '' }) => (
  <span className={`relative shrink-0 rounded-full bg-gradient-to-b from-[#FDE68A] via-[#F59E0B] to-[#B45309] p-[3px] shadow-[0_0_14px_rgba(252,211,77,0.4)] ${className}`} aria-hidden="true">
    <span className="w-full h-full rounded-full bg-[#2A0E04] flex items-center justify-center text-[#FDE68A]">
      <StatusIcon name={done ? 'lock' : 'gift'} className="w-[55%] h-[55%]" />
    </span>
  </span>
);

const TestTag = ({ show }) => (show ? (
  <span className="absolute -top-2 left-4 z-20 rounded-full bg-[#2A0E04] border border-[#FCD34D]/60 px-1.5 py-px text-[8px] font-black uppercase tracking-wider text-[#FCD34D]">Test view</span>
) : null);

/**
 * The Gita page's big card, laid out like the Science free-trial card: free lessons left on the left (Gita has no
 * timer), Unlock and the chapter price on the right. Gita colours, the same gold frame.
 */
export function GitaTrialBanner({ className = '' }) {
  const navigate = useNavigate();
  const b = useGitaBanner();
  if (!b) return null;
  const { free, done, next, price, was, bought } = b;
  const go = () => navigate(next ? gitaBuyPath(next._id) : '/gita-pro');
  return (
    <div className={`relative w-full rounded-[22px] p-[2px] bg-gradient-to-br from-[#FDE68A] via-[#D97706] to-[#FDE68A] shadow-[0_10px_24px_rgba(124,45,18,0.35)] ${className}`}>
      <style>{BANNER_CSS}</style>
      <TestTag show={b.testView} />
      <div className="relative overflow-hidden rounded-[20px] bg-gradient-to-br from-[#7C2D12] via-[#5A1A08] to-[#2A0E04] px-2.5 min-[380px]:px-4 py-3">
        <span className="pointer-events-none absolute -top-10 -left-6 w-40 h-24 rounded-full bg-[radial-gradient(closest-side,rgba(255,255,255,0.14),rgba(255,255,255,0))]" aria-hidden="true" />
        <span className="pointer-events-none absolute -bottom-10 right-0 w-36 h-24 rounded-full bg-[radial-gradient(closest-side,rgba(245,158,11,0.28),rgba(245,158,11,0))]" aria-hidden="true" />
        <div className="relative flex items-center justify-between gap-2 min-[380px]:gap-3">
          <div className="flex items-center gap-2 min-[380px]:gap-3 min-w-0">
            <Medallion done={done} className="w-11 h-11 min-[380px]:w-[54px] min-[380px]:h-[54px]" />
            {done ? (
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-wider text-[#FDA4AF] whitespace-nowrap">{free.total ? 'Free lessons done' : 'Gita chapters'}</p>
                <p className="font-black text-white text-sm sm:text-base leading-tight">{free.total ? `All ${free.total} free lessons played` : 'Unlock a chapter to begin'}</p>
                <p className="text-[11px] font-bold text-[#FED7AA]/85">{bought ? 'Unlock the next chapter' : 'Played lessons stay open'}</p>
              </div>
            ) : (
              <div className="min-w-0">
                <p className="text-[11px] min-[380px]:text-[13px] font-black uppercase tracking-[0.2em] text-[#FCD34D] whitespace-nowrap leading-none mb-1.5">Free lessons</p>
                <p className="hy-gita-bob font-black leading-none tabular-nums text-white tracking-tight text-[1.55rem] min-[360px]:text-[1.85rem] min-[390px]:text-[2.2rem]">
                  {free.left}<span className="text-[0.52em] font-black text-[#FED7AA] ml-1">of {free.total}</span>
                </p>
                <p className="text-[12px] min-[380px]:text-[14px] font-bold text-[#FED7AA] leading-tight whitespace-nowrap mt-0.5">left</p>
              </div>
            )}
          </div>
          <div className="w-px self-stretch my-1 bg-gradient-to-b from-transparent via-[#FCD34D]/60 to-transparent" />
          <div className="relative flex flex-col items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={go}
              className="px-2.5 min-[380px]:px-4 py-1.5 min-[380px]:py-2 rounded-full bg-gradient-to-b from-[#FEF3C7] via-[#FCD34D] to-[#F59E0B] border border-[#FFF7D6] text-[#431407] font-black text-[13px] min-[380px]:text-[15px] whitespace-nowrap shadow-[0_3px_0_0_#B45309,0_0_16px_rgba(252,211,77,0.45)] active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
            >
              {done ? 'Unlock' : 'Unlock Now'} →
            </button>
            <div className="flex items-baseline gap-1.5">
              <span className="text-[20px] min-[380px]:text-[24px] leading-none font-black text-white">₹{price}</span>
              {was > price && <span className="text-xs min-[380px]:text-sm font-bold text-white/55 line-through decoration-[#FB7185] decoration-2">₹{was}</span>}
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider text-[#FCD34D]/90 leading-none">per chapter</span>
          </div>
        </div>
        {/* free lessons left, as a line along the bottom */}
        {!done && (
          <span className="absolute inset-x-0 bottom-0 h-1 bg-white/10" aria-hidden="true">
            <span className="block h-full rounded-r-full bg-gradient-to-r from-[#F59E0B] to-[#FDE68A]" style={{ width: `${Math.max(4, (free.left / free.total) * 100)}%` }} />
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * The slim Gita bar, like the Science trial bar: pinned above a Gita chapter's lesson map ('bar'), or a card on the
 * lesson-complete page ('card'). "Free lessons 3 of 5 left   [Unlock ₹99]".
 */
export function GitaFreeBar({ variant = 'bar', className = '' }) {
  const navigate = useNavigate();
  const b = useGitaBanner();
  if (!b) return null;
  const { free, done, next, price } = b;
  const card = variant === 'card';
  return (
    <div
      className={`relative overflow-hidden ${card ? 'rounded-2xl border border-[#FCD34D]/50 shadow-[0_6px_16px_rgba(124,45,18,0.25)]' : 'border-b border-[#FCD34D]/40 shadow-[0_2px_10px_rgba(42,14,4,0.25)]'} bg-gradient-to-r from-[#7C2D12] via-[#5A1A08] to-[#2A0E04] ${className}`}
    >
      <style>{BANNER_CSS}</style>
      <span className="hy-gita-breathe pointer-events-none absolute -left-6 top-1/2 -translate-y-1/2 w-28 h-16 rounded-full bg-[radial-gradient(closest-side,rgba(252,211,77,0.35),rgba(252,211,77,0))]" aria-hidden="true" />
      <div className={`relative flex items-center justify-between gap-2 ${card ? 'px-3 min-[380px]:px-3.5 py-3' : 'px-2.5 min-[380px]:px-3.5 py-2.5'}`}>
        <div className="flex items-center gap-1.5 min-[380px]:gap-2 min-w-0 overflow-hidden">
          <span className="shrink-0 text-[#FCD34D]" aria-hidden="true"><StatusIcon name={done ? 'lock' : 'gift'} className="w-[22px] h-[22px]" /></span>
          {done ? (
            <p className="min-w-0 text-[14px] min-[380px]:text-[15px] font-black text-white leading-tight truncate">
              {free.total ? <>Free lessons done <span className="font-bold text-[#FED7AA]">· played lessons stay open</span></> : 'Unlock a chapter to begin'}
            </p>
          ) : (
            <p className="min-w-0 flex items-baseline gap-1.5 whitespace-nowrap">
              <span className={`${card ? 'hidden min-[380px]:inline' : ''} text-[11px] min-[380px]:text-[12px] font-black uppercase tracking-wider text-[#FCD34D]`}>Free lessons</span>
              <span className={`${card ? 'text-[15px] min-[380px]:text-[16px]' : 'text-[16px] min-[380px]:text-[17px]'} font-black tabular-nums text-white`}>
                {free.left}<span className="text-[0.72em] font-black text-[#FED7AA] ml-1">of {free.total} left</span>
              </span>
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => navigate(next ? gitaBuyPath(next._id) : '/gita-pro')}
          className="relative overflow-hidden shrink-0 rounded-full bg-gradient-to-b from-[#FEF3C7] via-[#FCD34D] to-[#F59E0B] py-1.5 text-[12px] min-[380px]:text-[14px] font-black text-[#431407] shadow-[0_2px_0_0_#B45309,0_0_12px_rgba(252,211,77,0.45)] px-2.5 min-[380px]:px-3 active:translate-y-px active:shadow-none whitespace-nowrap cursor-pointer"
        >
          <span className="hy-gita-shine pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/80 to-transparent" aria-hidden="true" />
          <span className="relative">Unlock ₹{price}</span>
        </button>
      </div>
      {!done && (
        <div className="absolute inset-x-0 bottom-0 h-1 bg-white/10" aria-hidden="true">
          <div className="h-full rounded-r-full bg-gradient-to-r from-[#F59E0B] to-[#FDE68A]" style={{ width: `${Math.max(4, (free.left / free.total) * 100)}%` }} />
        </div>
      )}
    </div>
  );
}

// Older name, kept for any screen that still imports it
export const GitaFreeCard = ({ rounded = true, className = '' }) => <GitaFreeBar variant={rounded ? 'card' : 'bar'} className={className} />;
