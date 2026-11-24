import React, { useCallback, useEffect, useState } from 'react';
import http from '../../services/apiClient.js';

// Admin → WhatsApp Campaigns: each template send with its totals, Meta's analytics (delivered, read,
// Play Now clicks) and, per campaign, every student's message status.

const fmt = (n) => (n == null ? '–' : Number(n).toLocaleString('en-IN'));
const pct = (a, b) => (b > 0 && a != null ? `${Math.round((a / b) * 100)}%` : '–');
const when = (d) => (d ? new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }) : '');

const QUALITY = {
  GREEN: { label: 'Green: healthy', cls: 'bg-green-100 text-green-800 border-green-200' },
  YELLOW: { label: 'Yellow: people are blocking or reporting. Pause marketing', cls: 'bg-amber-100 text-amber-900 border-amber-200' },
  RED: { label: 'Red: high block / report rate. Stop marketing messages', cls: 'bg-rose-100 text-rose-800 border-rose-200' },
};
const STATUS = {
  read: { label: 'Read', cls: 'bg-blue-100 text-blue-800' },
  delivered: { label: 'Delivered', cls: 'bg-green-100 text-green-800' },
  sent: { label: 'Sent', cls: 'bg-slate-100 text-slate-700' },
  accepted: { label: 'Accepted', cls: 'bg-slate-100 text-slate-600' },
  failed: { label: 'Failed', cls: 'bg-rose-100 text-rose-700' },
  skipped: { label: 'Skipped', cls: 'bg-amber-100 text-amber-800' },
};
const FILTERS = [
  { id: '', label: 'All' },
  { id: 'read', label: 'Read' },
  { id: 'delivered', label: 'Delivered' },
  { id: 'not_delivered', label: 'Not delivered yet' },
  { id: 'failed', label: 'Failed' },
];

const Tile = ({ label, value, sub, tone = 'slate' }) => (
  <div className={`rounded-xl border px-3 py-2.5 bg-white ${tone === 'green' ? 'border-green-200' : tone === 'blue' ? 'border-blue-200' : tone === 'amber' ? 'border-amber-200' : tone === 'rose' ? 'border-rose-200' : 'border-gray-200'}`}>
    <p className="text-[11px] font-black uppercase tracking-wider text-gray-500">{label}</p>
    <p className="text-2xl font-black text-gray-900 tabular-nums leading-tight">{value}</p>
    {sub && <p className="text-[11px] font-semibold text-gray-500">{sub}</p>}
  </div>
);

