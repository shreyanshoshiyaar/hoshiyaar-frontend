import React, { useCallback, useEffect, useState } from 'react';
import paymentService from '../../services/paymentService.js';

const VIA_LABEL = { google_play: 'Google Play', google_play_test: 'Play (test)', razorpay: 'Website (Razorpay)' };
const NOTICED_LABEL = {
  google_notice: 'Google notice',
  daily_check: 'Daily check',
  razorpay_webhook: 'Razorpay webhook',
  admin: 'Admin',
  script: 'Script',
};
const fmt = (d) => (d ? new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—');

// Payments → Refunds: every refunded purchase, whether Pro was taken back, and a button that
// asks Google Play for refunds right now (the same check that runs every night)
export default function RefundsPanel() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);
  const [checkResult, setCheckResult] = useState('');
  const [onlyStillPro, setOnlyStillPro] = useState(false);

  const load = useCallback(() => {
    setError('');
    paymentService.getRefunds()
      .then(setData)
      .catch((e) => setError(e.response?.data?.message || 'Could not load refunds'));
  }, []);
  useEffect(() => { load(); }, [load]);

  const checkGoogle = async () => {
    setChecking(true);
    setCheckResult('');
    try {
      const r = await paymentService.checkGoogleRefunds();
      setCheckResult(r.revoked.length
        ? `Took Pro back for ${r.revoked.length} refunded purchase${r.revoked.length === 1 ? '' : 's'} (${r.revoked.map((x) => x.orderId).join(', ')}).`
        : `Checked ${r.checked} refund${r.checked === 1 ? '' : 's'} from the last 30 days: nothing new to take back.`);
      load();
    } catch (e) {
      setCheckResult(e.response?.data?.message || 'Could not reach Google Play');
    } finally {
      setChecking(false);
    }
  };

  const rows = (data?.refunds || []).filter((r) => !onlyStillPro || r.stillPro);
  const stillProCount = (data?.refunds || []).filter((r) => r.stillPro).length;

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gray-50 p-4 rounded-2xl border border-gray-200">
        <div>
          <p className="text-sm font-black text-gray-800">Refunds</p>
          <p className="text-xs font-semibold text-gray-500">
            Pro is taken back automatically when Google or Razorpay reports a refund, and a check runs every night at 3:30 AM for Google Play refunds that were missed.
          </p>
        </div>
        <button
          onClick={checkGoogle}
          disabled={checking || data?.googlePlayConfigured === false}
          className="shrink-0 rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
        >
          {checking ? 'Checking Google Play…' : 'Check Google Play now'}
        </button>
      </div>
      {data?.googlePlayConfigured === false && (
        <p className="text-xs font-bold text-amber-700">Google Play isn't set up on this server, so Play refunds can't be checked.</p>
      )}
      {checkResult && <p className="text-sm font-semibold text-gray-700 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2">{checkResult}</p>}
      {error && <p className="text-sm font-semibold text-rose-600">{error}</p>}

      {data && (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-bold text-gray-700">{data.refunds.length} refund{data.refunds.length === 1 ? '' : 's'}</span>
            {stillProCount > 0 && (
              <span className="rounded-full bg-amber-100 border border-amber-300 px-2.5 py-0.5 text-xs font-black text-amber-900">
                {stillProCount} still Pro
              </span>
            )}
            <label className="flex items-center gap-2 text-xs font-bold text-gray-600 cursor-pointer">
              <input type="checkbox" checked={onlyStillPro} onChange={(e) => setOnlyStillPro(e.target.checked)} />
              Only show accounts still Pro
            </label>
          </div>
          <p className="text-[11px] font-semibold text-gray-500">
            &ldquo;Still Pro&rdquo; can be correct (the account has another purchase or an admin pass). Open the student in User Analytics to check, and take Pro back there if needed.
          </p>

          {rows.length === 0 ? (
            <p className="text-sm text-gray-400 italic">No refunds{onlyStillPro ? ' where the account is still Pro' : ''}.</p>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 text-[10px] uppercase tracking-wider text-gray-500">
                  <tr>
                    <th className="p-3">Student</th>
                    <th className="p-3">Paid via</th>
                    <th className="p-3">Order</th>
                    <th className="p-3">Bought</th>
                    <th className="p-3">Refunded</th>
                    <th className="p-3">Noticed by</th>
                    <th className="p-3">Pro now</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {rows.map((r, i) => (
                    <tr key={`${r.orderId}-${i}`} className={r.stillPro ? 'bg-amber-50/60' : ''}>
                      <td className="p-3">
                        <span className="block font-bold text-gray-800">{r.user.name || '—'}</span>
                        <span className="block font-mono text-[10px] text-gray-500">{r.user.phone}</span>
                      </td>
                      <td className="p-3 font-semibold text-gray-700 whitespace-nowrap">{VIA_LABEL[r.via] || r.via}{r.amount ? ` · ₹${r.amount}` : ''}</td>
                      <td className="p-3 font-mono text-[10px] text-gray-500 break-all">{r.orderId}</td>
                      <td className="p-3 text-gray-600 whitespace-nowrap">{fmt(r.boughtAt)}</td>
                      <td className="p-3 text-gray-600 whitespace-nowrap">{fmt(r.refundedAt)}{r.reason ? <span className="block text-[10px] text-gray-400">{r.reason}</span> : null}</td>
                      <td className="p-3 font-semibold text-gray-700 whitespace-nowrap">{NOTICED_LABEL[r.noticedBy] || r.noticedBy}</td>
                      <td className="p-3 whitespace-nowrap">
                        {r.stillPro ? (
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-black uppercase text-amber-900">Still Pro · till {new Date(r.passEndsAt).toLocaleDateString('en-IN')}</span>
                        ) : (
                          <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-black uppercase text-green-800">Removed</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
      {!data && !error && <p className="text-sm text-gray-400">Loading refunds…</p>}
    </div>
  );
}
