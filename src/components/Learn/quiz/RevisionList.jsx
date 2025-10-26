import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext.jsx';
import reviewService from '../../../services/reviewService.js';
import curriculumService from '../../../services/curriculumService.js';
import { useReview } from '../../../context/ReviewContext.jsx';
import BackButton from '../../ui/BackButton.jsx';

export default function RevisionList() {
  const [params] = useSearchParams();
  const moduleId = params.get('moduleId') || '';
  const chapterId = params.get('chapterId') || '';
  const unitId = params.get('unitId') || '';
  const moduleTitleParam = params.get('moduleTitle') || '';
  const defaultOnly = params.get('defaultOnly') === 'true';
  const { user } = useAuth();
  const { reset, add } = useReview();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modules, setModules] = useState([]);
  const [chapterName, setChapterName] = useState('');
  const [moduleName, setModuleName] = useState(moduleTitleParam);
  const [chapters, setChapters] = useState([]);
  const [units, setUnits] = useState([]);
  const [unitName, setUnitName] = useState('');
  const [defaultEntries, setDefaultEntries] = useState([]);
  const [incorrectCountByModule, setIncorrectCountByModule] = useState({});
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const EyeIcon = ({ className = 'w-5 h-5' }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 5c-7 0-10 7-10 7s3 7 10 7 10-7 10-7-3-7-10-7zm0 12a5 5 0 1 1 0-10 5 5 0 0 1 0 10z"/>
      <circle cx="12" cy="12" r="2.5" fill="#fff"/>
    </svg>
  );
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      if (!user?._id) return;
      setLoading(true);
      let list = [];
      // Global subject-level view (no chapterId/moduleId)
      if (!moduleId && !chapterId) {
        try {
          const subj = user?.subject || 'Science';
          const brd = user?.board || 'CBSE';
          const chResp = await curriculumService.listChapters(brd, subj);
          setChapters(chResp?.data || []);
          setItems([]);
          setLoading(false);
          return;
        } catch (_) {
          setChapters([]);
          setLoading(false);
          return;
        }
      }
      // If chapter view without unit chosen, list units (and fallback to modules if none)
      if (!moduleId && chapterId && !unitId) {
        try {
          // Chapter title
          try {
            const chs = await curriculumService.listChapters('CBSE', user?.subject || 'Science');
            const chObj = (chs?.data || []).find(c => c._id === chapterId);
            if (chObj?.title) setChapterName(chObj.title);
          } catch (_) {}
          const un = await curriculumService.listUnits(chapterId);
          const arr = un?.data || [];
          setUnits(arr);
          // Fallback: if there are no units, load modules directly by chapter so user can continue
          if (!arr || arr.length === 0) {
        try {
          const mods = await curriculumService.listModules(chapterId);
              setModules(mods?.data || []);
            } catch (_) {
              setModules([]);
            }
          }
        } catch (_) {
          setUnits([]);
        }
        setItems([]);
        setLoading(false);
        return;
      }
      // If unit view, list modules in this unit and filter incorrect items by those
      if (!moduleId && unitId) {
        try {
          const mods = await curriculumService.listModulesByUnit(unitId);
          const modArr = mods?.data || [];
          setModules(modArr);
          // Try to fetch chapter name
          try {
            const chs = await curriculumService.listChapters('CBSE', user?.subject || 'Science');
            const chObj = (chs?.data || []).find(c => c._id === chapterId);
            if (chObj?.title) setChapterName(chObj.title);
          } catch (_) {}
          // Try to fetch unit name
          try {
            const un = await curriculumService.listUnits(chapterId);
            const uObj = (un?.data || []).find(u => u._id === unitId);
            if (uObj?.title) setUnitName(uObj.title);
            // Persist last opened unit for this chapter
            try {
              const map = JSON.parse(localStorage.getItem('last_unit_by_chapter') || '{}');
              map[chapterId] = unitId;
              localStorage.setItem('last_unit_by_chapter', JSON.stringify(map));
            } catch (_) {}
          } catch (_) {}
          const allIncorrect = await reviewService.listIncorrect(user._id);
          const allowed = new Set(modArr.map(m => m._id));
          list = (allIncorrect || []).map(it => {
            if (!it.moduleId && it.questionId) {
              const [mod] = String(it.questionId).split('_');
              return { ...it, moduleId: mod };
            }
            return it;
          }).filter(it => allowed.has(it.moduleId));
          // Build incorrect counts
          try {
            const counts = {};
            for (const it of list) {
              const mid = String(it.moduleId);
              counts[mid] = (counts[mid] || 0) + 1;
            }
            setIncorrectCountByModule(counts);
          } catch (_) { setIncorrectCountByModule({}); }
          // Fetch default revision items for this unit (keep separate for special box)
          try {
            const defaults = await reviewService.listDefaults({ unitId });
            setDefaultEntries((defaults || []).filter(d => !d.moduleId || allowed.has(d.moduleId)));
          } catch (_) { setDefaultEntries([]); }
        } catch (_) { list = []; }
      } else {
        list = await reviewService.listIncorrect(user._id, moduleId || undefined, chapterId || undefined);
        // When specific module view, also fetch defaults for that module
        if (moduleId) {
          try {
            const defaults = await reviewService.listDefaults({ moduleId });
            const makeId = (d, idx) => `${String(moduleId)}_${String(idx + 1)}_${String(d.type || 'statement')}`;
            const defaultsAsItems = (defaults || []).map((d, idx) => ({
              questionId: makeId(d, idx),
              moduleId: String(moduleId),
              label: d.question || d.text || `Default ${idx + 1}`,
              count: 0,
              lastSeenAt: null,
              _source: 'default'
            }));
            const seen = new Set(list.map(i => i.questionId));
            const merged = [...defaultsAsItems.filter(i => !seen.has(i.questionId)), ...list];
            list = merged;
          } catch (_) {}
        }
      }
      // If defaultOnly view at unit level, map defaults to items list (questionId resolvable)
      if (defaultOnly && unitId) {
        try {
          // Show ALL defaults as-is, without mapping to module items
          const mappedAll = (defaultEntries || []).map((d, i) => ({
            questionId: `${String(d.moduleId || 'unknown')}_${String(i)}_${String(d.type || 'statement')}`,
            moduleId: String(d.moduleId || ''),
            label: d.question || d.text || `Default ${i + 1}`,
            count: 0,
            lastSeenAt: null,
            _source: 'default'
          }));
          setItems(mappedAll);
        } catch (_) {
          setItems([]);
        }
      } else {
      setItems(list);
      }
      // If a module is specified, fetch its items to show titles/questions
      if (moduleId) {
        try {
          const res = await curriculumService.listItems(moduleId);
          const arr = res?.data || [];
          // Validate and attach label: keep only items that exist in module and type matches
          const sanitized = list.filter(it => {
            const parts = String(it.questionId).split('_');
            if (parts.length < 3) return false;
            const idx = Number(parts[1]);
            const type = String(parts[2]);
            if (!(idx >= 0 && idx < arr.length)) return false;
            const t = String(arr[idx]?.type || '');
            return t === type || (t === 'statement' && (type === '' || type === 'statement'));
          }).map(it => {
            const [mod, idx] = String(it.questionId).split('_');
            const item = arr[Number(idx)] || {};
            const t = String(item.type || '');
            const label = (t === 'statement' ? (item.text || item.statement) : (item.question || item.title || item.statement)) || '';
            return { ...it, label: label };
          });
          setItems(sanitized);
          const posibleName = arr[0]?.moduleTitle || arr[0]?.module || arr.moduleTitle;
          if (posibleName && !moduleTitleParam) setModuleName(posibleName);
        } catch (_) {}
        if (chapterId && !moduleTitleParam) {
          try {
            const mods = await curriculumService.listModules(chapterId);
            const modArr = mods?.data || [];
            const found = modArr.find(m => m._id === moduleId);
            if (found?.title) setModuleName(found.title);
          } catch (_) {}
        }
        // Fallback: scan chapters to find module title
        if (!moduleTitleParam && !moduleName) {
          try {
            const chs = await curriculumService.listChapters('CBSE', user?.subject || 'Science');
            const chapters = chs?.data || [];
            for (const ch of chapters) {
              try {
                const mods = await curriculumService.listModules(ch._id);
                const listMods = mods?.data || [];
                const fm = listMods.find(m => m._id === moduleId);
                if (fm?.title) { setModuleName(fm.title); break; }
              } catch (_) {}
            }
          } catch (_) {}
        }
      }
      setLoading(false);
    };
    load();
  }, [user, moduleId, chapterId, unitId, defaultOnly]);

  const startReview = () => {
    // Build queue synchronously and then navigate with a brief tick to let context update
    reset();
    const unique = items.filter(it => !!it?.questionId);
    unique.forEach(({ questionId }) => {
      const [mod, idx, type] = String(questionId).split('_');
      add({ questionId, moduleNumber: mod, index: idx, type: type || 'multiple-choice' });
    });
    if (unique.length > 0) {
      const [mod, idx, type] = String(unique[0].questionId).split('_');
      let path = `/learn/module/${mod}`;
      if (type === 'multiple-choice') path += `/mcq/${idx}`;
      else if (type === 'fill-in-the-blank') path += `/fillups/${idx}`;
      else if (type === 'rearrange') path += `/rearrange/${idx}`;
      else path += `/concept/${idx}`;
      // Use /review-round as a fallback if direct navigation fails; try both sequentially
      setTimeout(() => {
        try { navigate(`${path}?review=true`); } catch (_) { navigate('/review-round'); }
      }, 0);
    }
  };

  const subjectName = user?.subject || 'Science';
  const paginate = (arr) => {
    const start = (page - 1) * pageSize;
    return arr.slice(start, start + pageSize);
  };
  const Pagination = ({ total }) => {
    const totalPages = Math.max(1, Math.ceil(total / Math.max(1, pageSize)));
    const go = (n) => setPage(Math.min(totalPages, Math.max(1, n)));
    return (
      <div className="mt-6 flex items-center justify-between">
        {/* Page size */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] sm:text-xs font-extrabold text-blue-700">Per page</span>
          <select
            value={pageSize}
            onChange={(e)=>{ setPageSize(Number(e.target.value)||10); setPage(1); }}
            className="px-2 py-1 text-[10px] sm:text-xs font-bold rounded-xl bg-white border-2 border-blue-200 text-blue-700 hover:border-blue-300 shadow-[0_4px_0_0_rgba(0,0,0,0.06)]"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
          </select>
        </div>
        {/* Simple playful pager */}
        <div className="flex items-center gap-3 sm:gap-4">
          <button
            disabled={page<=1}
            onClick={()=>go(page-1)}
            className={`h-8 sm:h-9 px-3.5 sm:px-5 inline-flex items-center rounded-xl sm:rounded-2xl text-[10px] sm:text-xs font-extrabold shadow-[0_4px_0_0_rgba(0,0,0,0.06)] transition ${page<=1? 'bg-gray-100 text-gray-400' : 'bg-blue-500 text-white hover:brightness-110'}`}
          >
            ⬅ Prev
          </button>
          <span className="h-8 sm:h-9 inline-flex items-center px-3 sm:px-4 rounded-full bg-yellow-300 text-yellow-900 text-[10px] sm:text-xs font-extrabold shadow-[0_4px_0_0_rgba(0,0,0,0.06)]">Page {page} of {totalPages}</span>
          <button
            disabled={page>=totalPages}
            onClick={()=>go(page+1)}
            className={`h-8 sm:h-9 px-3.5 sm:px-5 inline-flex items-center rounded-xl sm:rounded-2xl text-[10px] sm:text-xs font-extrabold shadow-[0_4px_0_0_rgba(0,0,0,0.06)] transition ${page>=totalPages? 'bg-gray-100 text-gray-400' : 'bg-green-500 text-white hover:brightness-110'}`}
          >
            Next ➡
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#E8F2FF] to-white py-10 px-6 relative">
      <BackButton className="fixed left-4 top-4" />
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-blue-700 tracking-wide">Let’s Fix What We Missed!</h1>
          <p className="mt-3 sm:mt-4 text-base sm:text-lg md:text-xl text-blue-900/80">{(!chapterId && !moduleId) ? 'Subject' : (moduleId ? 'Module' : (unitId ? 'Unit' : 'Chapter'))}:
            <span className="ml-2 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-2xl bg-blue-100 text-blue-800 font-bold text-sm sm:text-base">
              {!chapterId && !moduleId ? subjectName : (moduleId ? (moduleName || 'Loading…') : (unitId ? (unitName || 'Loading…') : (chapterName || 'Loading…')))}
            </span>
          </p>
        </div>
      {loading ? (
        <div>Loading…</div>
      ) : (!moduleId && !chapterId) ? (
        // Subject-level index: show chapters (blue UI)
        (() => {
          if ((chapters || []).length === 0) return <div>No chapters found.</div>;
          return (
            <ul className="space-y-4 sm:space-y-6">
              {chapters.map((ch) => (
                <li key={ch._id} className="w-full p-4 sm:p-6 rounded-3xl border-4 border-blue-300 bg-white shadow-[0_10px_0_0_rgba(59,130,246,0.22)] flex items-center justify-between">
                  <div className="pr-4">
                    <div className="text-lg sm:text-xl font-extrabold text-blue-800">{ch.title}</div>
                    <div className="text-sm text-blue-900/70 mt-1">Chapter</div>
                  </div>
                  <div className="flex items-center gap-4">
                    <button onClick={() => navigate(`/revision?chapterId=${encodeURIComponent(ch._id)}`)} className="px-4 py-2 sm:px-5 sm:py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-sm sm:text-base font-extrabold shadow-[0_6px_0_0_rgba(0,0,0,0.15)]">Open</button>
                  </div>
                </li>
              ))}
            </ul>
          );
        })()
      ) : (!moduleId && chapterId && !unitId) ? (
        // Chapter-level index: show units; if none, show modules directly (fallback)
        (() => {
          if ((units || []).length === 0) {
            if ((modules || []).length === 0) return <div>No units found.</div>;
            // Fallback modules listing by chapter
            return (
              <ul className="space-y-4 sm:space-y-6">
                {modules.map((m) => (
                  <li key={m._id} className="w-full p-4 sm:p-6 rounded-3xl border-4 border-green-300 bg-white shadow-[0_10px_0_0_rgba(34,197,94,0.18)] flex items-center justify-between">
                    <div className="pr-4">
                      <div className="text-xl sm:text-2xl font-extrabold text-green-700">{m.title || 'Module'}</div>
                      <div className="text-sm text-green-900/70 mt-1">Module</div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="px-3 py-1 rounded-full bg-green-100 text-green-800 font-bold text-sm inline-flex items-center gap-2">Items {incorrectCountByModule[m._id] || 0}</span>
                      <button onClick={() => navigate(`/revision?moduleId=${encodeURIComponent(m._id)}&moduleTitle=${encodeURIComponent(m.title || 'Module')}`)} className="px-4 py-2 sm:px-5 sm:py-3 rounded-2xl bg-green-600 hover:bg-green-700 text-white text-sm sm:text-base font-extrabold shadow-[0_6px_0_0_rgba(0,0,0,0.15)]">Open</button>
                    </div>
                  </li>
                ))}
              </ul>
            );
          }
          return (
            <ul className="space-y-4 sm:space-y-6">
              {units.map((u) => (
                <li key={u._id} className="w-full p-4 sm:p-6 rounded-3xl border-4 border-purple-300 bg-white shadow-[0_10px_0_0_rgba(147,51,234,0.18)] flex items-center justify-between">
                  <div className="pr-4">
                    <div className="text-xl sm:text-2xl font-extrabold text-purple-700">{u.title}</div>
                    <div className="text-sm text-purple-900/70 mt-1">Unit</div>
                  </div>
                  <div className="flex items-center gap-4">
                    <button onClick={() => navigate(`/revision?chapterId=${encodeURIComponent(chapterId)}&unitId=${encodeURIComponent(u._id)}`)} className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs sm:text-sm font-extrabold shadow-[0_4px_0_0_rgba(0,0,0,0.15)]">Open</button>
                  </div>
                </li>
              ))}
            </ul>
          );
        })()
      ) : (!moduleId && unitId && defaultOnly) ? (
        // Default-only unit-level list
        (() => {
          if ((items || []).length === 0) return <div>No default items found for this unit.</div>;
          return (
            <>
              <div className="mb-4 flex items-center justify-center">
                <button onClick={startReview} className="inline-block px-6 py-3 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white text-base font-extrabold shadow-[0_6px_0_0_rgba(0,0,0,0.15)]">Start Super Important Revision</button>
              </div>
              <ul className="space-y-4 mb-10">
                {paginate(items).map((it, i) => (
                  <li key={i} className="p-6 rounded-3xl bg-white border-4 border-purple-300 shadow-[0_10px_0_0_rgba(147,51,234,0.18)] flex items-center justify-between">
                    <div className="flex flex-col pr-4">
                      <span className="text-lg font-extrabold text-purple-800">{it.label || it.questionId}</span>
                      <span className="text-xs text-gray-500">Default revision</span>
                    </div>
                    <span className="text-sm text-gray-700 inline-flex items-center gap-2">Recommended</span>
                  </li>
                ))}
              </ul>
              <Pagination total={items.length} />
            </>
          );
        })()
      ) : (!moduleId && unitId) ? (
        // Unit-level index: show all modules in the unit, enriched with incorrect stats if present
        (() => {
          const defaultsCount = (defaultEntries || []).length;
          const stats = items.reduce((acc, it) => {
            if (!it.moduleId) return acc;
            const id = it.moduleId;
            const t = it.lastSeenAt ? new Date(it.lastSeenAt).getTime() : 0;
            if (!acc[id]) acc[id] = { count: 0, last: 0 };
            acc[id].count += 1;
            if (t > acc[id].last) acc[id].last = t;
            return acc;
          }, {});
          const list = (modules || []).map(m => ({ id: m._id, title: m.title || 'Module', stat: stats[m._id] || { count: 0, last: 0 } }));
          if (list.length === 0) return <div>No modules found.</div>;
          return (
            <>
              {/* Super Important box */}
              <div className="w-full p-4 sm:p-6 rounded-3xl border-4 border-purple-300 bg-white shadow-[0_10px_0_0_rgba(147,51,234,0.18)] flex items-center justify-between mb-4 sm:mb-6">
                <div className="pr-4">
                  <div className="text-xl sm:text-2xl font-extrabold text-purple-700">Super Important Revision Questions</div>
                  <div className="text-xs sm:text-sm text-purple-900/70 mt-1">{defaultsCount} recommended items</div>
                </div>
                <div className="flex items-center gap-4">
                  <button onClick={() => navigate(`/revision?chapterId=${encodeURIComponent(chapterId)}&unitId=${encodeURIComponent(unitId)}&defaultOnly=true`)} className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs sm:text-sm font-extrabold shadow-[0_4px_0_0_rgba(0,0,0,0.15)]">Open</button>
                </div>
              </div>
            <ul className="space-y-4 sm:space-y-6">
              {paginate(list).map(({ id, title, stat }) => (
                <li key={id} className="w-full p-4 sm:p-6 rounded-3xl border-4 border-green-300 bg-white shadow-[0_10px_0_0_rgba(34,197,94,0.18)] flex items-center justify-between">
                  <div className="pr-4">
                    <div className="text-xl sm:text-2xl font-extrabold text-green-700">{title}</div>
                    <div className="text-xs sm:text-sm text-green-900/70 mt-1">Last attempt: {stat.last ? new Date(stat.last).toLocaleString() : '—'}</div>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-4">
                    <button onClick={() => navigate(`/revision?moduleId=${encodeURIComponent(id)}&moduleTitle=${encodeURIComponent(title)}`)} className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white text-xs sm:text-sm font-extrabold shadow-[0_4px_0_0_rgba(0,0,0,0.15)]">Open</button>
                  </div>
                </li>
              ))}
            </ul>
            <Pagination total={list.length} />
            </>
          );
        })()
      ) : items.length === 0 ? (
        <div>No items to review.</div>
      ) : (
        <>
          {moduleId && (
            <div className="mb-4 flex items-center justify-center">
              <button onClick={startReview} className="inline-block px-6 py-3 rounded-2xl bg-green-600 hover:bg-green-700 text-white text-base font-extrabold shadow-[0_6px_0_0_rgba(0,0,0,0.15)]">Start Re-attempt</button>
            </div>
          )}
          <ul className="space-y-4 mb-10">
            {paginate(items).map((it, i) => (
              <li key={i} className="p-6 rounded-3xl bg-white border-4 border-blue-300 shadow-[0_10px_0_0_rgba(59,130,246,0.22)] flex items-center justify-between">
                <div className="flex flex-col pr-4">
                  <span className="text-xl font-extrabold text-blue-800">{it.label || it.questionId}</span>
                  <span className="text-xs text-gray-500">Last seen: {it.lastSeenAt ? new Date(it.lastSeenAt).toLocaleString() : '—'}</span>
                </div>
                <span className="text-sm text-gray-700 inline-flex items-center gap-2">Attempted {it.count}</span>
              </li>
            ))}
          </ul>
          <Pagination total={items.length} />
        </>
      )}
      </div>
    </div>
  );
}
