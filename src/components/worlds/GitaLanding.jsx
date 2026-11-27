import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useAccess } from '../../context/AccessContext.jsx';
import { useWorlds } from '../../hooks/useWorlds.js';
import { setLastWorld, getLastLesson } from '../../utils/world.js';
import { gitaFreeLeft, gitaChapterOpen, gitaChaptersToBuy } from './GitaOffer.jsx';
import heroArt from '../../assets/images/gita_hero.webp';
import StatusIcon from './StatusIcon.jsx';
import OfferTag from '../features/Subscription/OfferTag.jsx';
import { GitaTrialBanner } from './GitaOffer.jsx';

// The Gita world's landing page, in the same poster style as Home: a hero with the Gita art (and the one button
// that matters: start or continue), then the chapter cards (each bought on its own, ₹99), then the chapters page.
const FONT = "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Inter', 'Segoe UI', sans-serif";
const SHADOW = '0 2px 12px rgba(0,0,0,0.55), 0 1px 2px rgba(0,0,0,0.5)';
const shortTitle = (t) => String(t || '').replace(/^\s*chapter\s*\d+\s*[:.\-–]\s*/i, '').replace(/\s*\(placeholder\)\s*$/i, '').trim();
const numberOf = (t, i) => (String(t || '').match(/chapter\s*(\d+)/i) || [])[1] || String(i + 1);

