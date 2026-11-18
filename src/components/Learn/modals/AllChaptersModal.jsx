import React, { useState, useMemo, useEffect } from 'react';
import curriculumService from '../../../services/curriculumService.js';
import { ChapterArt } from '../../layout/home/ChaptersGrid.jsx';
import { isJuniorClass } from '../../../utils/classLevel.js';

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
  const [searchOpen, setSearchOpen] = useState(false);
  const [filterTab, setFilterTab] = useState('all'); // 'all' | 'in_progress' | 'completed'
  // 'mine' = the student's own class. Other classes are two explore spaces, not a syllabus:
  // 'levelup' = higher grades (grouped by grade, to look forward to), 'curious' = lower grades
  // (one mixed set of topics, no grades or numbers)
  // Class 1-5 learners have no chapters of their own class yet: they study Class 6, and the panel opens on
  // Level Up with Classes 6, 7 and 8 (no "own class" or Curiosity Corner tab)
  const junior = isJuniorClass(classLevel);
  const [view, setView] = useState(junior ? 'levelup' : 'mine');
  const [other, setOther] = useState({ loading: false, failed: false, groups: null }); // groups: [{ name, chapters }]
  // 'young' = Young Explorers: chapters an admin picked for this space, from any class
  const [young, setYoung] = useState({ loading: false, failed: false, chapters: null });
  const ownClass = junior ? '' : classNumber(classLevel);
  const ownNum = junior ? 5 : (Number(ownClass) || 0);
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
        return { name: classNumber(cls.name) || String(cls.name), chapters: (resp?.data || []).filter((c) => c && (c._id || c.id) && c.isPublished !== false) };
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

  const loadYoungExplorers = async () => {
    setYoung({ loading: true, failed: false, chapters: null });
    try {
      const resp = await curriculumService.listYoungExplorers(board, subjectName);
      const chapters = (resp?.data || []).filter((c) => c && (c._id || c.id) && c.isPublished !== false);
      setYoung({ loading: false, failed: false, chapters });
    } catch (_) {
      setYoung({ loading: false, failed: true, chapters: null });
    }
  };

  const openExplore = (space) => {
    setView(space);
    if (space === 'young') {
      if (!young.chapters && !young.loading) loadYoungExplorers();
      return;
    }
    if (!other.groups && !other.loading) loadOtherChapters();
  };
  const hasYoung = !young.chapters || young.chapters.length > 0;

  // Load the other classes as soon as the panel opens, so the explore tabs know whether they
  // have anything to show (Class 8 has no Level Up, Class 6 no Curiosity Corner)
  useEffect(() => {
    if (isOpen && !other.groups && !other.loading) loadOtherChapters();
    if (isOpen && !young.chapters && !young.loading) loadYoungExplorers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Open on the tab holding the chapter the student is in: their own class right away; a chapter
  // from another class once those have loaded (only when the panel opens, never mid-browse)
  const placedRef = React.useRef(false);
  useEffect(() => {
    if (!isOpen) { placedRef.current = false; return; }
    if (junior) { setView('levelup'); placedRef.current = true; return; }
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

  // Compute chapter metadata
  const chaptersWithMeta = useMemo(() => {
    return chaptersList
      .filter((ch) => ch && ch.isPublished !== false)
      .map((ch, index) => {
      const st = chapterStats[ch._id] || { total: 0, completed: 0 };
      const pct = st.total > 0 ? Math.min(100, Math.round((st.completed / st.total) * 100)) : 0;
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
  }, [chaptersList, chapterStats, currentChapterId]);

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

  // One chapter card, used by every tab: a big picture with no frame, a small label, the title and a thin
  // progress bar, on a dark card with a short connector line to the next card
  const renderChapterCard = ({ ch, eyebrow = '', isHere = false, st = null, isLast, onClick, disabled = false, hint = '' }) => {
    const total = st?.total || 0;
    const done = st?.completed || 0;
    const pct = total > 0 ? Math.min(100, Math.round((done / total) * 100)) : 0;
    const isCompleted = total > 0 && done >= total;
    const started = done > 0 && !isCompleted;
    const id = String(ch._id || ch.id);
    return (
      <React.Fragment key={id}>
        <button
          type="button"
          onClick={onClick}
          disabled={disabled}
          className={`group relative w-full text-left rounded-[20px] bg-white border p-3.5 pr-4 flex items-center gap-4 min-h-[96px] transition-all duration-150 ${
            disabled
              ? 'opacity-55 cursor-not-allowed border-slate-200'
              : isHere
                ? 'border-amber-400 bg-gradient-to-br from-white to-[#FFFBF2] shadow-[0_0_0_4px_rgba(251,191,36,0.16),0_10px_24px_-12px_rgba(217,119,6,0.45)] active:scale-[0.99]'
                : 'border-slate-200/80 shadow-[0_1px_2px_rgba(16,24,40,0.04),0_6px_16px_-10px_rgba(16,24,40,0.12)] hover:border-slate-300 hover:shadow-[0_2px_4px_rgba(16,24,40,0.05),0_14px_28px_-14px_rgba(16,24,40,0.22)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99]'
          }`}
        >
          {/* Big picture, no frame */}
          <span className={`w-[72px] h-[64px] shrink-0 flex items-center justify-center text-[50px] leading-none drop-shadow-[0_6px_8px_rgba(15,23,42,0.16)] transition-transform group-hover:scale-110 group-hover:-rotate-3 ${disabled ? 'grayscale' : ''}`} aria-hidden="true">
            <ChapterArt chapter={ch} imgClassName="w-16 h-16" />
          </span>

          <span className="min-w-0 flex-1">
            {(eyebrow || isHere || disabled) && (
              <span className="flex items-center gap-2 mb-1">
                {eyebrow && <span className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">{eyebrow}</span>}
                {isHere && <span className="text-[9px] uppercase tracking-[0.12em] font-black px-1.5 py-px rounded-md bg-amber-400 text-[#3B2600]">Continue</span>}
                {disabled && <span className="text-[9px] uppercase tracking-[0.12em] font-black px-1.5 py-px rounded-md bg-slate-100 text-slate-500">Coming soon</span>}
              </span>
            )}
            <span className="block text-[15.5px] sm:text-base font-bold text-[#15172B] leading-snug line-clamp-2" title={ch.title}>
              {topicName(ch.title) || ch.title}
            </span>
            {started || isCompleted ? (
              <span className="mt-2.5 flex items-center gap-2.5">
                <span className="h-1 w-24 sm:w-32 rounded-full bg-slate-100 overflow-hidden">
                  <span className={`block h-full rounded-full ${isCompleted ? 'bg-emerald-500' : 'bg-gradient-to-r from-amber-400 to-orange-400'}`} style={{ width: `${Math.max(pct, 6)}%` }} />
                </span>
                <span className={`text-[11px] font-bold tabular-nums ${isCompleted ? 'text-emerald-600' : 'text-slate-500'}`}>
                  {isCompleted ? 'Done' : `${done}/${total}`}
                </span>
              </span>
            ) : (
              <span className="mt-1.5 block text-[12px] font-semibold text-slate-400">{total > 0 ? `${total} lessons` : hint}</span>
            )}
          </span>
        </button>
        {/* Connector to the next card */}
        {!isLast && <span aria-hidden="true" className="block mx-auto h-3.5 w-0.5 bg-slate-200" />}
      </React.Fragment>
    );
  };

  // The chapter shown big in the header: the current one, else the first one started, else the first
  const spotlight = chaptersWithMeta.find((c) => c.isCurrent && !c.isComingSoon)
    || chaptersWithMeta.find((c) => c.isInProgress && !c.isComingSoon)
    || chaptersWithMeta[0];

  const SPACES = [
    { id: 'mine', label: ownClass ? `Class ${ownClass}` : 'My Chapters', icon: '📚', show: !junior },
    { id: 'levelup', label: 'Level Up', icon: '🚀', show: !other.groups || higherGroups.length > 0 },
    { id: 'young', label: 'Young Explorers', icon: '🧭', show: hasYoung },
    { id: 'curious', label: 'Curiosity Corner', icon: '🔍', show: !other.groups || lowerGroups.length > 0 }
  ].filter((t) => t.show);

  const HERO = {
    mine: { kicker: `${ownClass ? `Class ${ownClass} · ` : ''}${totalChapters} chapters`, title: subjectName, line: completedCount > 0 ? `${completedCount} of ${totalChapters} chapters done. Keep going!` : 'Pick a chapter and start exploring' },
    levelup: junior
      ? { kicker: 'Class 1–5', title: 'Your chapters', line: 'Science from Class 6, 7 and 8. Start anywhere you like!' }
      : { kicker: 'Next grades', title: 'Level Up', line: 'A sneak peek at what older students discover' },
    young: { kicker: 'Hand-picked', title: 'Young Explorers', line: 'Adventures chosen for curious minds' },
    curious: { kicker: 'Any order', title: 'Curiosity Corner', line: 'Wonder about anything you like, no rush' },
  }[view] || { kicker: '', title: subjectName, line: '' };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center p-3 sm:p-5 bg-slate-900/45 backdrop-blur-sm animate-fade-in font-sans"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-[28px] max-w-2xl w-full shadow-[0_30px_80px_-20px_rgba(15,23,42,0.45)] border border-black/5 flex flex-col h-[min(88dvh,860px)] overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Spaces: picture tiles across the top */}
        <div className="shrink-0 flex items-start gap-2 px-3.5 sm:px-5 pt-3.5 pb-2 border-b border-slate-100">
          <div className="flex items-start gap-2 sm:gap-2.5 overflow-x-auto overflow-y-hidden no-scrollbar min-w-0 flex-1" role="tablist" aria-label="Chapter spaces">
            {SPACES.map((tab, i) => {
              const active = view === tab.id;
              return (
                <React.Fragment key={tab.id}>
                  {i === 1 && !junior && <span aria-hidden="true" className="self-stretch my-1 w-px bg-slate-200 shrink-0" />}
                  <button
                    role="tab"
                    aria-selected={active}
                    onClick={() => { setSearchQuery(''); setSearchOpen(false); if (tab.id === 'mine') setView('mine'); else openExplore(tab.id); }}
                    className="group flex flex-col items-center gap-1.5 shrink-0 w-[68px] sm:w-[78px]"
                  >
                    <span
                      className={`flex items-center justify-center w-[64px] h-[50px] sm:w-[72px] sm:h-[54px] rounded-[14px] border-2 text-[26px] transition-colors ${
                        active ? 'border-amber-400 bg-[#FFF7E6] shadow-[0_6px_14px_-8px_rgba(217,119,6,0.5)]' : 'border-slate-200 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.05)] group-hover:border-slate-300'
                      }`}
                      aria-hidden="true"
                    >
                      {tab.icon}
                    </span>
                    <span className={`text-[11px] font-bold leading-tight text-center line-clamp-2 ${active ? 'text-[#15172B]' : 'text-slate-500'}`}>{tab.label}</span>
                    <span className={`h-[3px] w-10 rounded-full ${active ? 'bg-amber-400' : 'bg-transparent'}`} aria-hidden="true" />
                  </button>
                </React.Fragment>
              );
            })}
          </div>
          <button
            onClick={onClose}
            className="shrink-0 w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-[#15172B] flex items-center justify-center text-sm font-bold transition-colors"
            title="Close (Esc)"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Everything below scrolls together */}
        <div className="flex-1 overflow-y-auto">
          {/* Hero: kicker, big title, one line, and a big picture */}
          <div className="relative overflow-hidden px-4 sm:px-6 pt-5 pb-4 bg-gradient-to-b from-[#FFF6E5] via-[#FFFBF4] to-white">
            <span aria-hidden="true" className="pointer-events-none absolute -top-16 right-6 h-44 w-44 rounded-full bg-amber-300/30 blur-3xl" />
            <div className="relative flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">{HERO.kicker}</p>
                <h3 className="mt-1.5 text-[30px] sm:text-[34px] font-black leading-none text-[#15172B] tracking-tight">{HERO.title}</h3>
                <p className="mt-2 text-[14px] font-medium leading-snug text-slate-500">{HERO.line}</p>
              </div>
              <span className="shrink-0 w-[84px] h-[84px] flex items-center justify-center text-[64px] leading-none drop-shadow-[0_12px_16px_rgba(15,23,42,0.18)] -rotate-6" aria-hidden="true">
                {view === 'mine' && spotlight
                  ? <ChapterArt chapter={spotlight} imgClassName="w-20 h-20" />
                  : (SPACES.find((t) => t.id === view)?.icon || '📚')}
              </span>
            </div>

            {/* Filters and search */}
            <div className={`relative ${view === 'mine' || searchOpen ? 'mt-4' : '-mt-1'}`}>
              {searchOpen ? (
                <div className="relative">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 1 0 3.4 9.83l3.13 3.14a.75.75 0 1 0 1.06-1.06l-3.13-3.14A5.5 5.5 0 0 0 9 3.5ZM5 9a4 4 0 1 1 8 0 4 4 0 0 1-8 0Z" clipRule="evenodd" /></svg>
                  <input
                    id="all-chapters-search"
                    type="text"
                    autoFocus
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={view === 'mine' ? 'Search chapters' : 'Search a topic'}
                    className="w-full pl-9 pr-16 py-2.5 text-sm font-semibold text-[#15172B] bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-amber-400/70 placeholder:text-slate-400"
                  />
                  <button
                    onClick={() => { setSearchQuery(''); setSearchOpen(false); }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 text-xs font-bold text-slate-500 hover:text-[#15172B]"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  {view === 'mine' && [
                    { id: 'all', label: 'All', n: totalChapters },
                    { id: 'in_progress', label: 'In progress', n: inProgressCount },
                    { id: 'completed', label: 'Done', n: completedCount },
                  ].map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setFilterTab(f.id)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
                        filterTab === f.id ? 'bg-[#15172B] text-white shadow-sm' : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300 hover:text-[#15172B]'
                      }`}
                    >
                      {f.label} <span className={filterTab === f.id ? 'text-white/50' : 'text-slate-400'}>{f.n}</span>
                    </button>
                  ))}
                  <button
                    onClick={() => setSearchOpen(true)}
                    className="ml-auto shrink-0 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-[#15172B] flex items-center justify-center"
                    aria-label="Search"
                    title="Search"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 1 0 3.4 9.83l3.13 3.14a.75.75 0 1 0 1.06-1.06l-3.13-3.14A5.5 5.5 0 0 0 9 3.5ZM5 9a4 4 0 1 1 8 0 4 4 0 0 1-8 0Z" clipRule="evenodd" /></svg>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Cards */}
          <div className="px-3.5 sm:px-6 pb-6 pt-1">
            {view === 'mine' && (<>
              {statsLoading && totalChapters === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                  <div className="animate-spin rounded-full h-8 w-8 border-[3px] border-amber-400 border-t-transparent mb-3"></div>
                  <span className="text-xs font-bold">Loading chapters...</span>
                </div>
              )}

              {filteredChapters.map((ch, i) => renderChapterCard({
                ch,
                eyebrow: '',
                isHere: ch.isCurrent,
                st: ch.st,
                isLast: i === filteredChapters.length - 1,
                disabled: ch.isComingSoon,
                onClick: () => onSelectChapter(ch),
              }))}

              {filteredChapters.length === 0 && !statsLoading && (
                <div className="text-center py-10 px-4">
                  <p className="text-sm font-bold text-[#15172B]">No chapters found</p>
                  <p className="text-xs text-slate-400 mt-1">
                    {searchQuery ? `Nothing matches "${searchQuery}"` : 'Nothing here yet'}
                  </p>
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className="mt-3 px-3 py-1.5 text-xs font-bold text-[#3B2600] bg-amber-400 rounded-lg">
                      Clear search
                    </button>
                  )}
                </div>
              )}
            </>)}

            {view === 'young' && (() => {
              if (young.loading || !young.chapters) {
                return young.failed ? (
                  <div className="text-center py-10">
                    <p className="text-sm font-bold text-[#15172B]">Couldn't load these topics</p>
                    <button onClick={loadYoungExplorers} className="mt-3 px-3 py-1.5 text-xs font-bold text-[#3B2600] bg-amber-400 rounded-lg">Try again</button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                    <div className="animate-spin rounded-full h-8 w-8 border-[3px] border-amber-400 border-t-transparent mb-3"></div>
                    <span className="text-xs font-bold">Finding adventures...</span>
                  </div>
                );
              }
              const q = searchQuery.toLowerCase().trim();
              const list = young.chapters.filter((c) => !q || topicName(c.title).toLowerCase().includes(q));
              if (!list.length) return <p className="text-center py-10 text-sm font-bold text-slate-500">{q ? `Nothing matches "${searchQuery}"` : 'More adventures coming soon!'}</p>;
              return list.map((ch, i) => {
                const id = String(ch._id || ch.id);
                return renderChapterCard({
                  ch,
                  eyebrow: 'Adventure',
                  isHere: id === String(currentChapterId),
                  st: chapterStats[id] || null,
                  isLast: i === list.length - 1,
                  hint: 'Tap to peek inside',
                  onClick: () => onSelectChapter({ ...ch, _id: id, classLevel: classNumber(ch.classLevel) || ch.classLevel }),
                });
              });
            })()}

            {view !== 'mine' && view !== 'young' && (() => {
              if (other.loading || !other.groups) {
                return other.failed ? (
                  <div className="text-center py-10">
                    <p className="text-sm font-bold text-[#15172B]">Couldn't load these topics</p>
                    <button onClick={loadOtherChapters} className="mt-3 px-3 py-1.5 text-xs font-bold text-[#3B2600] bg-amber-400 rounded-lg">Try again</button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                    <div className="animate-spin rounded-full h-8 w-8 border-[3px] border-amber-400 border-t-transparent mb-3"></div>
                    <span className="text-xs font-bold">Finding topics to explore...</span>
                  </div>
                );
              }
              const q = searchQuery.toLowerCase().trim();
              const matches = (c) => !q || topicName(c.title).toLowerCase().includes(q);
              const card = (ch, gradeName, eyebrow, isLast) => {
                const id = String(ch._id || ch.id);
                return renderChapterCard({
                  ch,
                  eyebrow,
                  isHere: id === String(currentChapterId),
                  st: chapterStats[id] || null,
                  isLast,
                  hint: 'Tap to peek inside',
                  onClick: () => onSelectChapter({ ...ch, _id: id, classLevel: gradeName }),
                });
              };

              if (view === 'levelup') {
                const groups = higherGroups.map((g) => ({ ...g, chapters: g.chapters.filter(matches) })).filter((g) => g.chapters.length);
                if (!groups.length) return <p className="text-center py-10 text-sm font-bold text-slate-500">{q ? `Nothing matches "${searchQuery}"` : 'More to discover soon!'}</p>;
                return (
                  <div className="space-y-5">
                    {groups.map((g) => (
                      <div key={g.name}>
                        <p className="mb-2.5 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Class {g.name}{junior ? '' : " · what's next"}</p>
                        {g.chapters.map((ch, i) => card(ch, g.name, '', i === g.chapters.length - 1))}
                      </div>
                    ))}
                  </div>
                );
              }

              // Curiosity Corner: one mixed set from the lower grades, no grades or numbers
              const all = dailyShuffle(lowerGroups.flatMap((g) => g.chapters.filter(matches).map((ch) => ({ ...ch, _grade: g.name }))));
              if (!all.length) return <p className="text-center py-10 text-sm font-bold text-slate-500">{q ? `Nothing matches "${searchQuery}"` : 'More to discover soon!'}</p>;
              return all.map((ch, i) => card(ch, ch._grade, 'Wonder', i === all.length - 1));
            })()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(AllChaptersModal);
