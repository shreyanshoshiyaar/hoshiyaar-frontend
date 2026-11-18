import React, { useEffect, useMemo, useState } from 'react';
import paymentService from '../../services/paymentService.js';

const MODES = [
  { value: 'trial', label: 'Pro', hint: 'Open during the free trial (48 hours / lesson limit), then Pro only. The default' },
  { value: 'free', label: 'Free for everyone', hint: 'Always open, even for guests and after the trial. Does not use up trial lessons' },
  { value: 'pro_free_start', label: 'Pro, first lessons free', hint: 'The first few lessons stay open for everyone, even after the trial (during the trial they count toward its lesson limit). The rest are Pro after the trial' },
];
const MODE_STYLE = {
  trial: 'bg-amber-100 text-amber-900',
  free: 'bg-green-100 text-green-800',
  pro_free_start: 'bg-blue-100 text-blue-800',
};

// Payments → Chapter Access: who may play each chapter. The server enforces it; the app shows the locks.
export default function ChapterAccessPanel() {
  const [chapters, setChapters] = useState(null);
  const [error, setError] = useState('');
  const [classFilter, setClassFilter] = useState('all');
  const [showDrafts, setShowDrafts] = useState(false);
  const [rowState, setRowState] = useState({}); // chapterId -> 'saving' | 'saved' | error text
  const [freeDraft, setFreeDraft] = useState({}); // chapterId -> text in the "free lessons" box

  useEffect(() => {
    paymentService.getChapterAccess()
      .then((d) => setChapters(d.chapters || []))
      .catch((e) => setError(e.response?.data?.message || 'Could not load chapters'));
  }, []);

  const classes = useMemo(
    () => [...new Set((chapters || []).map((c) => c.className).filter(Boolean))],
    [chapters]
  );
  const rows = (chapters || []).filter((c) =>
    (classFilter === 'all' || c.className === classFilter) && (showDrafts || c.isPublished));

  const save = async (ch, body) => {
    setRowState((s) => ({ ...s, [ch._id]: 'saving' }));
    try {
      const res = await paymentService.setChapterAccess(ch._id, body);
      setChapters((list) => list.map((c) => (c._id === ch._id ? { ...c, ...res.chapter } : c)));
      setRowState((s) => ({ ...s, [ch._id]: 'saved' }));
    } catch (e) {
      setRowState((s) => ({ ...s, [ch._id]: e.response?.data?.message || 'Could not save' }));
    }
  };

  const saveFreeCount = (ch) => {
    const text = freeDraft[ch._id];
    if (text === undefined || Number(text) === ch.proFreeLessons) return;
    save(ch, { proFreeLessons: Number(text) });
  };

  const counts = (chapters || []).reduce((acc, c) => ({ ...acc, [c.accessMode]: (acc[c.accessMode] || 0) + (c.isPublished ? 1 : 0) }), {});

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200">
        <p className="text-sm font-black text-gray-800">Chapter access</p>
        <p className="text-xs font-semibold text-gray-500 mt-0.5">
          Choose which chapters stay free. Every student still gets the free trial (48 hours or the lesson limit) for all
          chapters; this decides what stays open after it. Changes apply within a minute. Lessons a student has already
          played always stay open, and nothing is locked while the paywall is switched off in Pricing &amp; Rules.
        </p>
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {MODES.map((m) => (
            <div key={m.value} className="rounded-xl bg-white border border-gray-200 px-3 py-2">
              <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-black uppercase ${MODE_STYLE[m.value]}`}>{m.label}</span>
              <span className="ml-2 text-xs font-bold text-gray-500">{counts[m.value] || 0} live</span>
              <p className="text-[11px] text-gray-500 mt-1 leading-snug">{m.hint}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <label htmlFor="access-class" className="text-xs font-bold text-gray-600">Class</label>
        <select
          id="access-class"
          value={classFilter}
          onChange={(e) => setClassFilter(e.target.value)}
          className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm font-semibold"
        >
          <option value="all">All classes</option>
          {classes.map((c) => <option key={c} value={c}>Class {c}</option>)}
        </select>
        <label className="flex items-center gap-2 text-xs font-bold text-gray-600 cursor-pointer">
          <input id="access-drafts" type="checkbox" checked={showDrafts} onChange={(e) => setShowDrafts(e.target.checked)} />
          Show draft chapters too
        </label>
      </div>

      {error && <p className="text-sm font-semibold text-rose-600">{error}</p>}
      {!chapters && !error && <p className="text-sm text-gray-400">Loading chapters…</p>}

      {chapters && (
        <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-[10px] uppercase tracking-wider text-gray-500">
              <tr>
                <th className="p-3">Class</th>
                <th className="p-3">Chapter</th>
                <th className="p-3">Lessons</th>
                <th className="p-3">Who can play</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.length === 0 && (
                <tr><td colSpan={5} className="p-4 text-sm text-gray-400 italic">No chapters here.</td></tr>
              )}
              {rows.map((ch) => {
                const state = rowState[ch._id];
                return (
                  <tr key={ch._id}>
                    <td className="p-3 font-bold text-gray-700 whitespace-nowrap">{ch.className || '—'}</td>
                    <td className="p-3">
                      <span className="font-bold text-gray-800">{ch.title}</span>
                      {!ch.isPublished && <span className="ml-2 rounded-full bg-gray-200 px-2 py-0.5 text-[10px] font-black uppercase text-gray-600">Draft</span>}
                    </td>
                    <td className="p-3 text-gray-600 tabular-nums">{ch.lessons}</td>
                    <td className="p-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <select
                          id={`access-mode-${ch._id}`}
                          aria-label={`Who can play ${ch.title}`}
                          value={ch.accessMode}
                          disabled={state === 'saving'}
                          onChange={(e) => save(ch, { accessMode: e.target.value })}
                          className={`rounded-lg border border-gray-300 px-2 py-1.5 text-sm font-bold ${MODE_STYLE[ch.accessMode]}`}
                        >
                          {MODES.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                        </select>
                        {ch.accessMode === 'pro_free_start' && (
                          <span className="flex items-center gap-1.5 text-xs font-semibold text-gray-600">
                            first
                            <input
                              id={`access-free-${ch._id}`}
                              type="number"
                              min="0"
                              max={Math.max(ch.lessons, 0)}
                              value={freeDraft[ch._id] ?? ch.proFreeLessons}
                              onChange={(e) => setFreeDraft((d) => ({ ...d, [ch._id]: e.target.value }))}
                              onBlur={() => saveFreeCount(ch)}
                              onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
                              className="w-16 rounded-lg border border-gray-300 px-2 py-1 text-sm font-bold"
                              aria-label="Number of free lessons"
                            />
                            lessons free
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-3 text-xs font-bold whitespace-nowrap">
                      {state === 'saving' && <span className="text-gray-400">Saving…</span>}
                      {state === 'saved' && <span className="text-green-700">Saved</span>}
                      {state && state !== 'saving' && state !== 'saved' && <span className="text-rose-600">{state}</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
