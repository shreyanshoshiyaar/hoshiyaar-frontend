import React, { useEffect, useState } from 'react';
import http from '../../services/apiClient.js';

// Admin → Cloudinary Usage: each Cloudinary account's credits this month (the free plan allows 25), with
// storage, downloads (bandwidth) and file count. 1 credit = 1 GB stored, or 1 GB downloaded, or 1,000 edits.

const gb = (b) => `${(Number(b || 0) / 1e9).toFixed(2)} GB`;
const tone = (p) => (p == null ? 'bg-gray-300' : p >= 85 ? 'bg-rose-500' : p >= 60 ? 'bg-amber-500' : 'bg-green-500');

export default function CloudinaryUsage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const load = (refresh = false) => {
    setLoading(true);
    setError('');
    http.get('/api/admin/cloudinary-usage', { params: refresh ? { refresh: 1 } : {} })
      .then((r) => setData(r.data))
      .catch((e) => setError(e.response?.data?.message || 'Could not load Cloudinary usage'))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  // Accounts Cloudinary has disabled get no card; they are named in one line at the bottom
  const all = data?.accounts || [];
  const disabled = all.filter((a) => a.error === 'disabled customer');
  const accounts = all.filter((a) => a.error !== 'disabled customer');
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-2xl font-black text-gray-900">Cloudinary Usage</h2>
          <p className="text-sm text-gray-500">
            Pictures and media are stored on Cloudinary. Each free account gets 25 credits a month:
            1 credit = 1 GB stored, or 1 GB downloaded, or 1,000 image edits. Cloudinary updates the numbers about once a day.
          </p>
        </div>
        <button type="button" onClick={() => load(true)} disabled={loading} className="px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm font-bold cursor-pointer disabled:opacity-50">
          {loading ? 'Checking…' : '↻ Refresh'}
        </button>
      </div>

      {error && <p className="text-sm text-rose-600 mb-3">{error}</p>}
      {!data && !error && <p className="text-sm text-gray-500">Loading…</p>}
      {data && accounts.length === 0 && <p className="text-sm text-gray-500">No Cloudinary accounts are set up on the server.</p>}

      <div className="grid gap-3 md:grid-cols-2">
        {accounts.map((a) => {
          const p = a.credits?.percent;
          return (
            <div key={a.cloudName} className={`rounded-2xl border p-4 bg-white ${a.error ? 'border-rose-200' : 'border-gray-200'}`}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-lg font-black text-gray-900"><code>{a.cloudName}</code></p>
                  <p className="text-xs text-gray-500">
                    {a.plan ? `${a.plan} plan` : ''}{a.serverUploads ? ' · used for uploads from the admin panel' : ''}
                  </p>
                </div>
                {!a.error && p != null && (
                  <span className={`rounded-full px-2 py-0.5 text-xs font-black text-white ${tone(p)}`}>{Math.round(p)}% used</span>
                )}
              </div>

              {a.error ? (
                <p className="mt-3 text-sm font-bold text-rose-600">
                  {a.error === 'disabled customer' ? 'This account has been disabled by Cloudinary. Its pictures no longer load.' : a.error}
                </p>
              ) : (
                <>
                  <div className="mt-3">
                    <div className="flex justify-between text-xs font-bold text-gray-600 mb-1">
                      <span>Credits this month</span>
                      <span className="tabular-nums">{a.credits?.used ?? '–'} / {a.credits?.limit ?? '–'}</span>
                    </div>
                    <div className="h-2.5 rounded-full bg-gray-100 overflow-hidden">
                      <div className={`h-full ${tone(p)}`} style={{ width: `${Math.min(100, p || 0)}%` }} />
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-lg bg-gray-50 py-2">
                      <p className="text-[10px] font-black uppercase tracking-wider text-gray-500">Stored</p>
                      <p className="text-sm font-black text-gray-900 tabular-nums">{gb(a.storageBytes)}</p>
                    </div>
                    <div className="rounded-lg bg-gray-50 py-2">
                      <p className="text-[10px] font-black uppercase tracking-wider text-gray-500">Downloaded</p>
                      <p className="text-sm font-black text-gray-900 tabular-nums">{gb(a.bandwidthBytes)}</p>
                    </div>
                    <div className="rounded-lg bg-gray-50 py-2">
                      <p className="text-[10px] font-black uppercase tracking-wider text-gray-500">Files</p>
                      <p className="text-sm font-black text-gray-900 tabular-nums">{Number(a.files || 0).toLocaleString('en-IN')}</p>
                    </div>
                  </div>
                  {a.lastUpdated && <p className="mt-2 text-[11px] text-gray-400">Cloudinary's figures as of {a.lastUpdated}</p>}
                </>
              )}
            </div>
          );
        })}
      </div>
      {disabled.length > 0 && (
        <p className="mt-3 text-[11px] text-gray-400">
          Not shown (disabled by Cloudinary, not used by the app): {disabled.map((a) => a.cloudName).join(', ')}
        </p>
      )}
      {data?.checkedAt && <p className="mt-1 text-[11px] text-gray-400">Checked {new Date(data.checkedAt).toLocaleString('en-IN')}</p>}
    </div>
  );
}
