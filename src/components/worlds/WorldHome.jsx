import React, { useEffect, useState } from 'react';
import HeaderBar from '../layout/home/HeaderBar.jsx';
import { trialMsLeft, formatTrialLeft } from '../../context/AccessContext.jsx';
import { useHomeArt } from '../../hooks/useHomeArt.js';
import squadImage from '../../assets/images/solve_squad_characters.webp';
import gitaArt from '../../assets/images/gita_hero.webp';
import StatusIcon from './StatusIcon.jsx';

// Home with two big world cards (Science, Gita) on an illustrated page background, per the client's design.
// The three pictures (page background, Science card, Gita card) come from the "home_art" setting, so they can be
// changed without an app update; until set, the pictures built into the app are used.
//
// Picture sizes the design expects (see the design brief):
//   page background: one 1080 x 2340 picture with a plain colour band in the middle (fits every phone height),
//   card pictures 1200 x 750 (16:10). Text and buttons are drawn by the app, never baked into the pictures.

// Re-render every 30 s so the trial time stays current
const useMinuteTick = () => {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(t);
  }, []);
  return now;
};

// Built-in pictures, used until the client's art is set. Each needs its own placement and shading.
const FALLBACK = {
  science: {
    bg: 'radial-gradient(90% 120% at 70% 30%, #3B82F6 0%, #1E3A8A 55%, #0A1633 100%)',
    src: squadImage,
    img: 'left-0 top-[24%] w-full h-auto',
    scrim: 'linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0) 30%), linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.25) 30%, rgba(0,0,0,0) 50%)',
  },
  gita: {
    bg: 'linear-gradient(140deg, #2A0A03 0%, #7C2D12 55%, #EA580C 100%)',
    src: gitaArt,
    img: 'right-0 top-0 h-full w-[62%] object-cover object-center',
    scrim: 'linear-gradient(to right, #3A0F04 0%, #3A0F04 36%, rgba(58,15,4,0.55) 48%, rgba(58,15,4,0) 64%), linear-gradient(to top, rgba(28,8,2,0.75) 0%, rgba(28,8,2,0.25) 30%, rgba(28,8,2,0) 50%)',
  },
};
// With the client's full-card art: a soft shade behind the title (top left) and the button row (bottom)
const ART_SCRIM = 'linear-gradient(160deg, rgba(0,0,0,0.38) 0%, rgba(0,0,0,0) 42%), linear-gradient(to top, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0) 30%)';
const TEXT_SHADOW = '0 2px 10px rgba(0,0,0,0.45), 0 1px 2px rgba(0,0,0,0.4)';

const PlayIcon = () => (
  <span className="w-6 h-6 rounded-full bg-gradient-to-br from-[#8B5CF6] to-[#6D28D9] flex items-center justify-center shadow-[0_2px_6px_rgba(109,40,217,0.45)]" aria-hidden="true">
    <svg viewBox="0 0 24 24" className="w-3 h-3 ml-0.5" fill="#fff"><path d="M7 4.5v15l12-7.5z" /></svg>
  </span>
);
const BookIcon = () => (
  <svg viewBox="0 0 24 24" className="w-[14px] h-[14px] shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M2 5.5A2.5 2.5 0 0 1 4.5 3H11v17H4.5A2.5 2.5 0 0 0 2 22.5zM22 5.5A2.5 2.5 0 0 0 19.5 3H13v17h6.5a2.5 2.5 0 0 1 2.5 2.5z" />
  </svg>
);