export default function GitaLanding({ isMobile = true }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { access } = useAccess();
  const { gitaChapters, loading } = useWorlds();
  const g = access?.gita || {};
  const free = gitaFreeLeft(g); // null when every chapter is open
  const price = Number(g.price) || 99; // one chapter
  const toBuy = gitaChaptersToBuy(g, gitaChapters);
  const owned = (g.ownedChapters || []).length;

  useEffect(() => { setLastWorld('gita', user); }, [user?._id]);

  const open = (ch) => navigate(`/learn?chapterId=${encodeURIComponent(ch._id)}&world=gita`);
  const last = getLastLesson(user);
  const resume = last?.world === 'gita' ? last : null;
  const heroAction = () => {
    if (resume) navigate(resume.url);
    else if (gitaChapters[0]) open(gitaChapters[0]);
  };

  // Free lessons are the first N across the chapters, in order
  let freeLeftToMark = g.hasPass ? 0 : Number(g.freeLessons) || 5;

  return (
    <div className={`w-full select-none bg-[#F5F5F7] ${isMobile ? 'min-h-full' : 'h-full overflow-y-auto px-6 py-4'}`} style={{ fontFamily: FONT, ...(isMobile ? { paddingBottom: 'calc(96px + env(safe-area-inset-bottom, 0px))' } : {}) }}>
      <div className={isMobile ? 'px-4 pt-3' : 'max-w-4xl mx-auto pb-10'}>
        <button type="button" onClick={() => navigate('/home')} className="inline-flex items-center gap-0.5 py-1 text-[15px] font-medium text-[#EA580C] cursor-pointer active:opacity-60">
          <span aria-hidden="true" className="text-[22px] leading-none -mt-0.5">‹</span> Home
        </button>

        {/* Hero: card-sized like Home's Gita card. The art sits on the right; the title on the dark colour at the left */}
        <div className={`relative mt-2 overflow-hidden rounded-[20px] bg-[#3A0F04] shadow-[0_18px_40px_-14px_rgba(0,0,0,0.45)] ${isMobile ? 'aspect-[1.586/1]' : 'aspect-[2.6/1]'}`}>
          <img src={heroArt} alt="Arjun and Krishna" className={`absolute right-0 top-0 h-full object-cover ${isMobile ? 'w-[60%] object-center' : 'w-[55%] object-[center_30%]'}`} decoding="async" />
          <span className="absolute inset-0" style={{ background: 'linear-gradient(to right, #3A0F04 0%, #3A0F04 40%, rgba(58,15,4,0.55) 50%, rgba(58,15,4,0) 64%), linear-gradient(to top, rgba(28,8,2,0.8) 0%, rgba(28,8,2,0.3) 35%, rgba(28,8,2,0) 55%)' }} aria-hidden="true" />
          <span className="absolute inset-0 rounded-[20px] ring-1 ring-inset ring-white/10" aria-hidden="true" />

          <div className={`absolute text-white ${isMobile ? 'left-5 top-4 max-w-[52%]' : 'left-8 top-7 max-w-[45%]'}`}>
            <p className={`${isMobile ? 'text-[10.5px]' : 'text-[12px]'} font-semibold uppercase tracking-[0.22em] text-white/80`} style={{ textShadow: SHADOW }}>Gita world</p>
            <h1 className={`mt-1 ${isMobile ? 'text-[23px]' : 'text-[38px]'} font-black uppercase leading-[0.95] tracking-[0.02em]`} style={{ textShadow: SHADOW }}>Bhagavad<br />Gita</h1>
            {!isMobile && <p className="mt-3 text-[15px] font-medium text-white/85 leading-snug" style={{ textShadow: SHADOW }}>Answers to life's big questions, through the story of Arjun and Krishna.</p>}
          </div>

          <div className={`absolute text-white ${isMobile ? 'left-4 right-4 bottom-4' : 'left-8 bottom-7 max-w-[45%]'}`}>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={heroAction}
                disabled={!gitaChapters.length}
                className="shrink-0 rounded-full bg-[#F5F5F7] px-4 py-2 text-[14px] font-semibold text-[#1D1D1F] shadow-[0_6px_18px_rgba(0,0,0,0.35)] cursor-pointer active:scale-[0.97] transition-transform disabled:opacity-60"
              >
                {resume ? 'Continue' : 'Start now'}
              </button>
              <span className="min-w-0 text-[13px] leading-tight" style={{ textShadow: SHADOW }}>
                {free ? (
                  <>
                    <span className="block font-bold truncate"><StatusIcon name={free.left > 0 ? 'gift' : 'lock'} className="w-[14px] h-[14px] mr-1" />{free.left > 0 ? (free.left === free.total ? `${free.total} free lessons` : `${free.left} of ${free.total} free lessons left`) : 'Free lessons done'}</span>
                    <span className="block text-white/80 truncate">{owned ? `${owned} ${owned === 1 ? 'chapter' : 'chapters'} unlocked` : `then ₹${price} per chapter`}</span>
                  </>
                ) : (
                  <>
                    <span className="block font-bold"><StatusIcon name="star" className="w-[14px] h-[14px] mr-1 text-[#FCD34D]" />All chapters open</span>
                    <span className="block text-white/80 truncate">{resume?.title || 'Every lesson open'}</span>
                  </>
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Limited time offer (when one runs) and the free lessons card, as on the Science side */}
        {free && toBuy.length > 0 && (
          <div className="mt-4 flex flex-col gap-2.5">
            <OfferTag world="gita" rounded />
            <GitaTrialBanner />
          </div>
        )}

        {/* Chapters */}
        <div className="mt-7 mb-3 px-1 flex items-baseline justify-between">
          <h2 className="text-[22px] font-bold tracking-[-0.02em] text-[#1D1D1F]">Chapters</h2>
        </div>
        {loading && <p className="px-1 text-sm text-[#6E6E73]">Loading…</p>}
        {!loading && gitaChapters.length === 0 && (
          <div className="rounded-[20px] bg-white p-6 text-center text-[14px] font-medium text-[#6E6E73]">Gita chapters are coming soon.</div>
        )}
        {/* The earlier chapter cards: number, name, lessons and free tags */}
        <div className={`grid gap-3 ${isMobile ? 'grid-cols-2' : 'grid-cols-3'}`}>
          {gitaChapters.map((ch, i) => {
            const freeHere = Math.max(0, Math.min(freeLeftToMark, ch.lessons || 0));
            freeLeftToMark -= freeHere;
            const mine = !g.hasPass && gitaChapterOpen(g, ch._id);
            const forSale = !g.hasPass && !mine && freeHere < (ch.lessons || 0);
            return (
              <button
                key={ch._id}
                type="button"
                onClick={() => open(ch)}
                className="relative text-left rounded-2xl bg-white border-2 border-orange-100 p-3.5 shadow-[0_3px_0_0_#FED7AA] active:translate-y-0.5 active:shadow-none transition-all cursor-pointer min-h-[132px] flex flex-col"
              >
                <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#FB923C] to-[#EA580C] text-white font-black flex items-center justify-center text-[15px]">{numberOf(ch.title, i)}</span>
                <span className="mt-2 text-[15px] font-black text-[#101F33] leading-tight">{shortTitle(ch.title) || `Chapter ${i + 1}`}</span>
                <span className="mt-auto pt-2 flex flex-wrap items-center gap-1.5 text-[11.5px] font-bold text-slate-500">
                  {ch.lessons} {ch.lessons === 1 ? 'lesson' : 'lessons'}
                  {mine && <span className="rounded-full bg-green-100 text-green-800 px-1.5 py-px text-[10.5px] font-black">Unlocked</span>}
                  {!mine && freeHere > 0 && <span className="rounded-full bg-green-100 text-green-800 px-1.5 py-px text-[10.5px] font-black">{freeHere === ch.lessons ? 'Free' : `${freeHere} free`}</span>}
                  {forSale && <span className="inline-flex items-center gap-0.5 rounded-full bg-orange-100 text-[#9A3412] px-1.5 py-px text-[10.5px] font-black"><StatusIcon name="lock" className="w-[10px] h-[10px]" />₹{price}</span>}
                  {ch.isPublished === false && <span className="rounded-full bg-slate-200 text-slate-600 px-1.5 py-px text-[10.5px] font-black">Draft</span>}
                </span>
              </button>
            );
          })}
        </div>

        {/* The chapters page (unlock any chapter), while some are still to buy */}
        {free && toBuy.length > 0 && (
          <button
            type="button"
            onClick={() => navigate('/gita-pro')}
            className="mt-5 w-full flex items-center gap-3.5 rounded-[20px] bg-gradient-to-br from-[#F97316] to-[#EA580C] px-4 py-4 text-left text-white cursor-pointer active:scale-[0.99] transition-transform shadow-[0_14px_30px_-16px_rgba(234,88,12,0.6)]"
          >
            <span className="w-11 h-11 shrink-0 rounded-full bg-white/15 ring-1 ring-white/25 flex items-center justify-center text-[#FCD34D]" aria-hidden="true"><StatusIcon name="star" className="w-5 h-5" /></span>
            <span className="min-w-0 flex-1">
              <span className="block text-[16px] font-semibold">Unlock chapters</span>
              <span className="block text-[13px] text-white/75 truncate">₹{price} per chapter · pay once, yours for good</span>
            </span>
            <span className="shrink-0 rounded-full bg-[#FDE68A] px-3.5 py-1.5 text-[13px] font-semibold text-[#9A3412]">See chapters</span>
          </button>
        )}
      </div>
    </div>
  );
}