function CampaignDetail({ campaign, onBack }) {
  const [filter, setFilter] = useState('');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState(false);

  const load = useCallback(() => {
    setError('');
    http.get(`/api/admin/whatsapp/campaigns/${campaign._id}/messages`, { params: { status: filter, q, page, limit: 50 } })
      .then((r) => setData(r.data))
      .catch((e) => setError(e.response?.data?.message || 'Could not load the students'));
  }, [campaign._id, filter, q, page]);
  useEffect(() => { load(); }, [load]);

  const exportCsv = async () => {
    setExporting(true);
    try {
      const r = await http.get(`/api/admin/whatsapp/campaigns/${campaign._id}/messages`, { params: { status: filter, q, limit: 'all' } });
      const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
      const lines = [['Name', 'Phone', 'Class', 'Points', 'Status', 'Delivered at', 'Read at', 'Error'].map(esc).join(',')];
      for (const m of r.data.messages) {
        lines.push([m.name, m.phone, m.classLevel, m.points, STATUS[m.status]?.label || m.status, when(m.deliveredAt), when(m.readAt), m.errorText].map(esc).join(','));
      }
      const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `${campaign.templateName}_${filter || 'all'}.csv`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch (_) {
      setError('Could not export');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div>
      <button type="button" onClick={onBack} className="mb-3 text-sm font-bold text-indigo-700 hover:underline cursor-pointer">← All campaigns</button>
      <h3 className="text-xl font-black text-gray-900">{campaign.name}</h3>
      <p className="text-sm text-gray-500 mb-4">{campaign.audience} · sent {when(campaign.sentAt)}</p>

      <div className="flex flex-wrap items-center gap-2 mb-3">
        {FILTERS.map((f) => (
          <button
            key={f.id || 'all'}
            type="button"
            onClick={() => { setFilter(f.id); setPage(1); }}
            className={`px-3 py-1.5 rounded-full text-sm font-bold border cursor-pointer ${filter === f.id ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
          >
            {f.label}
          </button>
        ))}
        <input
          value={q}
          onChange={(e) => { setQ(e.target.value); setPage(1); }}
          placeholder="Search name or phone"
          className="ml-auto h-9 px-3 rounded-lg border border-gray-300 text-sm w-56"
        />
        <button type="button" onClick={exportCsv} disabled={exporting} className="h-9 px-3 rounded-lg bg-gray-900 text-white text-sm font-bold disabled:opacity-50 cursor-pointer">
          {exporting ? 'Exporting…' : '⬇ CSV'}
        </button>
      </div>

      {error && <p className="text-sm text-rose-600 mb-2">{error}</p>}
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-[11px] font-black uppercase tracking-wider text-gray-500">
            <tr>
              <th className="p-3">Student</th><th className="p-3">Phone</th><th className="p-3">Class</th><th className="p-3">Points</th>
              <th className="p-3">Status</th><th className="p-3">Delivered</th><th className="p-3">Read</th>
            </tr>
          </thead>
          <tbody>
            {(data?.messages || []).map((m) => (
              <tr key={m._id} className="border-t border-gray-100">
                <td className="p-3 font-bold text-gray-800">{m.name}</td>
                <td className="p-3 tabular-nums text-gray-600">+{m.phone}</td>
                <td className="p-3 text-gray-600">{m.classLevel}</td>
                <td className="p-3 tabular-nums text-gray-600">{fmt(m.points)}</td>
                <td className="p-3">
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-black ${STATUS[m.status]?.cls || ''}`}>{STATUS[m.status]?.label || m.status}</span>
                  {m.errorText && <span className="block text-[11px] text-rose-600 mt-0.5">{m.errorText}</span>}
                </td>
                <td className="p-3 text-gray-500 text-xs">{when(m.deliveredAt)}</td>
                <td className="p-3 text-gray-500 text-xs">{when(m.readAt)}</td>
              </tr>
            ))}
            {data && data.messages.length === 0 && (
              <tr><td colSpan={7} className="p-6 text-center text-gray-500">No students here.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      {data && data.pages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-3 text-sm">
          <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="px-3 py-1.5 rounded-lg border border-gray-300 disabled:opacity-40 cursor-pointer">← Prev</button>
          <span className="text-gray-600">Page {page} of {data.pages} · {fmt(data.total)} students</span>
          <button type="button" disabled={page >= data.pages} onClick={() => setPage((p) => p + 1)} className="px-3 py-1.5 rounded-lg border border-gray-300 disabled:opacity-40 cursor-pointer">Next →</button>
        </div>
      )}
    </div>
  );
}

export default function WhatsappCampaigns() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(null);

  const load = () => {
    setError('');
    http.get('/api/admin/whatsapp/campaigns')
      .then((r) => setData(r.data))
      .catch((e) => setError(e.response?.data?.message || 'Could not load WhatsApp campaigns'));
  };
  useEffect(load, []);

  if (open) return <CampaignDetail campaign={open} onBack={() => { setOpen(null); load(); }} />;

  const q = data?.number?.quality && QUALITY[data.number.quality];
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-2xl font-black text-gray-900">WhatsApp Campaigns</h2>
          <p className="text-sm text-gray-500">Template messages sent to students, and how they did.</p>
        </div>
        <button type="button" onClick={load} className="px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm font-bold cursor-pointer">↻ Refresh</button>
      </div>

      {data?.number && !data.number.error && (
        <div className={`mb-5 rounded-xl border px-4 py-3 text-sm font-bold ${q?.cls || 'bg-gray-50 border-gray-200 text-gray-700'}`}>
          Sending number {data.number.number} ({data.number.name}) · quality: {q?.label || data.number.quality || 'unknown'}
          {data.number.canSend && data.number.canSend !== 'AVAILABLE' && <span> · cannot send right now ({data.number.canSend})</span>}
        </div>
      )}

      {error && <p className="text-sm text-rose-600 mb-3">{error}</p>}
      {!data && !error && <p className="text-sm text-gray-500">Loading…</p>}
      {data && data.campaigns.length === 0 && <p className="text-sm text-gray-500">No campaigns yet.</p>}

      <div className="space-y-4">
        {(data?.campaigns || []).map((c) => {
          const t = c.totals;
          return (
            <div key={c._id} className="rounded-2xl border border-gray-200 bg-gray-50/60 p-4">
              <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                <div>
                  <h3 className="text-lg font-black text-gray-900">{c.name}</h3>
                  <p className="text-xs text-gray-500">
                    {c.audience} · sent {when(c.sentAt)} · template <code>{c.templateName}</code>
                  </p>
                </div>
                <button type="button" onClick={() => setOpen(c)} className="px-3 py-2 rounded-lg bg-indigo-600 text-white text-sm font-bold cursor-pointer">
                  See students →
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                <Tile label="Students" value={fmt(t.total)} />
                <Tile label="Accepted" value={fmt(t.accepted)} sub={pct(t.accepted, t.total)} />
                <Tile label="Delivered" value={fmt(t.delivered)} sub={`${pct(t.delivered, t.accepted)} of accepted`} tone="green" />
                <Tile label="Read" value={fmt(t.read)} sub={`${pct(t.read, t.delivered)} of delivered`} tone="blue" />
                <Tile label="Play Now clicks" value={t.clicks == null ? '–' : `${t.clicksApprox ? '≈ ' : ''}${fmt(t.clicks)}`} sub={t.clicks == null ? 'from Meta' : `${pct(t.clicks, t.delivered)} of delivered`} tone="amber" />
                <Tile label="Not delivered" value={fmt(t.notDelivered)} sub={t.failed ? `${fmt(t.failed)} refused by Meta` : 'not reached yet'} tone="rose" />
              </div>
              <p className="mt-2 text-[11px] text-gray-500 leading-snug">
                Delivered and read: each student's status as WhatsApp reports it, plus Meta's count for this campaign's days.
                Many people turn off read receipts, so "read" is lower than the real number.
                {t.clicksApprox ? ' Clicks (≈): Meta counts them per template and per day only; this campaign gets the clicks from its own days, until the next send of the same message.' : ' Clicks come from Meta and update every few hours.'}
                {' '}"Not delivered" includes messages Meta held back (its limit on marketing messages per person) and ones still on the way.
                {c.meta?.error ? ` Meta analytics: ${c.meta.error}.` : ''}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
