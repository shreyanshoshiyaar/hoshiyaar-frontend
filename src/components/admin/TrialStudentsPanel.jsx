import React, { useEffect, useState } from 'react';
import paymentService from '../../services/paymentService.js';

// Payments & Pro → Free Trials: who started the free trial, who has finished it without Pro (ready for the
// ₹99 offer), and which automatic "trial is over" pushes each got (1 and 4 days after it ends).

const when = (d) => (d ? new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }) : '');
const ago = (d) => {
  if (!d) return '';
  const days = Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
  return days <= 0 ? 'today' : days === 1 ? '1 day ago' : `${days} days ago`;
};
const GROUPS = [
  { id: 'ended', label: 'Trial over, no Pro', hint: 'Ready for the ₹99 offer' },
  { id: 'running', label: 'Trial running' },
  { id: 'pro', label: 'Bought Pro' },
  { id: 'all', label: 'All' },
];

const Tile = ({ label, value, sub, active, onClick }) => (
  <button type="button" onClick={onClick} className={`text-left rounded-xl border px-3 py-2.5 cursor-pointer ${active ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 bg-white hover:bg-gray-50'}`}>
    <p className="text-[11px] font-black uppercase tracking-wider text-gray-500">{label}</p>
    <p className="text-2xl font-black text-gray-900 tabular-nums leading-tight">{value ?? '–'}</p>
    {sub && <p className="text-[11px] font-semibold text-gray-500">{sub}</p>}
  </button>
);

export default function TrialStudentsPanel() {
  const [state, setState] = useState('ended');
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    setError('');
    paymentService.getTrialStudents(state)
      .then(setData)
      .catch((e) => setError(e.response?.data?.message || 'Could not load free trial students'));
  }, [state]);

  const s = data?.summary;
  const list = data?.students || [];

  const exportCsv = () => {
    const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const lines = [['Name', 'Phone', 'Guest', 'Class', 'Trial started', 'Trial ended', 'Ended by', 'Lessons played', 'Last active', 'Can get push', 'Day-1 push', 'Day-4 push'].map(esc).join(',')];
    for (const r of list) {
      lines.push([r.name, r.phone || (r.typedPhone ? `${r.typedPhone} (not verified)` : ''), r.isGuest ? 'yes' : 'no', r.classLevel, when(r.trialStartedAt), when(r.endedAt),
        r.endReason === 'lessons' ? 'lesson limit' : r.endReason === 'time' ? 'time' : '', r.lessonsUsed, when(r.lastActiveAt), r.canGetPush ? 'yes' : 'no', when(r.pushes.day1), when(r.pushes.day4)].map(esc).join(','));
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' }));
    a.download = `free_trial_${state}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-black text-gray-900">Free trial students</h3>
        <p className="text-sm text-gray-500">
          Everyone who started the {s?.trialHours ?? 48}-hour / {s?.trialLessonLimit ?? 10}-lesson free trial. Students whose trial is over
          automatically get a push about the ₹99 offer 1 day and 4 days after it ends (5:30 pm), if notifications are on for them.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        <Tile label="Trial over, no Pro" value={s?.ended} sub={s ? `${s.endedByTime} by time · ${s.endedByLessons} by lessons` : ''} active={state === 'ended'} onClick={() => setState('ended')} />
        <Tile label="Trial running" value={s?.running} active={state === 'running'} onClick={() => setState('running')} />
        <Tile label="Bought Pro" value={s?.pro} sub={s?.started ? `${Math.round((s.pro / s.started) * 100)}% of trials` : ''} active={state === 'pro'} onClick={() => setState('pro')} />
        <Tile label="Started a trial" value={s?.started} active={state === 'all'} onClick={() => setState('all')} />
      </div>

      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-bold text-gray-700">{GROUPS.find((g) => g.id === state)?.label}: {list.length} students</p>
        <button type="button" onClick={exportCsv} disabled={!list.length} className="h-9 px-3 rounded-lg bg-gray-900 text-white text-sm font-bold disabled:opacity-40 cursor-pointer">⬇ CSV</button>
      </div>

      {error && <p className="text-sm text-rose-600">{error}</p>}
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-[11px] font-black uppercase tracking-wider text-gray-500">
            <tr>
              <th className="p-3">Student</th>
              <th className="p-3">Phone</th>
              <th className="p-3">Trial</th>
              <th className="p-3">Lessons</th>
              <th className="p-3">Last active</th>
              <th className="p-3">Offer pushes</th>
            </tr>
          </thead>
          <tbody>
            {list.map((r) => (
              <tr key={r._id} className="border-t border-gray-100 align-top">
                <td className="p-3">
                  <span className="font-bold text-gray-800">{r.name || '—'}</span>
                  {r.isGuest && <span className="ml-1.5 rounded-full bg-amber-100 text-amber-800 px-1.5 py-px text-[10px] font-black uppercase">Guest</span>}
                  {r.classLevel && <span className="block text-xs text-gray-500">Class {r.classLevel}</span>}
                </td>
                <td className="p-3 text-gray-600 tabular-nums text-xs">
                  {r.phone || (r.typedPhone ? <span>{r.typedPhone} <span className="text-gray-400">(not verified)</span></span> : '—')}
                </td>
                <td className="p-3 text-xs text-gray-600">
                  Started {when(r.trialStartedAt)}
                  {r.endedAt && <span className="block font-bold text-gray-800">Ended {ago(r.endedAt)}{r.endReason === 'lessons' ? ' (lesson limit)' : ''}</span>}
                  {r.group === 'running' && r.trialEndsAt && <span className="block font-bold text-green-700">Ends {when(r.trialEndsAt)}</span>}
                </td>
                <td className="p-3 tabular-nums text-gray-600">{r.lessonsUsed}</td>
                <td className="p-3 text-xs text-gray-600">{ago(r.lastActiveAt)}</td>
                <td className="p-3 text-xs">
                  {r.group !== 'ended' ? <span className="text-gray-400">—</span> : (
                    <>
                      {!r.canGetPush && <span className="block text-rose-600 font-bold">Notifications off</span>}
                      {r.pushes.day1 && <span className="block text-gray-700">Day 1: {when(r.pushes.day1)}</span>}
                      {r.pushes.day4 && <span className="block text-gray-700">Day 4: {when(r.pushes.day4)}</span>}
                      {r.canGetPush && !r.pushes.day1 && !r.pushes.day4 && <span className="text-gray-500">None yet</span>}
                    </>
                  )}
                </td>
              </tr>
            ))}
            {data && list.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-gray-500">No students here.</td></tr>}
            {!data && !error && <tr><td colSpan={6} className="p-6 text-center text-gray-500">Loading…</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
