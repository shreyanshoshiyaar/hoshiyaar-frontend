import React, { useState, useMemo, useEffect } from 'react';
import curriculumService from '../../../services/curriculumService.js';
import { artFor } from '../../layout/home/ChaptersGrid.jsx';

const classNumber = (value) => String(value ?? '').replace(/\D/g, '');

// Explore spaces show topics, not a syllabus: no "Chapter 4:" prefix, no numbering
const topicName = (title = '') => String(title)
  .replace(/\(coming soon\)/i, '')
  .replace(/^\s*(chapter|ch\.?)\s*\d+\s*[:.\-–—]?\s*/i, '')
  .trim();

// Same mix for the whole day, so tiles don't jump around between visits
const dailyShuffle = (list) => {
  const seed = Number(new Date().toISOString().slice(0, 10).replace(/-/g, ''));
  const score = (c) => { let h = seed; for (const ch of String(c._id || c.id || c.title)) h = (h * 31 + ch.charCodeAt(0)) % 1000003; return h; };
  return [...list].sort((a, b) => score(a) - score(b));
};

const TILE_COLORS = [
  'from-[#E0F2FE] to-[#BAE6FD] border-sky-200',
  'from-[#F3E8FF] to-[#E9D5FF] border-purple-200',
  'from-[#DCFCE7] to-[#BBF7D0] border-emerald-200',
  'from-[#FEF3C7] to-[#FDE68A] border-amber-200',
  'from-[#FCE7F3] to-[#FBCFE8] border-pink-200',
];

/**
 * Modern, robust, and space-efficient All Chapters modal.
 * Replaces the old bulky inline view with a sleek, fast, filterable dialog.
 */