const Door = ({ world, art, title, line, sub, cta, status, onClick }) => {
  const f = FALLBACK[world];
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative w-full aspect-[16/10] overflow-hidden rounded-[22px] text-left text-white cursor-pointer transition-transform duration-300 ease-out active:scale-[0.98] ring-2 ring-white/80 shadow-[0_14px_30px_-12px_rgba(15,27,61,0.45)]"
      style={{ background: f.bg }}
    >
      {art
        ? <img src={art} alt="" aria-hidden="true" className="pointer-events-none absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]" decoding="async" />
        : <img src={f.src} alt="" aria-hidden="true" className={`pointer-events-none absolute ${f.img} max-w-none`} decoding="async" />}
      <span className="pointer-events-none absolute inset-0" style={{ background: art ? ART_SCRIM : f.scrim }} aria-hidden="true" />

      {/* Title: top left */}
      <div className="absolute left-5 top-4" style={{ textShadow: TEXT_SHADOW }}>
        <p className="text-[36px] font-black uppercase leading-[0.95] tracking-[0.03em]" style={{ fontFamily: "var(--f-display, 'Fredoka', sans-serif)" }}>{title}</p>
        <div className="mt-1 flex items-center gap-2" aria-hidden="true">
          <span className="h-[2px] w-6 rounded-full bg-white/90" />
          <span className="text-[11px] font-bold uppercase tracking-[0.35em]">World</span>
          <span className="h-[2px] w-6 rounded-full bg-white/90" />
        </div>
      </div>

      {/* Bottom bar: frosted glass so the text reads on any picture. Button, then free access and the tagline */}
      <div className="absolute left-2.5 right-2.5 bottom-2.5 flex items-center gap-3 rounded-[18px] bg-[#0B1023]/45 backdrop-blur-md ring-1 ring-white/15 p-1.5 pr-3 shadow-[0_6px_18px_rgba(0,0,0,0.25)]">
        <span className="shrink-0 whitespace-nowrap inline-flex items-center gap-2 rounded-[14px] bg-white pl-3.5 pr-1.5 py-1.5 text-[14.5px] font-bold text-[#1E1B4B] shadow-[0_2px_8px_rgba(0,0,0,0.2)]">
          {cta} <PlayIcon />
        </span>
        <span className="min-w-0 flex-1 leading-tight">
          {status?.tone === 'warn' ? (
            <span className="inline-flex max-w-full items-center gap-1 rounded-full bg-[#FDE68A] px-2 py-0.5 text-[11.5px] font-bold text-[#78350F]">
              {status.icon && <StatusIcon name={status.icon} className="w-[12px] h-[12px]" />}<span className="truncate">{status.text}</span>
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[13.5px] font-bold text-white">
              {status?.icon ? <StatusIcon name={status.icon} className="w-[13px] h-[13px]" /> : <BookIcon />}<span className="truncate">{status?.text || 'Free lessons'}</span>
            </span>
          )}
          <span className="mt-0.5 block truncate text-[12px] font-medium text-white/80">{sub || line}</span>
        </span>
      </div>
    </button>
  );
};

