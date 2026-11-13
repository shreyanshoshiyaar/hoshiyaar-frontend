import React, { useCallback, useEffect, useState } from 'react';
import paymentService from '../../services/paymentService.js';

const SOURCE_LABEL = {
  razorpay: 'Website (Razorpay)',
  google_play: 'Google Play',
  google_play_test: 'Play (test)',
  mock_sandbox: 'Test checkout',
  admin: 'Given by admin'
};
const STATUS_STYLE = {
  captured: 'bg-green-100 text-green-800',
  refunded: 'bg-slate-200 text-slate-700',
  failed: 'bg-red-100 text-red-800',
  created: 'bg-amber-100 text-amber-800'
};
const fmt = (d, withTime = false) => (d ? new Date(d).toLocaleString('en-IN', withTime
  ? { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }
  : { day: '2-digit', month: 'short', year: 'numeric' }) : '—');

// One learner's pass, free trial and payments, shown when their row is expanded in User Analytics
export default function UserPaymentsPanel({ userId }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');
  const [note, setNote] = useState({ ok: true, text: '' });
  const [grantDays, setGrantDays] = useState('180');

  const load = useCallback(() => paymentService.getUserPayments(userId), [userId]);

  useEffect(() => {
    let alive = true;
    setData(null);
    setError('');
    setNote({ ok: true, text: '' });
    load()
      .then((d) => { if (alive) setData(d); })
      .catch((e) => { if (alive) setError(e.response?.data?.message || 'Could not load payments'); });
    return () => { alive = false; };
  }, [load]);

  // Runs an admin action after a confirm, then reloads the panel
  const act = async (key, confirmText, fn, doneText) => {
    if (confirmText && !window.confirm(confirmText)) return;
    setBusy(key);
    setNote({ ok: true, text: '' });
    try {
      await fn();
      setData(await load());
      setNote({ ok: true, text: doneText });
    } catch (e) {
      setNote({ ok: false, text: e.response?.data?.message || 'That didn\'t work. Please try again.' });
    } finally {
      setBusy('');
    }
  };

  if (error) return <p className="text-xs font-semibold text-rose-600 mb-3">{error}</p>;
  if (!data) return <p className="text-xs font-semibold text-slate-400 mb-3">Loading payments…</p>;

  const { pass, trial, transactions, playPurchases = [], devices = [], maxDevices = 3 } = data;
  const days = Number(grantDays);
  const btn = 'rounded-lg px-2.5 py-1 text-[11px] font-black border disabled:opacity-50';
  const daysLeft = pass.active ? Math.ceil((new Date(pass.expiresAt) - Date.now()) / 86400000) : 0;

  return (
    <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-center gap-3 mb-3">
        <h4 className="text-sm font-black text-slate-800">💳 Payments</h4>
        {pass.active ? (
          <span className="rounded-full bg-amber-100 border border-amber-300 px-2.5 py-0.5 text-[11px] font-black text-amber-900">
            👑 Pro · {daysLeft} days left · till {fmt(pass.expiresAt)}{pass.source ? ` · ${SOURCE_LABEL[pass.source] || pass.source}` : ''}
          </span>
        ) : (
          <span className="rounded-full bg-slate-100 border border-slate-200 px-2.5 py-0.5 text-[11px] font-bold text-slate-600">
            Not Pro{pass.expiresAt ? ` · pass ended ${fmt(pass.expiresAt)}` : ''}
          </span>
        )}
        <span className="text-[11px] font-semibold text-slate-500">
          Free trial: {trial.startedAt ? `started ${fmt(trial.startedAt, true)} · ${trial.lessonsPlayed} lessons played` : 'not started'}
        </span>
      </div>

      {/* Admin: give or end Pro */}
      <div className="flex flex-wrap items-center gap-2 mb-3 rounded-xl bg-slate-50 border border-slate-100 p-2.5">
        <span className="text-[11px] font-black text-slate-600 uppercase tracking-wider">Pro</span>
        <input
          type="number"
          min="1"
          max="3650"
          value={grantDays}
          onChange={(e) => setGrantDays(e.target.value)}
          className="w-20 rounded-lg border border-slate-200 px-2 py-1 text-xs font-bold"
          aria-label="Days of Pro to give"
        />
        <span className="text-[11px] font-semibold text-slate-500">days</span>
        <button
          className={`${btn} bg-amber-50 border-amber-300 text-amber-900`}
          disabled={Boolean(busy) || !(days >= 1 && days <= 3650)}
          onClick={() => act('grant', `Give this student ${days} days of Pro${pass.active ? ' on top of their current pass' : ''}?`,
            () => paymentService.grantPro(userId, days), `Gave ${days} days of Pro.`)}
        >
          {busy === 'grant' ? 'Giving…' : 'Give Pro'}
        </button>
        {pass.active && (
          <button
            className={`${btn} bg-white border-rose-200 text-rose-700`}
            disabled={Boolean(busy)}
            onClick={() => act('end', 'End this student\'s Pro right now? (For a refunded purchase, use "Refunded: take back" below instead.)',
              () => paymentService.revokePro(userId, 'end_now'), 'Pro ended.')}
          >
            {busy === 'end' ? 'Ending…' : 'End Pro now'}
          </button>
        )}
      </div>
      {note.text && <p className={`mb-3 text-xs font-bold ${note.ok ? 'text-green-700' : 'text-rose-600'}`}>{note.text}</p>}

      {playPurchases.length > 0 && (
        <div className="mb-3">
          <p className="text-[11px] font-black text-slate-600 uppercase tracking-wider mb-1.5">Google Play purchases</p>
          <ul className="space-y-1.5">
            {playPurchases.map((p) => (
              <li key={p._id} className="flex flex-wrap items-center gap-2 text-xs">
                <span className="font-mono text-[11px] text-slate-600">{p.orderId || '(no order id)'}</span>
                <span className="text-slate-500">bought {fmt(p.purchaseTime)} · {p.grantedDays} days{p.isTestPurchase ? ' · test' : ''}</span>
                {p.status === 'revoked' ? (
                  <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-black uppercase text-slate-700">Refunded {fmt(p.revokedAt)}</span>
                ) : (
                  <button
                    className={`${btn} bg-white border-rose-200 text-rose-700`}
                    disabled={Boolean(busy)}
                    onClick={() => act(`gp-${p._id}`, `Was order ${p.orderId} refunded? This takes back the ${p.grantedDays} days it added.`,
                      () => paymentService.revokePro(userId, 'google_play', p._id), `Took back ${p.grantedDays} days for ${p.orderId}.`)}
                  >
                    {busy === `gp-${p._id}` ? 'Taking back…' : 'Refunded: take back'}
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {transactions.length === 0 ? (
        <p className="text-xs text-slate-400 italic">No payments yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-[10px] uppercase tracking-wider text-slate-500">
              <tr>
                <th className="py-1.5 pr-4">Date</th>
                <th className="py-1.5 pr-4">Amount</th>
                <th className="py-1.5 pr-4">Status</th>
                <th className="py-1.5 pr-4">Paid via</th>
                <th className="py-1.5 pr-4">Order / Payment ID</th>
                <th className="py-1.5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {transactions.map((t) => (
                <tr key={t._id}>
                  <td className="py-1.5 pr-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">{fmt(t.createdAt, true)}</td>
                  <td className="py-1.5 pr-4 font-bold text-slate-800">₹{t.amount}</td>
                  <td className="py-1.5 pr-4">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase ${STATUS_STYLE[t.status] || 'bg-slate-100 text-slate-600'}`}>
                      {t.status === 'captured' ? 'paid' : t.status === 'created' ? 'not paid' : t.status}
                    </span>
                  </td>
                  <td className="py-1.5 pr-4 font-semibold text-slate-700">{SOURCE_LABEL[t.experimentVariant] || 'Website (Razorpay)'}</td>
                  <td className="py-1.5 pr-4 font-mono text-[10px] text-slate-400 break-all">{t.orderId}{t.paymentId ? ` · ${t.paymentId}` : ''}</td>
                  <td className="py-1.5 whitespace-nowrap">
                    {t.status === 'captured' && (!t.experimentVariant || t.experimentVariant === 'razorpay') && (
                      <button
                        className={`${btn} bg-white border-rose-200 text-rose-700`}
                        disabled={Boolean(busy)}
                        onClick={() => act(`rz-${t._id}`, `Was this ₹${t.amount} website payment refunded in Razorpay? This takes back the Pro days it added.`,
                          () => paymentService.revokePro(userId, 'razorpay', t._id), 'Took back the Pro days for that payment.')}
                      >
                        {busy === `rz-${t._id}` ? 'Taking back…' : 'Refunded: take back'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Devices: the 3-device limit */}
      <div className="mt-4 pt-3 border-t border-slate-100">
        <div className="flex flex-wrap items-center gap-2 mb-1.5">
          <p className="text-[11px] font-black text-slate-600 uppercase tracking-wider">Signed in on {devices.length} of {maxDevices} devices</p>
          {devices.length > 0 && (
            <button
              className={`${btn} bg-white border-slate-300 text-slate-700`}
              disabled={Boolean(busy)}
              onClick={() => act('dev-all', 'Sign this student out of every device? Each one is logged out the next time it opens the app.',
                () => paymentService.signOutDevices(userId, { all: true }), 'Signed out of every device.')}
            >
              {busy === 'dev-all' ? 'Signing out…' : 'Sign out all'}
            </button>
          )}
        </div>
        {devices.length === 0 ? (
          <p className="text-xs text-slate-400 italic">No devices counted right now.</p>
        ) : (
          <ul className="space-y-1.5">
            {devices.map((d) => (
              <li key={d.id} className="flex flex-wrap items-center gap-2 text-xs">
                <span className="font-bold text-slate-700">{d.label}</span>
                <span className="text-slate-500">last used {fmt(d.lastSeenAt, true)}</span>
                <button
                  className={`${btn} bg-white border-slate-300 text-slate-700`}
                  disabled={Boolean(busy)}
                  onClick={() => act(`dev-${d.id}`, `Sign this student out of their ${d.label}?`,
                    () => paymentService.signOutDevices(userId, { deviceId: d.id }), `Signed out of ${d.label}.`)}
                >
                  {busy === `dev-${d.id}` ? 'Signing out…' : 'Sign out'}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
