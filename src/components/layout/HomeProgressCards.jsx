import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import curriculumService from '../../services/curriculumService';
import { useStars } from '../../context/StarsContext.jsx';

const HexagonRankIcon = () => (
  <div className="relative w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center shrink-0">
    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-sm">
      <polygon points="50 3, 93 25, 93 75, 50 97, 7 75, 7 25" fill="url(#hexGradientHome)" />
      <defs>
        <linearGradient id="hexGradientHome" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#A855F7" />
          <stop offset="100%" stopColor="#7E22CE" />
        </linearGradient>
      </defs>
    </svg>
    <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
      <svg className="w-4 h-4 sm:w-5 sm:h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z" />
      </svg>
    </div>
  </div>
);

// High-contrast, vibrant, catchy ed-tech palettes for the 4 square tiles
export const CATCHY_PALETTES = [
  {
    id: 'emerald',
    name: 'Emerald Green',
    dotColor: 'bg-emerald-500',
    cardBorder: 'border-emerald-300 hover:border-emerald-400',
    cardShadow: 'shadow-[0_8px_20px_-4px_rgba(16,185,129,0.18),0_4px_0_0_#A7F3D0]',
    iconBg: 'bg-emerald-50 text-emerald-600 border border-emerald-200/80',
    activeBadge: 'bg-[#10B981] text-white',
    inProgressBadge: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    completedBadge: 'bg-emerald-50 text-emerald-700 border border-emerald-300',
    progressTrack: 'bg-emerald-100/70 border border-emerald-200/60',
    progressFill: 'bg-gradient-to-r from-emerald-400 to-teal-500',
    pctText: 'text-emerald-600',
    btn: 'bg-[#10B981] hover:bg-[#059669] text-white shadow-[0_3px_0_0_#047857]',
    icon: '🌱',
  },
  {
    id: 'blue',
    name: 'Electric Blue',
    dotColor: 'bg-blue-600',
    cardBorder: 'border-blue-300 hover:border-blue-400',
    cardShadow: 'shadow-[0_8px_20px_-4px_rgba(37,99,235,0.18),0_4px_0_0_#BFDBFE]',
    iconBg: 'bg-blue-50 text-blue-600 border border-blue-200/80',
    activeBadge: 'bg-[#2563EB] text-white',
    inProgressBadge: 'bg-blue-50 text-blue-700 border border-blue-200',
    completedBadge: 'bg-emerald-50 text-emerald-700 border border-emerald-300',
    progressTrack: 'bg-blue-100/70 border border-blue-200/60',
    progressFill: 'bg-gradient-to-r from-blue-500 to-indigo-600',
    pctText: 'text-blue-600',
    btn: 'bg-[#2563EB] hover:bg-[#1D4ED8] text-white shadow-[0_3px_0_0_#1E40AF]',
    icon: '⚡',
  },
  {
    id: 'purple',
    name: 'Cosmic Violet',
    dotColor: 'bg-purple-600',
    cardBorder: 'border-purple-300 hover:border-purple-400',
    cardShadow: 'shadow-[0_8px_20px_-4px_rgba(139,92,246,0.18),0_4px_0_0_#DDD6FE]',
    iconBg: 'bg-purple-50 text-purple-600 border border-purple-200/80',
    activeBadge: 'bg-[#8B5CF6] text-white',
    inProgressBadge: 'bg-purple-50 text-purple-700 border border-purple-200',
    completedBadge: 'bg-emerald-50 text-emerald-700 border border-emerald-300',
    progressTrack: 'bg-purple-100/70 border border-purple-200/60',
    progressFill: 'bg-gradient-to-r from-purple-500 to-indigo-500',
    pctText: 'text-purple-600',
    btn: 'bg-[#8B5CF6] hover:bg-[#7C3AED] text-white shadow-[0_3px_0_0_#6D28D9]',
    icon: '🔬',
  },
  {
    id: 'coral',
    name: 'Sunset Coral',
    dotColor: 'bg-rose-500',
    cardBorder: 'border-rose-300 hover:border-rose-400',
    cardShadow: 'shadow-[0_8px_20px_-4px_rgba(244,63,94,0.18),0_4px_0_0_#FECDD3]',
    iconBg: 'bg-rose-50 text-rose-600 border border-rose-200/80',
    activeBadge: 'bg-[#F43F5E] text-white',
    inProgressBadge: 'bg-rose-50 text-rose-700 border border-rose-200',
    completedBadge: 'bg-emerald-50 text-emerald-700 border border-emerald-300',
    progressTrack: 'bg-rose-100/70 border border-rose-200/60',
    progressFill: 'bg-gradient-to-r from-rose-400 to-orange-400',
    pctText: 'text-rose-600',
    btn: 'bg-[#F43F5E] hover:bg-[#E11D48] text-white shadow-[0_3px_0_0_#BE123C]',
    icon: '🔥',
  },
  {
    id: 'amber',
    name: 'Warm Amber',
    dotColor: 'bg-amber-500',
    cardBorder: 'border-amber-300 hover:border-amber-400',
    cardShadow: 'shadow-[0_8px_20px_-4px_rgba(245,158,11,0.18),0_4px_0_0_#FDE68A]',
    iconBg: 'bg-amber-50 text-amber-600 border border-amber-200/80',
    activeBadge: 'bg-[#F59E0B] text-white',
    inProgressBadge: 'bg-amber-50 text-amber-700 border border-amber-200',
    completedBadge: 'bg-emerald-50 text-emerald-700 border border-emerald-300',
    progressTrack: 'bg-amber-100/70 border border-amber-200/60',
    progressFill: 'bg-gradient-to-r from-amber-400 to-orange-500',
    pctText: 'text-amber-600',
    btn: 'bg-[#F59E0B] hover:bg-[#D97706] text-white shadow-[0_3px_0_0_#B45309]',
    icon: '⭐',
  },
];

