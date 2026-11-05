import React, { useState, useEffect, useRef, useMemo } from 'react';
import { progressKey } from '../../../utils/progressKey.js';

// Helpers to clean unit title and compute progress
const cleanUnitTitle = (title) => {
  if (!title) return '';
  return title.replace(/^Unit\s+\d+[:\s\-\.]+/i, '').trim();
};

export default function DuolingoChapterView({
  chapterId,
  chapterTitle,
  chapterBg = null,
  subjectName = 'Science',
  visibleUnits = [],
  unitModulesMap = {},
  completedCompositeKeys = new Set(),
  completedIdSet = new Set(),
  isAdmin = false,
  isMobileLayout = false,
  onModuleClick,
  isPaywallLocked = null,
  onOpenSubjectModal,
  onOpenChapters,
  availableSubjects = [],
  isLoading = false,
  subjectChanging = false,
}) {
  // Global module sequence to identify the single first incomplete module
  const { allModulesFlat, firstIncompleteGlobalKey } = useMemo(() => {
    const flat = [];
    let firstIncomplete = null;

    visibleUnits.forEach((u) => {
      const mods = unitModulesMap[u._id] || [];
      mods.forEach((mod) => {
        const key = progressKey(chapterId, u._id, mod._id);
        const altKey = progressKey(chapterId, null, mod._id);
        const isCompleted =
          completedCompositeKeys.has(key) ||
          completedCompositeKeys.has(altKey) ||
          (mod._id && completedIdSet.has(String(mod._id)));
        flat.push({ mod, unit: u, key, isCompleted });

        if (!isCompleted && !firstIncomplete) {
          firstIncomplete = key;
        }
      });
    });

    return { allModulesFlat: flat, firstIncompleteGlobalKey: firstIncomplete };
  }, [visibleUnits, unitModulesMap, chapterId, completedCompositeKeys, completedIdSet]);

  // Track active unit for sticky header via IntersectionObserver
  const [activeUnitIdx, setActiveUnitIdx] = useState(0);
  const unitRefs = useRef({});

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = Number(entry.target.getAttribute('data-unit-idx'));
            if (!isNaN(idx)) {
              setActiveUnitIdx(idx);
            }
          }
        });
      },
      { threshold: 0.2, rootMargin: '-60px 0px -40% 0px' }
    );

    const currentRefs = unitRefs.current;
    Object.values(currentRefs).forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => {
      Object.values(currentRefs).forEach((el) => {
        if (el) observer.unobserve(el);
      });
    };
  }, [visibleUnits]);

  const currentUnit = visibleUnits[activeUnitIdx] || visibleUnits[0];
  const stickyHeaderTitle = currentUnit
    ? currentUnit.title || `Unit ${activeUnitIdx + 1}`
    : chapterTitle || 'Learning Modules';

  return (
    <div
      className="relative w-full min-h-screen pb-28 pt-2 transition-all duration-300"
      style={
        chapterBg
          ? {
              backgroundImage: `url(${chapterBg})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundAttachment: 'fixed',
            }
          : {
              background:
                'linear-gradient(180deg, #E0F2FE 0%, #EDE9FE 25%, #F0FDF4 55%, #FEF9C3 85%, #FEF08A 100%)',
            }
      }
    >
      {/* Decorative colorful ambient elements for new chapter if no custom background image yet */}
      {!chapterBg && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden select-none -z-0">
          {/* Soft colorful glow orbs */}
          <div className="absolute top-10 -left-20 w-80 h-80 rounded-full bg-sky-400/25 blur-3xl animate-pulse" />
          <div className="absolute top-1/4 -right-20 w-96 h-96 rounded-full bg-indigo-400/20 blur-3xl" />
          <div className="absolute top-2/4 -left-16 w-80 h-80 rounded-full bg-emerald-400/20 blur-3xl" />
          <div className="absolute top-3/4 -right-16 w-88 h-88 rounded-full bg-amber-400/25 blur-3xl" />

          {/* Gamified floating playful badges / icons */}
          <div className="absolute top-28 left-4 text-xl opacity-35">☁️</div>
          <div className="absolute top-60 right-6 text-xl opacity-35">⭐</div>
          <div className="absolute top-[460px] left-6 text-xl opacity-40">🧪</div>
          <div className="absolute top-[720px] right-6 text-xl opacity-35">✨</div>
          <div className="absolute top-[980px] left-4 text-xl opacity-35">🌟</div>
          <div className="absolute top-[1240px] right-6 text-xl opacity-35">💡</div>
        </div>
      )}

      {/* Path content container */}
      <div className="relative z-10 w-full max-w-xl mx-auto pl-2 pr-2 sm:pr-3">
        {/* 1. TOP STICKY CHAPTER/UNIT BANNER (Transparent background like earlier) */}
        <header className="sticky top-0 z-40 mb-6 w-full px-1">
        <div className="rounded-[24px] sm:rounded-3xl px-5 py-4 sm:px-6 sm:py-5 shadow-xl border border-white/20 relative overflow-hidden backdrop-blur-md bg-black/40 text-white transition-all duration-300">
          {/* Sparkling stars effect */}
          <div className="absolute inset-0 opacity-15 pointer-events-none overflow-hidden select-none">
            <div className="absolute top-2 left-1/4 animate-pulse">✨</div>
            <div className="absolute bottom-4 left-1/2">⭐</div>
            <div className="absolute top-8 right-1/4 animate-pulse">✨</div>
          </div>

          <div className="relative z-10 flex flex-col gap-2">
            {/* Active Unit Title */}
            <h2 className="text-[17px] sm:text-xl font-extrabold leading-tight text-white drop-shadow-md tracking-tight">
              {stickyHeaderTitle}
            </h2>

            {/* Dashed divider */}
            <div className="w-full h-[1px] bg-white/20 border-t border-dashed border-white/20 my-1" />

            {/* Chapter Name */}
            <p className="opacity-90 font-bold text-xs sm:text-sm text-blue-50 truncate">
              {chapterTitle || 'Learning Modules'}
            </p>

            {/* Action Pills Row */}
            <div className="flex items-center justify-between gap-2 mt-2 pt-0.5">
              {/* Subject Pill */}
              {availableSubjects.length > 1 ? (
                <button
                  onClick={onOpenSubjectModal}
                  disabled={isLoading || subjectChanging}
                  className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 active:scale-95 px-3 py-1.5 rounded-full border border-white/20 text-xs font-black tracking-wide text-white transition-all shadow-inner"
                >
                  <span className="text-sm">🧪</span>
                  <span className="uppercase">{subjectName}</span>
                  <span className="text-[10px] opacity-75">▼</span>
                </button>
              ) : (
                <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-full border border-white/20 text-xs font-black tracking-wide text-white shadow-inner">
                  <span className="text-sm">🧪</span>
                  <span className="uppercase">{subjectName}</span>
                </div>
              )}

              {/* All Chapters Button */}
              <button
                onClick={onOpenChapters}
                className="flex items-center gap-2 py-1.5 px-3.5 rounded-2xl bg-white text-slate-900 hover:bg-slate-50 active:scale-95 transition-all border-2 border-white/90 text-xs font-black shadow-md cursor-pointer"
              >
                <svg className="w-4 h-4 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" />
                </svg>
                <span className="text-slate-900 font-black">All Chapters</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 2. CONTINUOUS VERTICAL PATH (Pushed towards right edge, ample room on left for characters) */}
      <div className="flex flex-col gap-8 w-full">
        {visibleUnits.map((u, unitIdx) => {
          const unitMods = unitModulesMap[u._id] || [];
          const cleanTitle = cleanUnitTitle(u.title) || u.title || `Unit ${unitIdx + 1}`;

          // Calculate completed levels in this unit
          const completedInThisUnit = unitMods.filter((mod) => {
            const key = progressKey(chapterId, u._id, mod._id);
            const altKey = progressKey(chapterId, null, mod._id);
            return (
              completedCompositeKeys.has(key) ||
              completedCompositeKeys.has(altKey) ||
              (mod._id && completedIdSet.has(String(mod._id)))
            );
          }).length;
          const totalInThisUnit = unitMods.length;

          return (
            <section
              key={u._id || unitIdx}
              ref={(el) => (unitRefs.current[unitIdx] = el)}
              data-unit-idx={unitIdx}
              className="flex flex-col w-full"
            >
              {/* INLINE UNIT HEADER (Right-aligned over the path, leaving left space for characters) */}
              <div className="w-full flex justify-end items-center mb-4 select-none pr-0.5 sm:pr-1">
                <div className="flex items-center justify-end gap-2 sm:gap-3">
                  {/* [Unit X] Pill — Directly above the circular node */}
                  <span className="bg-[#262626] text-white text-[11px] sm:text-xs font-black px-3.5 py-1.5 rounded-full shadow-sm whitespace-nowrap">
                    {`Unit ${unitIdx + 1}`}
                  </span>

                  {/* Unit Title (in 2 lines) — Directly above the lesson cards */}
                  <h3
                    className="font-black text-slate-900 text-xs sm:text-sm leading-tight max-w-[130px] sm:max-w-[165px] break-words line-clamp-2"
                    title={cleanTitle}
                  >
                    {cleanTitle}
                  </h3>

                  {/* Level Count (in 2 lines) — Directly above the card arrow */}
                  <div className="flex flex-col items-end shrink-0 pl-1 text-right min-w-[42px]">
                    <span className="text-xs sm:text-sm font-black text-slate-800 leading-none">
                      {`${completedInThisUnit} of ${totalInThisUnit}`}
                    </span>
                    <span className="text-[10px] sm:text-[11px] font-bold text-slate-600 leading-tight mt-0.5">
                      levels
                    </span>
                  </div>
                </div>
              </div>

              {/* MODULE NODES IN THIS UNIT (Right-aligned in straight line) */}
              <div className="flex flex-col items-end gap-6 py-2">
                {unitMods.map((mod, modIdx) => {
                  const key = progressKey(chapterId, u._id, mod._id);
                  const altKey = progressKey(chapterId, null, mod._id);
                  const isCompleted =
                    completedCompositeKeys.has(key) ||
                    completedCompositeKeys.has(altKey) ||
                    (mod._id && completedIdSet.has(String(mod._id)));
                  // Pro lock: a normal grey locked lesson with a lock icon; tapping it opens the payment pop-up
                  const paywalled = Boolean(isPaywallLocked && isPaywallLocked(mod, isCompleted));
                  const done = isCompleted && !paywalled;
                  const isActive = !paywalled && !isCompleted && key === firstIncompleteGlobalKey;
                  const isLocked = !paywalled && !isCompleted && !isActive;

                  const status = paywalled ? 'paywall' : isCompleted ? 'completed' : isActive ? 'active' : 'locked';
                  const canClick = paywalled || isCompleted || isActive || isAdmin;

                  return (
                    <div
                      key={mod._id || modIdx}
                      className="relative flex items-center justify-end w-full pr-0.5 sm:pr-1"
                    >
                      {/* --- A. CIRCULAR NODE (Yellow if completed, Blue if active/next to start, Gray if locked) --- */}
                      <div className="relative shrink-0">
                        {/* Soft Outer Halo Ring for Active Lesson */}
                        {isActive && (
                          <div className="absolute -inset-2 rounded-full bg-blue-500/25 animate-pulse pointer-events-none" />
                        )}

                        {/* Bouncing START badge for active lesson */}
                        {isActive && (
                          <div className="absolute -top-7 sm:-top-8 left-1/2 -translate-x-1/2 z-30 select-none pointer-events-none flex flex-col items-center animate-bounce">
                            <div className="px-3.5 py-1 rounded-xl font-black text-[11px] sm:text-xs bg-white text-[#2563EB] shadow-[0_4px_12px_rgba(37,99,235,0.25)] border-2 border-blue-100 uppercase tracking-widest whitespace-nowrap">
                              START
                            </div>
                            <div className="w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-l-transparent border-r-transparent border-t-white -mt-0.5" />
                          </div>
                        )}

                        {/* 3D Round Button */}
                        <button
                          type="button"
                          disabled={!canClick}
                          onClick={() => onModuleClick(mod, u, status)}
                          className={`relative w-16 h-16 sm:w-18 sm:h-18 md:w-20 md:h-20 rounded-full select-none transition-transform duration-100 ${
                            canClick
                              ? 'cursor-pointer hover:scale-105 active:translate-y-[4px]'
                              : 'cursor-not-allowed opacity-80'
                          }`}
                          style={{ touchAction: 'manipulation' }}
                          title={mod.title}
                        >
                          {/* Bottom 3D Depth Layer */}
                          <div
                            className="absolute inset-0 rounded-full translate-y-[6px]"
                            style={{
                              backgroundColor: paywalled
                              ? '#94A3B8'
                              : done
                                ? '#CA8A04'
                                : isActive
                                ? '#1D4ED8'
                                : '#94A3B8',
                            }}
                          />

                          {/* Top Button Face */}
                          <div
                            className="relative w-full h-full rounded-full flex items-center justify-center border border-white/50 shadow-inner"
                            style={{
                              background: paywalled
                              ? 'linear-gradient(180deg, #E2E8F0 0%, #CBD5E1 100%)'
                              : done
                                ? 'linear-gradient(180deg, #FDE047 0%, #FACC15 50%, #EAB308 100%)'
                                : isActive
                                ? 'linear-gradient(180deg, #60A5FA 0%, #2563EB 50%, #1D4ED8 100%)'
                                : 'linear-gradient(180deg, #E2E8F0 0%, #CBD5E1 100%)',
                            }}
                          >
                            {/* Star Icon (or Lock for locked non-admin) */}
                            {paywalled ? (
                              <svg className="w-7 h-7 sm:w-8 sm:h-8 text-slate-400 drop-shadow-sm" viewBox="0 0 24 24" fill="currentColor">
                                <path
                                  fillRule="evenodd"
                                  d="M12 1.5a5.25 5.25 0 00-5.25 5.25v3a3 3 0 00-3 3v6.75a3 3 0 003 3h10.5a3 3 0 003-3v-6.75a3 3 0 00-3-3v-3c0-2.9-2.35-5.25-5.25-5.25zm3.75 8.25v-3a3.75 3.75 0 00-7.5 0v3h7.5z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            ) : isLocked && !isAdmin ? (
                              <svg
                                className="w-7 h-7 sm:w-8 sm:h-8 text-slate-400 drop-shadow-sm"
                                viewBox="0 0 24 24"
                                fill="currentColor"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M12 1.5a5.25 5.25 0 00-5.25 5.25v3a3 3 0 00-3 3v6.75a3 3 0 003 3h10.5a3 3 0 003-3v-6.75a3 3 0 00-3-3v-3c0-2.9-2.35-5.25-5.25-5.25zm3.75 8.25v-3a3.75 3.75 0 00-7.5 0v3h7.5z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            ) : (
                              <svg
                                className="w-8 h-8 sm:w-9 sm:h-9 text-white drop-shadow-md"
                                viewBox="0 0 24 24"
                                fill="currentColor"
                              >
                                <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                              </svg>
                            )}
                          </div>
                        </button>
                      </div>

                      {/* --- B. MODULE TITLE CARD ON RIGHT (Compact width, small arrow) --- */}
                      <div
                        onClick={() => canClick && onModuleClick(mod, u, status)}
                        className={`relative ml-3 sm:ml-3.5 w-[185px] sm:w-[220px] shrink-0 select-none transition-transform ${
                          canClick
                            ? 'cursor-pointer hover:-translate-y-0.5 active:translate-y-[2px]'
                            : 'cursor-not-allowed opacity-75'
                        }`}
                      >
                        {/* 3D Depth Shadow */}
                        <div
                          className="absolute inset-0 rounded-2xl translate-y-[4px]"
                          style={{
                            backgroundColor: paywalled
                              ? '#94A3B8'
                              : done
                              ? '#B45309'
                              : isActive
                              ? '#1E40AF'
                              : '#94A3B8',
                          }}
                        />

                        {/* Card Face */}
                        <div
                          className="relative rounded-2xl px-3.5 py-3 sm:px-4 sm:py-3.5 flex items-center justify-between gap-2.5 border shadow-sm"
                          style={{
                            backgroundColor: paywalled
                              ? '#F1F5F9'
                              : done
                              ? '#FACC15'
                              : isActive
                              ? '#2563EB'
                              : '#F1F5F9',
                            borderColor: paywalled
                              ? '#CBD5E1'
                              : done
                              ? '#EAB308'
                              : isActive
                              ? '#1D4ED8'
                              : '#CBD5E1',
                          }}
                        >
                          <span
                            className={`text-sm sm:text-base font-black leading-snug line-clamp-2 tracking-tight ${
                              paywalled
                              ? 'text-slate-600'
                              : done
                                ? 'text-yellow-950'
                                : isActive
                                ? 'text-white'
                                : 'text-slate-600'
                            }`}
                          >
                            {mod.title || 'Lesson'}
                          </span>

                          {/* Reduced Lesson Arrow Size */}
                          <svg
                            className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 font-bold ${
                              paywalled
                              ? 'text-slate-400'
                              : done
                                ? 'text-yellow-950'
                                : isActive
                                ? 'text-white'
                                : 'text-slate-400'
                            }`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth="2.5"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
      </div>
    </div>
  );
}