const AllChaptersModal = ({
  isOpen,
  onClose,
  chaptersList = [],
  currentChapterId,
  chapterStats = {},
  statsLoading = false,
  subjectName = 'Science',
  classLevel = '',
  board = 'CBSE',
  user,
  adminViewMode,
  onSelectChapter
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState('all'); // 'all' | 'in_progress' | 'completed'
  // 'mine' = the student's own class. Other classes are two explore spaces, not a syllabus:
  // 'levelup' = higher grades (grouped by grade, to look forward to), 'curious' = lower grades
  // (one mixed set of topics, no grades or numbers)
  const [view, setView] = useState('mine');
  const [other, setOther] = useState({ loading: false, failed: false, groups: null }); // groups: [{ name, chapters }]
  const ownClass = classNumber(classLevel);
  const ownNum = Number(ownClass) || 0;
  const higherGroups = (other.groups || []).filter((g) => ownNum && Number(g.name) > ownNum);
  const lowerGroups = (other.groups || []).filter((g) => !ownNum || Number(g.name) < ownNum);

  const loadOtherChapters = async () => {
    setOther({ loading: true, failed: false, groups: null });
    try {
      const classes = ((await curriculumService.listClasses(board))?.data || [])
        .filter((c) => c?.name && classNumber(c.name) !== ownClass)
        .sort((a, b) => (Number(classNumber(a.name)) || 0) - (Number(classNumber(b.name)) || 0));
      const groups = await Promise.all(classes.map(async (cls) => {
        const resp = await curriculumService.listChapters(board, subjectName, { classTitle: cls.name });
        return { name: classNumber(cls.name) || String(cls.name), chapters: (resp?.data || []).filter((c) => c && (c._id || c.id)) };
      }));
      setOther({
        loading: false,
        failed: false,
        // Coming-soon topics only make a space feel unfinished, so they stay out of it
        groups: groups
          .map((g) => ({ ...g, chapters: g.chapters.filter((c) => !String(c.title || '').includes('(Coming Soon)')) }))
          .filter((g) => g.chapters.length)
      });
    } catch (_) {
      setOther({ loading: false, failed: true, groups: null });
    }
  };

  const openExplore = (space) => {
    setView(space);
    if (!other.groups && !other.loading) loadOtherChapters();
  };

  // Load the other classes as soon as the panel opens, so the explore tabs know whether they
  // have anything to show (Class 8 has no Level Up, Class 6 no Curiosity Corner)
  useEffect(() => {
    if (isOpen && !other.groups && !other.loading) loadOtherChapters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Open on the tab holding the chapter the student is in: their own class right away; a chapter
  // from another class once those have loaded (only when the panel opens, never mid-browse)
  const placedRef = React.useRef(false);
  useEffect(() => {
    if (!isOpen) { placedRef.current = false; return; }
    const inOwnClass = !currentChapterId || chaptersList.some((c) => String(c._id) === String(currentChapterId));
    if (inOwnClass) { setView('mine'); placedRef.current = true; }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);
  useEffect(() => {
    if (!isOpen || placedRef.current || !other.groups) return;
    placedRef.current = true;
    const inHigher = higherGroups.some((g) => g.chapters.some((c) => String(c._id || c.id) === String(currentChapterId)));
    setView(inHigher ? 'levelup' : 'curious');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, other.groups]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Prevent background scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const isAdmin = user?.role === 'admin' && adminViewMode !== 'student';

  // Compute chapter metadata
  const chaptersWithMeta = useMemo(() => {
    return chaptersList.map((ch, index) => {
      const st = chapterStats[ch._id] || { total: 0, completed: 0 };
      const pct = isAdmin ? 100 : (st.total > 0 ? Math.min(100, Math.round((st.completed / st.total) * 100)) : 0);
      const isCompleted = pct === 100;
      const isInProgress = st.completed > 0 && !isCompleted;
      const isCurrent = ch._id === currentChapterId;
      const isComingSoon = Boolean(ch.title && ch.title.includes('(Coming Soon)'));
      const chapterNumber = index + 1;

      return {
        ...ch,
        chapterNumber,
        st,
        pct,
        isCompleted,
        isInProgress,
        isCurrent,
        isComingSoon
      };
    });
  }, [chaptersList, chapterStats, isAdmin, currentChapterId]);

  // Overall stats
  const totalChapters = chaptersWithMeta.length;
  const completedCount = chaptersWithMeta.filter(c => c.isCompleted).length;
  const inProgressCount = chaptersWithMeta.filter(c => c.isInProgress).length;

  // Filtered chapters
  const filteredChapters = useMemo(() => {
    let list = chaptersWithMeta;

    // Filter by tab
    if (filterTab === 'completed') {
      list = list.filter(c => c.isCompleted);
    } else if (filterTab === 'in_progress') {
      list = list.filter(c => c.isInProgress || c.isCurrent);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(c => {
        const titleMatch = (c.title || '').toLowerCase().includes(q);
        const numMatch = `chapter ${c.chapterNumber}`.includes(q) || `ch ${c.chapterNumber}`.includes(q) || String(c.chapterNumber) === q;
        return titleMatch || numMatch;
      });
    }

    return list;
  }, [chaptersWithMeta, filterTab, searchQuery]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center p-3 sm:p-5 bg-slate-950/60 backdrop-blur-sm animate-fade-in font-sans"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-100 flex flex-col max-h-[86vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-5 sm:px-6 pt-5 pb-4 border-b border-slate-100 flex items-center justify-between gap-3 bg-gradient-to-b from-slate-50/60 to-white">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center text-xl shadow-md shrink-0">
              📚
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg sm:text-xl font-black text-slate-900 leading-tight">
                  All Chapters
                </h3>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/60 shrink-0">
                  {totalChapters} Chapters
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium truncate mt-0.5">
                {subjectName} {classLevel ? `• Class ${classLevel}` : ''} • Tap any chapter to jump in
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center font-bold text-sm transition-all active:scale-95 shrink-0"
            title="Close (Esc)"
          >
            ✕
          </button>
        </div>

        {/* My class / Other chapters tabs */}
        <div className="shrink-0 px-3 sm:px-6 pt-3 bg-white flex gap-0.5 border-b border-slate-100 overflow-x-auto overflow-y-hidden no-scrollbar" role="tablist">
          {[
            { id: 'mine', label: ownClass ? `Class ${ownClass} Chapters` : 'My Chapters', show: true },
            { id: 'levelup', label: '🚀 Level Up', show: !other.groups || higherGroups.length > 0 },
            { id: 'curious', label: '🔍 Curiosity Corner', show: !other.groups || lowerGroups.length > 0 }
          ].filter((tab) => tab.show).map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={view === tab.id}
              onClick={() => (tab.id === 'mine' ? setView('mine') : openExplore(tab.id))}
              className={`px-2.5 sm:px-3.5 py-2 text-xs sm:text-sm font-extrabold border-b-2 -mb-px whitespace-nowrap shrink-0 transition-colors ${
                view === tab.id
                  ? 'border-blue-600 text-blue-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search & Filter Controls */}
        <div className="shrink-0 px-5 sm:px-6 py-3 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
          {/* Quick Search */}
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">
              🔍
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={view === 'mine' ? 'Search chapter title or number...' : 'Search a topic...'}
              className="w-full pl-8 pr-7 py-1.5 text-xs font-semibold bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 placeholder:text-slate-400 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Filter Tabs */}
          <div className={`flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200/80 shrink-0 text-xs ${view !== 'mine' ? 'hidden' : ''}`}>
            <button
              onClick={() => setFilterTab('all')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                filterTab === 'all'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({totalChapters})
            </button>
            <button
              onClick={() => setFilterTab('in_progress')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                filterTab === 'in_progress'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              In Progress ({inProgressCount})
            </button>
            <button
              onClick={() => setFilterTab('completed')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                filterTab === 'completed'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Done ({completedCount})
            </button>
          </div>
        </div>

        {/* Scrollable Chapter List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-2.5 divide-y divide-transparent">
          {view === 'mine' && (<>
          {statsLoading && totalChapters === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <div className="animate-spin rounded-full h-8 w-8 border-3 border-blue-500 border-t-transparent mb-3"></div>
              <span className="text-xs font-bold">Loading chapter details...</span>
            </div>
          )}

          {filteredChapters.map((ch) => {
            return (
              <div
                key={ch._id}
                onClick={() => onSelectChapter(ch)}
                className={`group relative rounded-2xl p-3.5 sm:p-4 border transition-all duration-150 cursor-pointer flex items-center justify-between gap-3 ${
                  ch.isComingSoon
                    ? 'opacity-60 cursor-not-allowed bg-slate-50 border-slate-200'
                    : ch.isCurrent
                      ? 'bg-gradient-to-r from-blue-50/60 to-indigo-50/30 border-blue-300 ring-2 ring-blue-500/20 shadow-xs'
                      : 'bg-white hover:bg-slate-50/70 border-slate-200/80 hover:border-blue-300 hover:shadow-xs active:scale-[0.995]'
                }`}
              >
                {/* Left: Chapter Number / Icon */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div
                    className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center font-black text-xs sm:text-sm shrink-0 shadow-2xs transition-colors ${
                      ch.isCompleted
                        ? 'bg-emerald-100 text-emerald-800'
                        : ch.isCurrent
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 text-slate-700 group-hover:bg-blue-100 group-hover:text-blue-700'
                    }`}
                  >
                    {ch.isCompleted ? '🏆' : String(ch.chapterNumber).padStart(2, '0')}
                  </div>

                  {/* Middle: Title, Tags & Progress */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4
                        className={`text-xs sm:text-sm font-extrabold truncate leading-snug transition-colors ${
                          ch.isCurrent ? 'text-blue-900 font-black' : 'text-slate-800 group-hover:text-blue-600'
                        }`}
                        title={ch.title}
                      >
                        {ch.title}
                      </h4>
                      {ch.isCurrent && (
                        <span className="text-[9px] uppercase tracking-wider font-black px-1.5 py-0.5 rounded-full bg-blue-600 text-white shrink-0">
                          Current
                        </span>
                      )}
                      {ch.isComingSoon && (
                        <span className="text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-800 shrink-0">
                          Coming Soon
                        </span>
                      )}
                    </div>

                    {/* Progress Bar & Subtitle */}
                    <div className="flex items-center gap-3 mt-1.5">
                      <div className="w-20 sm:w-28 h-1.5 bg-slate-100 rounded-full overflow-hidden shrink-0">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            ch.isCompleted
                              ? 'bg-emerald-500'
                              : ch.isCurrent
                                ? 'bg-blue-600'
                                : 'bg-slate-400 group-hover:bg-blue-500'
                          }`}
                          style={{ width: `${ch.pct}%` }}
                        />
                      </div>
                      <span className="text-[11px] font-semibold text-slate-500 shrink-0">
                        {ch.st.completed} <span className="text-slate-300">/</span> {ch.st.total || '—'} lessons
                      </span>
                      {ch.pct > 0 && (
                        <span className="text-[10px] font-bold text-slate-400 hidden sm:inline">
                          ({ch.pct}%)
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Quick Action Pill */}
                <div className="shrink-0 flex items-center gap-2">
                  {ch.isCompleted ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-[11px] font-extrabold shadow-2xs">
                      <span>✓</span>
                      <span className="hidden sm:inline">Completed</span>
                    </span>
                  ) : ch.isCurrent ? (
                    <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-600 text-white text-[11px] font-extrabold shadow-xs group-hover:bg-blue-700 transition-colors">
                      <span>Continue</span>
                      <span>→</span>
                    </span>
                  ) : ch.isInProgress ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-blue-50 text-blue-700 group-hover:bg-blue-600 group-hover:text-white text-[11px] font-bold border border-blue-200/60 transition-colors">
                      <span>Resume</span>
                      <span>→</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-100 text-slate-600 group-hover:bg-slate-200 text-[11px] font-bold transition-colors">
                      <span>Start</span>
                      <span>→</span>
                    </span>
                  )}
                </div>
              </div>
            );
          })}

          {filterTab === 'all' && !searchQuery && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
              {(!other.groups || higherGroups.length > 0) && (
                <button
                  onClick={() => openExplore('levelup')}
                  className="rounded-2xl p-4 border border-indigo-200 bg-gradient-to-br from-indigo-50 to-purple-50 hover:from-indigo-100 hover:to-purple-100 text-left transition-colors active:scale-[0.99]"
                >
                  <p className="text-sm font-black text-indigo-900">🚀 Level Up</p>
                  <p className="text-[11px] font-semibold text-indigo-700/80 mt-0.5">Sneak a peek at what the next grades discover</p>
                </button>
              )}
              {(!other.groups || lowerGroups.length > 0) && (
                <button
                  onClick={() => openExplore('curious')}
                  className="rounded-2xl p-4 border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 hover:from-amber-100 hover:to-orange-100 text-left transition-colors active:scale-[0.99]"
                >
                  <p className="text-sm font-black text-amber-900">🔍 Curiosity Corner</p>
                  <p className="text-[11px] font-semibold text-amber-700/80 mt-0.5">Wonder about anything you like, no rush</p>
                </button>
              )}
            </div>
          )}

          {filteredChapters.length === 0 && !statsLoading && (
            <div className="text-center py-10 px-4">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center text-xl mx-auto mb-2">
                🔍
              </div>
              <p className="text-sm font-bold text-slate-700">No chapters found</p>
              <p className="text-xs text-slate-400 mt-0.5">
                {searchQuery ? `No results matching "${searchQuery}"` : 'No chapters available in this filter'}
              </p>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="mt-3 px-3 py-1 text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 rounded-lg"
                >
                  Clear Search
                </button>
              )}
            </div>
          )}
          </>)}

          {view !== 'mine' && (() => {
            if (other.loading || !other.groups) {
              return other.failed ? (
                <div className="text-center py-10">
                  <p className="text-sm font-bold text-slate-700">Couldn't load these topics</p>
                  <button onClick={loadOtherChapters} className="mt-3 px-3 py-1 text-xs font-bold text-blue-600 bg-blue-50 rounded-lg">Try again</button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                  <div className="animate-spin rounded-full h-8 w-8 border-3 border-indigo-500 border-t-transparent mb-3"></div>
                  <span className="text-xs font-bold">Finding topics to explore...</span>
                </div>
              );
            }
            const q = searchQuery.toLowerCase().trim();
            const matches = (c) => !q || topicName(c.title).toLowerCase().includes(q);
            const tile = (ch, idx, gradeName) => {
              const id = String(ch._id || ch.id);
              const isHere = id === String(currentChapterId);
              return (
                <button
                  key={id}
                  onClick={() => onSelectChapter({ ...ch, _id: id, classLevel: gradeName })}
                  className={`group rounded-2xl p-3.5 border bg-gradient-to-br ${TILE_COLORS[idx % TILE_COLORS.length]} text-left flex flex-col gap-2 min-h-[112px] transition-transform active:scale-[0.98] hover:-translate-y-0.5 ${isHere ? 'ring-2 ring-indigo-500' : ''}`}
                >
                  <span className="text-3xl leading-none" aria-hidden="true">{artFor(ch.title)}</span>
                  <span className="text-[13px] font-extrabold text-slate-800 leading-snug line-clamp-3">{topicName(ch.title)}</span>
                  {isHere && <span className="text-[10px] font-black uppercase tracking-wider text-indigo-700">You're here</span>}
                </button>
              );
            };

            if (view === 'levelup') {
              const groups = higherGroups.map((g) => ({ ...g, chapters: g.chapters.filter(matches) })).filter((g) => g.chapters.length);
              if (!groups.length) return <p className="text-center py-10 text-sm font-bold text-slate-500">{q ? `Nothing matches "${searchQuery}"` : 'More to discover soon!'}</p>;
              return (
                <div className="space-y-4">
                  <p className="text-xs font-semibold text-slate-500">Curious what's coming? Peek into the next grades — explore anything that sounds fun.</p>
                  {groups.map((g, gi) => (
                    <div key={g.name} className="space-y-2.5">
                      <h4 className="text-sm font-black text-indigo-900">{gi === 0 ? '✨' : '🌟'} Class {g.name} · what's next</h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                        {g.chapters.map((ch, i) => tile(ch, i + gi, g.name))}
                      </div>
                    </div>
                  ))}
                </div>
              );
            }

            // Curiosity Corner: one mixed set from the lower grades, no grades or numbers
            const all = dailyShuffle(lowerGroups.flatMap((g) => g.chapters.filter(matches).map((ch) => ({ ...ch, _grade: g.name }))));
            if (!all.length) return <p className="text-center py-10 text-sm font-bold text-slate-500">{q ? `Nothing matches "${searchQuery}"` : 'More to discover soon!'}</p>;
            return (
              <div className="space-y-3">
                <p className="text-xs font-semibold text-slate-500">Just wondering about something? Pick any topic — no order, no rush.</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {all.map((ch, i) => tile(ch, i, ch._grade))}
                </div>
              </div>
            );
          })()}
        </div>

        {/* Footer */}
        <div className="px-5 sm:px-6 py-3 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span>🏆 Completed: <strong className="text-slate-800">{completedCount}</strong></span>
            <span>•</span>
            <span>⚡ In Progress: <strong className="text-slate-800">{inProgressCount}</strong></span>
          </div>
          <button
            onClick={onClose}
            className="font-bold text-slate-600 hover:text-slate-900 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default React.memo(AllChaptersModal);