const ICONS_LIST = ['🧪', '⚡', '🔬', '🌱', '🪐', '🧬', '🔭', '💡'];

export default function HomeProgressCards({
  user,
  leaderboardData = [],
  chaptersList: initialChapters = [],
  chapterStats: initialStats = {},
  currentChapterId,
  onSelectChapter,
  onNavigateToPractice,
  isMobile = false,
}) {
  const navigate = useNavigate();
  const { stars, refresh } = useStars();
  const [chapters, setChapters] = useState(initialChapters);
  const [stats, setStats] = useState(initialStats);
  const [loading, setLoading] = useState(initialChapters.length === 0);

  // Active theme index for rotating or picking base theme
  const [activePaletteIndex, setActivePaletteIndex] = useState(() => {
    const saved = localStorage.getItem('hoshiyaar_home_color_theme');
    const parsed = parseInt(saved, 10);
    return !isNaN(parsed) && parsed >= 0 && parsed < CATCHY_PALETTES.length ? parsed : 0;
  });

  const handleSelectPalette = (idx, e) => {
    e?.stopPropagation?.();
    setActivePaletteIndex(idx);
    try {
      localStorage.setItem('hoshiyaar_home_color_theme', String(idx));
    } catch (_) {}
  };

  // Sync stars on mount
  useEffect(() => {
    refresh?.();
  }, []);

  useEffect(() => {
    if (initialChapters && initialChapters.length > 0) {
      setChapters(initialChapters);
      setLoading(false);
    }
  }, [initialChapters]);

  useEffect(() => {
    if (initialStats && Object.keys(initialStats).length > 0) {
      setStats(initialStats);
    }
  }, [initialStats]);

  // Compute Rank & Streak
  const userIndex = leaderboardData?.findIndex(
    (d) => d.username === user?.username || d.userId === user?._id
  );
  const myRank = userIndex !== -1 && userIndex != null ? userIndex + 1 : user?.rank || '-';
  const myStreak = user?.streak || 0;

  // Fallback: fetch chapters if none provided
  useEffect(() => {
    let cancelled = false;
    if (chapters.length > 0) return;

    const fetchFallback = async () => {
      try {
        setLoading(true);
        const board = user?.board || 'CBSE';
        const classLevel = user?.classLevel || user?.class || user?.classTitle || 'Class 6';
        const subject = user?.subject || 'Science';

        const res = await curriculumService.listChapters(board, classLevel, subject);
        const list = res?.data || [];
        if (!cancelled && Array.isArray(list) && list.length > 0) {
          setChapters(list);

          const nextStats = {};
          for (const ch of list) {
            try {
              const mods = await curriculumService.listModules(ch._id);
              const total = mods?.data?.length || 0;
              nextStats[ch._id] = { total, completed: 0 };
            } catch (_) {
              nextStats[ch._id] = { total: 0, completed: 0 };
            }
          }
          if (!cancelled) setStats(nextStats);
        }
      } catch (e) {
        console.error('HomeProgressCards: Failed to fetch chapters fallback', e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchFallback();
    return () => {
      cancelled = true;
    };
  }, [chapters.length, user]);

  // Filter to show EXACTLY 4 CHAPTERS: 2 in-progress and 2 not-started
  const fourChapters = useMemo(() => {
    if (!chapters || chapters.length === 0) return [];

    // Deduplicate chapters that share the same Chapter number (e.g. two Chapter 9s), preferring the active/in-progress one
    const uniqueMap = new Map();
    chapters.forEach(ch => {
      const match = (ch.title || '').match(/Chapter\s+(\d+)/i);
      const chNum = match ? `ch_${match[1]}` : ch._id;
      const existing = uniqueMap.get(chNum);
      if (!existing) {
        uniqueMap.set(chNum, ch);
      } else {
        const stNew = stats[ch._id] || { completed: 0, total: 0 };
        const stOld = stats[existing._id] || { completed: 0, total: 0 };
        if (ch._id === currentChapterId || stNew.completed > stOld.completed || stNew.total > stOld.total) {
          uniqueMap.set(chNum, ch);
        }
      }
    });
    const dedupedChapters = Array.from(uniqueMap.values());

    const list = dedupedChapters
      .map((ch, idx) => {
        const st = stats[ch._id] || { total: 0, completed: 0 };
        const pct = st.total > 0 ? Math.min(100, Math.round((st.completed / st.total) * 100)) : 0;
        const isCompleted = pct === 100;
        const isCurrent = ch._id === currentChapterId;
        const isInProgress = (st.completed > 0 && !isCompleted) || isCurrent;
        const isComingSoon = Boolean(ch.title && ch.title.toLowerCase().includes('coming soon'));

        return {
          ...ch,
          chapterIndex: idx,
          st,
          pct,
          isCompleted,
          isInProgress,
          isCurrent,
          isComingSoon,
        };
      })
      .filter((c) => !c.isComingSoon);

    // 1. In-progress chapters (prioritizing currentChapterId first)
    const inProgressList = [];
    const current = list.find((c) => c.isCurrent);
    if (current) inProgressList.push(current);

    list.forEach((c) => {
      if (c.isInProgress && !inProgressList.some((x) => x._id === c._id)) {
        inProgressList.push(c);
      }
    });

    // 2. Not-started chapters (0 completed and not already in in-progress list)
    const notStartedList = list.filter(
      (c) => c.st.completed === 0 && !inProgressList.some((x) => x._id === c._id)
    );

    // Select up to 2 in-progress
    let selectedInProgress = inProgressList.slice(0, 2);

    // Select up to 2 not-started
    let selectedNotStarted = notStartedList.slice(0, 2);

    // If we have fewer than 2 in-progress, borrow from not-started
    if (selectedInProgress.length < 2) {
      const needed = 2 - selectedInProgress.length;
      const extra = notStartedList.filter((c) => !selectedNotStarted.some((x) => x._id === c._id));
      selectedNotStarted = [...selectedNotStarted, ...extra.slice(0, needed)];
    }

    // If we have fewer than 2 not-started, borrow from remaining in-progress
    if (selectedNotStarted.length < 2) {
      const needed = 2 - selectedNotStarted.length;
      const extra = inProgressList.filter((c) => !selectedInProgress.some((x) => x._id === c._id));
      selectedInProgress = [...selectedInProgress, ...extra.slice(0, needed)];
    }

    // Combine: 2 in-progress first, then 2 not-started
    const combined = [...selectedInProgress, ...selectedNotStarted];

    // If still less than 4 (rare small curriculum), fill from remaining
    if (combined.length < 4) {
      const remaining = list.filter((c) => !combined.some((x) => x._id === c._id));
      combined.push(...remaining.slice(0, 4 - combined.length));
    }

    return combined.slice(0, 4);
  }, [chapters, stats, currentChapterId]);

  const handleContinue = (ch) => {
    if (onSelectChapter) {
      onSelectChapter(ch);
    } else {
      navigate(`/learn?chapterId=${encodeURIComponent(ch._id)}`);
    }
  };

  const handleShareWhatsApp = (e) => {
    e?.stopPropagation?.();
    const playStoreUrl = 'https://play.google.com/store/apps/details?id=com.hoshiyaarlearning.app';
    const sender = user?.name || user?.username;
    const intro = sender ? `Hey! 👋 ${sender} invited you to study on HoshiYaar!` : `Hey! 👋 Come study with me on HoshiYaar!`;
    const message = `${intro} 🚀✨\n\nLearn Science in a super fun way with comics & interactive challenges, earn stars ⭐, and let's see who studies more this week! 🏆🔥\n\n📲 Download HoshiYaar on Google Play Store:\n${playStoreUrl}`;

    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  const renderStudyWithFriends = (className) => (
    <button
      onClick={handleShareWhatsApp}
      className={`relative w-full shrink-0 mt-4 lg:mt-0 mb-1.5 lg:mb-0 overflow-hidden rounded-3xl lg:rounded-2xl bg-[#6D28D9] shadow-[0_6px_0_#4C1D95] active:translate-y-1 active:shadow-[0_2px_0_#4C1D95] transition-all text-left ${className}`}
    >
      {/* Faint background silhouette */}
      <svg
        className="absolute -right-4 -top-2 h-[125%] text-white/10 pointer-events-none"
        viewBox="0 0 100 110"
        fill="currentColor"
        aria-hidden="true"
      >
        <circle cx="50" cy="34" r="26" />
        <path d="M0 112c0-30 22-48 50-48s50 18 50 48z" />
      </svg>

      <div className="relative flex items-center gap-4 lg:gap-3 py-4 lg:py-2.5 pl-4 pr-10">
        <div className="w-14 h-14 lg:w-10 lg:h-10 rounded-2xl lg:rounded-xl bg-white flex items-center justify-center shrink-0 shadow-sm">
          <svg className="w-8 h-8 lg:w-6 lg:h-6 text-[#6D28D9]" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <circle cx="6.5" cy="8" r="2.6" />
            <circle cx="17.5" cy="8" r="2.6" />
            <path d="M1.5 16c0-2.5 2.2-4.2 5-4.2 1 0 1.9.2 2.7.6A6 6 0 0 0 7.8 16z" />
            <path d="M22.5 16c0-2.5-2.2-4.2-5-4.2-1 0-1.9.2-2.7.6a6 6 0 0 1 1.4 3.6z" />
            <circle cx="12" cy="10" r="3.2" />
            <path d="M5.8 19.5c0-3.2 2.8-5.4 6.2-5.4s6.2 2.2 6.2 5.4z" />
          </svg>
        </div>
        <div className="min-w-0">
          <div
            className="text-white text-[1.6rem] lg:text-[1.3rem] leading-tight tracking-wide uppercase"
            style={{ fontFamily: "'Bangers', 'Barlow Condensed', Impact, sans-serif" }}
          >
            Study with Friends
          </div>
          <div className="font-dialogue text-[0.95rem] lg:text-[0.85rem] text-purple-100 leading-snug mt-0.5">
            Add friends and see who studies more this week
          </div>
        </div>
      </div>

      <svg
        className="absolute right-3.5 top-1/2 -translate-y-1/2 w-6 h-6 text-white/70"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M9 5l7 7-7 7" />
      </svg>
    </button>
  );

  // shrink-0 on the root and every section: inside the h-screen dashboard, flex would otherwise
  // squash and crop the banners instead of letting the page scroll
  return (
    <div className="w-full max-w-full flex flex-col shrink-0 [&>*]:shrink-0 font-sans select-none pb-28 lg:pb-1 pt-2 lg:pt-0 px-2.5 sm:px-6 max-w-5xl lg:max-w-[1400px] lg:flex-1 lg:gap-3 lg:[container-type:inline-size] mx-auto overflow-x-hidden box-border">
      {/* 1. TOP HEADER (Logo) - hidden on desktop, where the sidebar already shows it */}
      <div className="flex items-center justify-between w-full mb-3 lg:hidden">
        <div className="flex items-center">
          <img
            src="https://res.cloudinary.com/imq5966f/image/upload/v1791543780/img-to-link/bihseec7aigbmau4amnd.png"
            alt="HoshiYaar Logo"
            className="h-10 sm:h-12 lg:h-9 w-auto drop-shadow-xs"
          />
        </div>
      </div>

      {/* Desktop: banner on the left, stats + Study with Friends stacked on the right */}
      <div className="contents lg:grid lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-3">
      {/* 2. HERO BANNER - desktop height follows the window, cropping at most a sliver of the sides */}
      <div className="relative w-full shrink-0 mb-4 lg:mb-0 lg:h-[clamp(calc((100cqw_-_332px)/2.6),calc(100dvh_-_300px),calc((100cqw_-_332px)/1.8))] overflow-hidden rounded-2xl sm:rounded-3xl shadow-sm border border-slate-200/60 bg-[#8ECEFD]">
        <img
          src="https://res.cloudinary.com/imq5966f/image/upload/v1791543783/img-to-link/rqhpzqnjvb7lwofkj3v7.webp"
          alt="Solve Squad"
          className="w-full h-auto aspect-[1080/502] lg:h-full lg:aspect-auto object-cover block"
        />
      </div>

      <div className="contents lg:flex lg:flex-col lg:gap-3 lg:min-h-0">
      {/* 3. STRIP OF RANKS, STARS, STREAKS (a column on desktop) */}
      <div className="w-full shrink-0 bg-white/95 rounded-[22px] px-3 py-2.5 sm:px-5 sm:py-3 lg:px-6 lg:py-2 shadow-[0_4px_12px_rgba(0,0,0,0.04)] flex lg:flex-col lg:flex-1 lg:min-h-0 justify-between lg:justify-evenly items-center lg:items-stretch border border-white/80 backdrop-blur-md mb-6 lg:mb-0">
        {/* Rank */}
        <div className="flex items-center gap-2 lg:gap-4 w-1/3 lg:w-full justify-center lg:justify-start">
          <HexagonRankIcon />
          <div className="flex flex-col">
            <span className="text-[10px] lg:text-xs font-bold text-gray-400 uppercase tracking-wider">Rank</span>
            <span className="text-[16px] sm:text-[18px] lg:text-[26px] lgshort:text-[20px] font-black text-gray-800 leading-none">{myRank}</span>
            <div className="w-5 h-0.5 rounded-full bg-purple-500 mt-0.5" />
          </div>
        </div>

        <div className="w-px h-8 lg:w-full lg:h-px bg-gray-100" />

        {/* Stars */}
        <div className="flex items-center gap-2 lg:gap-4 w-1/3 lg:w-full justify-center lg:justify-start">
          <div className="w-8 h-8 sm:w-9 sm:h-9 lg:w-11 lg:h-11 bg-yellow-100 rounded-full flex items-center justify-center text-[15px] drop-shadow-sm">
            ⭐
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] lg:text-xs font-bold text-gray-400 uppercase tracking-wider">Stars</span>
            <span className="text-[16px] sm:text-[18px] lg:text-[26px] lgshort:text-[20px] font-black text-gray-800 leading-none">
              {stars === null ? <span className="animate-pulse">...</span> : stars}
            </span>
          </div>
        </div>

        <div className="w-px h-8 lg:w-full lg:h-px bg-gray-100" />

        {/* Streak */}
        <div className="flex items-center gap-2 lg:gap-4 w-1/3 lg:w-full justify-center lg:justify-start">
          <div className="w-8 h-8 sm:w-9 sm:h-9 lg:w-11 lg:h-11 bg-orange-100 rounded-full flex items-center justify-center text-[15px] drop-shadow-sm">
            🔥
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] lg:text-xs font-bold text-gray-400 uppercase tracking-wider">Streak</span>
            <div className="flex items-baseline gap-1">
              <span className="text-[16px] sm:text-[18px] lg:text-[26px] lgshort:text-[20px] font-black text-gray-800 leading-none">{myStreak}</span>
              <span className="text-[10px] font-bold text-gray-500">Days</span>
            </div>
          </div>
        </div>
      </div>
      {renderStudyWithFriends('hidden lg:block')}
      </div>
      </div>

      {/* 4. SECTION TITLE + PALETTE PICKER */}
      <div className="flex items-center justify-between mb-3.5 lg:mb-0 px-1">
        <div className="flex items-center gap-3">
          <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>🎯</span> Chapters
          </h2>

          {/* Quick Color Picker Dots */}
          <div className="hidden xs:flex items-center gap-1.5 bg-white/80 backdrop-blur-sm border border-slate-200/80 rounded-full px-2 py-1 shadow-2xs">
            {CATCHY_PALETTES.map((pal, pIdx) => {
              const isSelected = pIdx === activePaletteIndex;
              return (
                <button
                  key={pal.id}
                  onClick={(e) => handleSelectPalette(pIdx, e)}
                  title={`Theme: ${pal.name}`}
                  className={`w-3.5 h-3.5 rounded-full ${pal.dotColor} transition-transform ${
                    isSelected ? 'scale-125 ring-2 ring-slate-900 ring-offset-1' : 'opacity-70 hover:opacity-100 hover:scale-110'
                  }`}
                />
              );
            })}
          </div>
        </div>

        <button
          onClick={() => (onNavigateToPractice ? onNavigateToPractice() : navigate('/learn'))}
          className="text-xs font-black text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors"
        >
          <span>All Lessons</span>
          <span>→</span>
        </button>
      </div>

      {/* 5. 4 SQUARE TILES: 2 IN PROGRESS + 2 NOT STARTED */}
      {/* Mobile: 2x2 grid (grid-cols-2), Desktop: 4 in a row (md:grid-cols-4) */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4 lg:gap-3 w-full lg:flex-1">
          {[0, 1, 2, 3].map((n) => (
            <div
              key={n}
              className="bg-white border border-slate-100 rounded-2xl sm:rounded-3xl w-full min-w-0 min-h-[170px] sm:min-h-[200px] lg:min-h-[150px] animate-pulse"
            />
          ))}
        </div>
      ) : fourChapters.length === 0 ? (
        <div className="bg-white rounded-3xl p-6 text-center border border-slate-100 shadow-sm">
          <span className="text-3xl mb-2 block">📚</span>
          <h3 className="text-base font-black text-slate-800">Ready to learn?</h3>
          <p className="text-xs font-bold text-slate-500 mt-1 mb-4">
            Jump into your first science lesson and start earning stars!
          </p>
          <button
            onClick={() => (onNavigateToPractice ? onNavigateToPractice() : navigate('/learn'))}
            className="bg-[#10B981] hover:bg-emerald-600 text-white font-black text-xs px-6 py-2.5 rounded-2xl shadow-[0_4px_0_0_#059669]"
          >
            Start Learning
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4 lg:gap-3 w-full lg:flex-1">
          {fourChapters.map((ch, idx) => {
            const palette = CATCHY_PALETTES[(activePaletteIndex + idx) % CATCHY_PALETTES.length];
            const icon = ICONS_LIST[idx % ICONS_LIST.length];

            return (
              <div
                key={ch._id || idx}
                onClick={() => handleContinue(ch)}
                className={`relative rounded-2xl sm:rounded-3xl p-2.5 sm:p-4 lg:p-3 lgshort:p-2 border-2 transition-all flex flex-col justify-between cursor-pointer active:translate-y-[2px] bg-white w-full min-w-0 min-h-[170px] sm:min-h-[200px] lg:min-h-[150px] box-border ${palette.cardBorder} ${palette.cardShadow}`}
              >
                {/* Top Row: Icon + Status Badge */}
                <div className="flex items-center justify-between gap-1 w-full">
                  <div
                    className={`w-8 h-8 sm:w-9 sm:h-9 lg:w-11 lg:h-11 lg:text-2xl lgshort:w-7 lgshort:h-7 lgshort:text-base rounded-xl flex items-center justify-center text-lg sm:text-xl shadow-xs shrink-0 transition-colors ${palette.iconBg}`}
                  >
                    {icon}
                  </div>

                  {/* Status Badge */}
                  {ch.isCompleted ? (
                    <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-300 shrink-0">
                      ✓ Done
                    </span>
                  ) : ch.isCurrent ? (
                    <span className={`text-[9px] sm:text-[10px] font-black uppercase tracking-wider px-2 lgshort:px-1.5 py-0.5 rounded-full shadow-xs flex items-center gap-1 shrink-0 ${palette.activeBadge}`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse lgshort:hidden" /> Current
                    </span>
                  ) : ch.isInProgress ? (
                    <span className={`text-[9px] sm:text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full shadow-2xs shrink-0 ${palette.inProgressBadge}`}>
                      {ch.pct}%
                    </span>
                  ) : (
                    <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200/80 shrink-0">
                      New
                    </span>
                  )}
                </div>

                {/* Middle: Chapter Title */}
                <div className="my-auto py-1">
                  <h3
                    className="text-xs sm:text-sm md:text-[14px] lg:text-lg lgshort:text-sm font-black text-slate-900 leading-snug line-clamp-2 sm:line-clamp-3 break-words"
                    title={ch.title}
                  >
                    {ch.title}
                  </h3>
                </div>

                {/* Bottom: Progress Bar + Action Button */}
                <div className="mt-auto w-full flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-black text-slate-600">
                    <span className="truncate mr-1">
                      {ch.st.total > 0
                        ? (ch.isInProgress ? `${ch.st.completed} of ${ch.st.total} done` : `${ch.st.total} lessons`)
                        : (ch.isInProgress ? 'In Progress' : 'Start learning')}
                    </span>
                    {ch.isInProgress && (
                      <span className={`font-black shrink-0 ${palette.pctText}`}>
                        {ch.pct}%
                      </span>
                    )}
                  </div>

                  {/* Progress Track */}
                  <div
                    className={`w-full h-1.5 sm:h-2 rounded-full overflow-hidden ${
                      ch.isInProgress ? palette.progressTrack : 'bg-slate-100 border border-slate-200/60'
                    }`}
                  >
                    {ch.isInProgress ? (
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${palette.progressFill}`}
                        style={{ width: `${Math.max(ch.pct, 6)}%` }}
                      />
                    ) : (
                      <div className="h-full w-0" />
                    )}
                  </div>

                  {/* Action Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleContinue(ch);
                    }}
                    className={`w-full py-1.5 sm:py-2 rounded-xl font-black text-xs sm:text-[13px] lgshort:text-xs tracking-wide transition-all active:translate-y-[1px] active:shadow-none flex items-center justify-center gap-1 ${
                      ch.isInProgress
                        ? palette.btn
                        : 'bg-slate-800 hover:bg-slate-900 text-white shadow-[0_3px_0_0_#0F172A]'
                    }`}
                  >
                    <span>
                      {ch.isCompleted
                        ? 'Review'
                        : ch.isInProgress
                          ? 'Continue'
                          : 'Start'}
                    </span>
                    <span className="text-xs font-bold">→</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 6. STUDY WITH FRIENDS - phones keep it at the bottom; desktop shows it beside the banner */}
      {renderStudyWithFriends('lg:hidden')}
    </div>
  );
}
