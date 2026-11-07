import React, { useEffect, useState } from 'react';
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

  useEffect(() => {
    let alive = true;
    setData(null);
    setError('');
    paymentService.getUserPayments(userId)
      .then((d) => { if (alive) setData(d); })
      .catch((e) => { if (alive) setError(e.response?.data?.message || 'Could not load payments'); });
    return () => { alive = false; };
  }, [userId]);

  if (error) return <p className="text-xs font-semibold text-rose-600 mb-3">{error}</p>;
  if (!data) return <p className="text-xs font-semibold text-slate-400 mb-3">Loading payments…</p>;

  const { pass, trial, transactions } = data;
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
                <th className="py-1.5">Order / Payment ID</th>
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
                  <td className="py-1.5 font-mono text-[10px] text-slate-400 break-all">{t.orderId}{t.paymentId ? ` · ${t.paymentId}` : ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