// The one extra on Home: share HoshiYaar with friends (WhatsApp)
const ShareRow = ({ onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="mt-4 w-full flex items-center gap-3.5 rounded-[20px] bg-white/95 backdrop-blur px-4 py-3.5 text-left cursor-pointer transition-transform active:scale-[0.99] shadow-[0_1px_2px_rgba(0,0,0,0.04),0_10px_24px_-12px_rgba(15,27,61,0.3)]"
  >
    <span className="w-11 h-11 shrink-0 rounded-full bg-[#E8F8EE] flex items-center justify-center" aria-hidden="true">
      <svg viewBox="0 0 24 24" className="w-[21px] h-[21px]" fill="none" stroke="#16A34A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    </span>
    <span className="min-w-0 flex-1">
      <span className="block text-[16px] font-bold text-[#0F1B3D]">Share with friends</span>
      <span className="block text-[13px] font-medium text-[#5B6B85] truncate">Learn together on HoshiYaar</span>
    </span>
    <span className="shrink-0 inline-flex items-center gap-1.5 rounded-full bg-[#1E293B] px-3.5 py-2 text-[13.5px] font-semibold text-white">
      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor" aria-hidden="true"><path d="M14 5v4C7 10 4 15 3 20c2.5-3.5 6-5.1 11-5.1V19l7-7z" /></svg>
      Share
    </span>
  </button>
);

// Science: time left in the free trial (or Pro / trial over)
const scienceStatus = (access, now) => {
  if (!access || access.state === 'open') return null;
  if (access.hasPass || access.state === 'pass') return { icon: 'star', text: 'Science Pro' };
  if (access.locked || access.state === 'trial_ended') return { icon: 'lock', text: 'Free trial over', tone: 'warn' };
  const ms = trialMsLeft(access, now);
  if (ms == null) return { icon: 'clock', text: `${Number(access.trialHours) || 48}h free trial` };
  return { icon: 'clock', text: `Free trial: ${formatTrialLeft(ms)} left`, tone: ms < 6 * 3600e3 ? 'warn' : '' };
};

// Gita: free lessons left (no timer)
const gitaStatus = (gita) => {
  if (!gita) return { text: '5 free lessons' };
  if (gita.hasPass) return { icon: 'star', text: 'All chapters open' };
  const owned = (gita.ownedChapters || []).length;
  if (owned) return { icon: 'star', text: `${owned} ${owned === 1 ? 'chapter' : 'chapters'} unlocked` };
  const total = Number(gita.freeLessons) || 5;
  const left = gita.freeLeft ?? total;
  if (left <= 0) return { icon: 'lock', text: `Free lessons done · ₹${Number(gita.price) || 99} a chapter`, tone: 'warn' };
  return { text: left === total ? `${total} free lessons` : `${left} of ${total} free lessons left` };
};

export default function WorldHome({
  stars, myRank, myStreak, isMobile, firstName, lastWorld, science, gita, access, onScience, onGita, onShare,
}) {
  const now = useMinuteTick();
  const art = useHomeArt();
  const gitaFreeDone = !gita?.hasPass && (gita?.freeLeft ?? 1) <= 0;

  const scienceDoor = (
    <Door
      key="science"
      world="science"
      art={art.science}
      title="Science"
      line="Science fun and mini-experiments"
      sub={science?.title || ''}
      status={scienceStatus(access, now)}
      cta={science?.title ? 'Continue' : 'Start now'}
      onClick={onScience}
    />
  );
  const gitaDoor = (
    <Door
      key="gita"
      world="gita"
      art={art.gita}
      title="Gita"
      line="Answers to life's big questions"
      status={gitaStatus(gita)}
      cta={gitaFreeDone ? 'Open' : lastWorld === 'gita' ? 'Continue' : 'Start free'}
      onClick={onGita}
    />
  );
  const doors = lastWorld === 'gita' ? [gitaDoor, scienceDoor] : [scienceDoor, gitaDoor];

  // Page background: ONE picture (1080 x 2340) with a plain band in the middle. Its top part (rows 0-1170) is pinned
  // to the top of the page and its bottom part (rows 1638-2340) to the bottom; the plain colour fills the space
  // between, so short and tall phones both fit. Both parts scale with the phone's width.
  const mid = art.bgColor || '#E8F3FF';
  const split = isMobile && art.background;
  const pageBg = !isMobile && art.backgroundDesktop
    ? { backgroundImage: `url("${art.backgroundDesktop}")`, backgroundSize: 'cover', backgroundPosition: 'center top', backgroundColor: mid }
    : split
      ? { backgroundColor: mid }
      : { background: 'linear-gradient(180deg, #BFE3FF 0%, #E3F1FF 28%, #F4F9FF 60%, #E6F5E1 100%)' };
  const part = (pos, rows) => ({
    backgroundImage: `url("${art.background}")`,
    backgroundSize: '100% auto',
    backgroundPosition: `center ${pos}`,
    backgroundRepeat: 'no-repeat',
    aspectRatio: `1080 / ${rows}`,
  });

  return (
    <div
      className={`relative w-full font-sans select-none ${isMobile ? 'min-h-[100dvh]' : 'rounded-3xl overflow-hidden pb-6'}`}
      style={{ ...pageBg, ...(isMobile ? { paddingBottom: 'calc(88px + env(safe-area-inset-bottom, 0px))' } : {}) }}
    >
      {split && (
        <>
          <div className="pointer-events-none absolute inset-x-0 top-0" style={part('top', 1170)} aria-hidden="true" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0" style={part('bottom', 702)} aria-hidden="true" />
        </>
      )}
      <div className="relative">
      <HeaderBar stars={stars} myRank={myRank} myStreak={myStreak} centered />
      <div className={isMobile ? 'px-4' : 'max-w-4xl mx-auto px-4'}>
        <div className="mt-4 mb-4 px-1 flex items-start gap-1">
          <div>
            {firstName && <p className="text-[17px] font-semibold text-[#1E2A4A]">Hi {firstName},</p>}
            <p className="text-[28px] font-black leading-tight text-[#0F1B3D]" style={{ fontFamily: "var(--f-display, 'Fredoka', sans-serif)" }}>Where to today?</p>
          </div>
        </div>
        <div className={isMobile ? 'flex flex-col gap-4' : 'grid grid-cols-2 gap-5'}>
          {doors}
        </div>
        <ShareRow onClick={onShare} />
      </div>
      </div>
    </div>
  );
}
