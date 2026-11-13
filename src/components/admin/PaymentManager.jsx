import React, { useState, useEffect } from 'react';
import paymentService from '../../services/paymentService.js';
import SimpleLoading from '../ui/SimpleLoading.jsx';
import RefundsPanel from './RefundsPanel.jsx';

// Where a payment came from (PaymentTransaction.experimentVariant)
const SOURCE_LABEL = {
  razorpay: 'Website (Razorpay)',
  google_play: 'Google Play',
  google_play_test: 'Play (test)',
  mock_sandbox: 'Test checkout'
};
const SUB_TABS = ['rules', 'transactions', 'refunds'];

export default function PaymentManager({ subTab = '', onSubTab }) {
  const activeTab = SUB_TABS.includes(subTab) ? subTab : 'rules';
  const setActiveTab = (tab) => (onSubTab ? onSubTab(tab) : null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Settings State
  const [config, setConfig] = useState(null);
  const [analytics, setAnalytics] = useState(null);

  // Transactions State
  const [transactions, setTransactions] = useState([]);
  const [txLoading, setTxLoading] = useState(false);
  const [txSearch, setTxSearch] = useState('');
  const [txStatus, setTxStatus] = useState('all');
  const [txSource, setTxSource] = useState('all');
  const [txPage, setTxPage] = useState(1);
  const [txTotalPages, setTxTotalPages] = useState(1);

  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    if (activeTab === 'transactions') {
      loadTransactions();
    }
  }, [activeTab, txPage, txStatus, txSource]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await paymentService.getAdminSettings();
      const pass = data.plans?.find(p => p.code === 'pass_6m');
      setConfig({
        ...data.config,
        trialHours: data.config?.trialHours ?? 48,
        trialLessonLimit: data.config?.trialLessonLimit ?? 7,
        guestLessonLimit: data.config?.guestLessonLimit ?? 5,
        passPrice: data.config?.passPrice ?? pass?.amount ?? 99,
        passOriginalPrice: data.config?.passOriginalPrice ?? pass?.discountedFrom ?? 599,
        passDays: data.config?.passDays ?? pass?.durationDays ?? 180,
      });
      setAnalytics(data.analytics);
    } catch (err) {
      console.error('Error loading payment settings:', err);
      setMessage({ type: 'error', text: 'Failed to load payment settings' });
    } finally {
      setLoading(false);
    }
  };

  const loadTransactions = async () => {
    try {
      setTxLoading(true);
      const data = await paymentService.getAdminTransactions({
        page: txPage,
        limit: 20,
        search: txSearch,
        status: txStatus,
        source: txSource
      });
      setTransactions(data.transactions || []);
      setTxTotalPages(data.totalPages || 1);
    } catch (err) {
      console.error('Error loading transactions:', err);
    } finally {
      setTxLoading(false);
    }
  };

  const handleSaveConfig = async () => {
    try {
      setSaving(true);
      setMessage({ type: '', text: '' });
      const payload = {
        ...config,
        trialHours: Number(config.trialHours),
        trialLessonLimit: Number(config.trialLessonLimit),
        guestLessonLimit: Number(config.guestLessonLimit),
        passPrice: Number(config.passPrice),
        passOriginalPrice: Number(config.passOriginalPrice),
        passDays: Number(config.passDays)
      };
      const res = await paymentService.updateAdminSettings(payload);
      
      const updatedConfig = {
        ...config,
        ...(res?.config || {}),
        trialHours: res?.config?.trialHours ?? payload.trialHours,
        passPrice: res?.config?.passPrice ?? payload.passPrice,
        passOriginalPrice: res?.config?.passOriginalPrice ?? payload.passOriginalPrice,
        passDays: res?.config?.passDays ?? payload.passDays,
        guestLessonLimit: res?.config?.guestLessonLimit ?? payload.guestLessonLimit,
        trialLessonLimit: res?.config?.trialLessonLimit ?? payload.trialLessonLimit,
      };
      setConfig(updatedConfig);

      setMessage({
        type: 'success',
        text: `Settings saved successfully! Pro Pass is now ₹${updatedConfig.passPrice} and Free Trial is ${updatedConfig.trialHours}h.`
      });
      setTimeout(() => setMessage({ type: '', text: '' }), 6000);
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to save settings' });
    } finally {
      setSaving(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      await paymentService.downloadTransactionsCSV();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.status === 401 ? 'Your login has expired. Please log in again.' : 'Could not download the CSV' });
    }
  };

  if (loading) {
    return <SimpleLoading message="Loading Payment & Subscription Control Center..." />;
  }

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 md:p-8 font-sans">
      {/* Title & Overview */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-gray-100 mb-6">
        <div>
          <div className="flex items-center gap-3">
            <span className="text-2xl">💳</span>
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">
              Payments &amp; Pro Pass
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Free trial rules, the Pro pass price, and every payment from the website (Razorpay) and the app (Google Play).
          </p>
        </div>

        {/* Rollout & Paywall Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-indigo-50/70 p-2 rounded-2xl border border-indigo-200">
            <span className="text-xs font-bold text-indigo-900">Rollout Mode:</span>
            <select
              value={config?.subscriptionMode || 'admin_only'}
              onChange={async (e) => {
                const newMode = e.target.value;
                const updated = { ...config, subscriptionMode: newMode };
                setConfig(updated);
                try {
                  setSaving(true);
                  await paymentService.updateAdminSettings(updated);
                  setMessage({ type: 'success', text: `Rollout mode updated to: ${newMode === 'admin_only' ? 'Admin Only (Testing)' : newMode === 'live' ? 'Live for All Students' : 'Disabled'}` });
                  setTimeout(() => setMessage({ type: '', text: '' }), 4000);
                } catch (err) {
                  setMessage({ type: 'error', text: 'Failed to update rollout mode' });
                } finally {
                  setSaving(false);
                }
              }}
              className="bg-white px-2.5 py-1 rounded-xl text-xs font-black border border-indigo-200 text-indigo-950 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="admin_only">🛡️ Admin Only (Testing)</option>
              <option value="live">🌍 Live for All Students</option>
              <option value="disabled">🚫 Completely Disabled</option>
            </select>
          </div>

          {/* Master Paywall Status Pill */}
          <div className="flex items-center gap-3 bg-gray-50 p-2.5 rounded-2xl border border-gray-200">
            <span className="text-xs font-bold text-gray-600">Master Paywall:</span>
            <button
              onClick={async () => {
                const updated = { ...config, paywallEnabled: !config.paywallEnabled };
                setConfig(updated);
                try {
                  setSaving(true);
                  await paymentService.updateAdminSettings(updated);
                  setMessage({ type: 'success', text: `Master Paywall is now ${updated.paywallEnabled ? 'ACTIVE (LOCKED)' : 'OFF (FREE FOR ALL)'}` });
                  setTimeout(() => setMessage({ type: '', text: '' }), 4000);
                } catch (err) {
                  setMessage({ type: 'error', text: 'Failed to update master paywall' });
                } finally {
                  setSaving(false);
                }
              }}
              className={`px-3 py-1 rounded-xl text-xs font-black transition-all ${
                config?.paywallEnabled
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'bg-green-600 text-white shadow-sm'
              }`}
            >
              {config?.paywallEnabled ? 'ACTIVE (LOCKED)' : 'OFF (FREE FOR ALL)'}
            </button>
          </div>
        </div>
      </div>

      {/* Summary: one pass, paid on the website or in the app (test payments left out) */}
      {analytics && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-blue-50/70 border border-blue-100 rounded-2xl p-4">
            <div className="text-xs font-bold text-blue-600 uppercase tracking-wider">Revenue</div>
            <div className="text-2xl font-black text-blue-950 mt-1">₹{analytics.realRevenueRupees ?? analytics.totalRevenueRupees}</div>
            <div className="text-[11px] text-blue-500 mt-0.5">{analytics.paidThisMonth ?? 0} paid this month</div>
          </div>

          <div className="bg-amber-50/70 border border-amber-100 rounded-2xl p-4">
            <div className="text-xs font-bold text-amber-700 uppercase tracking-wider">👑 Pro users</div>
            <div className="text-2xl font-black text-amber-950 mt-1">{analytics.activeSubscribersCount}</div>
            <div className="text-[11px] text-amber-600 mt-0.5">With an active pass</div>
          </div>

          <div className="bg-emerald-50/70 border border-emerald-100 rounded-2xl p-4">
            <div className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Paid via</div>
            <div className="text-sm font-black text-emerald-950 mt-1.5">Website: {analytics.web?.count ?? 0} · ₹{analytics.web?.total ?? 0}</div>
            <div className="text-sm font-black text-emerald-950">Google Play: {analytics.googlePlay?.count ?? 0} · ₹{analytics.googlePlay?.total ?? 0}</div>
          </div>

          <div className="bg-rose-50/70 border border-rose-100 rounded-2xl p-4">
            <div className="text-xs font-bold text-rose-600 uppercase tracking-wider">Refunds</div>
            <div className="text-2xl font-black text-rose-950 mt-1">{analytics.refundsCount ?? 0}</div>
            <div className="text-[11px] text-rose-500 mt-0.5">Pass removed on refund</div>
          </div>
        </div>
      )}

      {/* Notifications */}
      {message.text && (
        <div
          className={`mb-6 p-4 rounded-2xl text-xs sm:text-sm font-semibold flex items-center justify-between animate-fade-in ${
            message.type === 'success'
              ? 'bg-green-50 border border-green-200 text-green-800'
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}
        >
          <span>{message.text}</span>
          <button onClick={() => setMessage({ type: '', text: '' })} className="font-bold">✕</button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex border-b border-gray-200 mb-6 gap-2 sm:gap-4 overflow-x-auto no-scrollbar">
        {[
          { id: 'rules', label: '⚙️ Trial & Price' },
          { id: 'transactions', label: '📊 Payments Log' },
          { id: 'refunds', label: '↩️ Refunds' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`pb-3 px-3 sm:px-4 font-bold text-sm whitespace-nowrap transition-colors relative ${
              activeTab === tab.id
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: BILLING RULES ENGINE */}
      {activeTab === 'rules' && config && (
        <div className="space-y-8 animate-fade-in">
          {/* Live Free Trial & Pricing Configuration */}
          <div className="bg-white p-6 rounded-3xl border border-indigo-200 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl">⚡</span>
                  <h3 className="font-black text-gray-900 text-lg">Free Trial &amp; Pro Plan Settings</h3>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Changes made here update instantly on all users' mobile apps and web screens without needing an app release.
                </p>
              </div>
              <span className="self-start sm:self-auto px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                Live Instant Sync
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {/* 1. Trial Hours */}
              <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100">
                <label className="block text-xs font-black text-indigo-900 uppercase tracking-wider mb-1">
                  Free Trial Time (Hours)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="720"
                    value={config.trialHours ?? 48}
                    onChange={(e) => setConfig({ ...config, trialHours: e.target.value })}
                    className="w-full h-11 px-3.5 rounded-xl border border-indigo-200 bg-white font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <span className="text-xs font-black text-indigo-600 shrink-0">Hours</span>
                </div>
                <p className="text-[11px] text-gray-500 mt-1.5 leading-snug">
                  Starts on the user's first level played. Default: 48h.
                </p>
              </div>

              {/* 2. Pro Pass Price */}
              <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-100">
                <label className="block text-xs font-black text-amber-900 uppercase tracking-wider mb-1">
                  Pro Pass Price (₹)
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-black text-amber-700 shrink-0">₹</span>
                  <input
                    type="number"
                    min="1"
                    max="10000"
                    value={config.passPrice ?? 99}
                    onChange={(e) => setConfig({ ...config, passPrice: e.target.value })}
                    className="w-full h-11 px-3.5 rounded-xl border border-amber-200 bg-white font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <p className="text-[11px] text-gray-500 mt-1.5 leading-snug">
                  Charged for Pro pass on web &amp; app. Default: ₹99.
                </p>
              </div>

              {/* 3. Original / Strikethrough Price */}
              <div className="p-4 rounded-2xl bg-rose-50/60 border border-rose-100">
                <label className="block text-xs font-black text-rose-900 uppercase tracking-wider mb-1">
                  Original Strikethrough (₹)
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-black text-rose-700 shrink-0">₹</span>
                  <input
                    type="number"
                    min="1"
                    max="10000"
                    value={config.passOriginalPrice ?? 599}
                    onChange={(e) => setConfig({ ...config, passOriginalPrice: e.target.value })}
                    className="w-full h-11 px-3.5 rounded-xl border border-rose-200 bg-white font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
                <p className="text-[11px] text-gray-500 mt-1.5 leading-snug">
                  Shown strikethrough next to live price. Default: ₹599.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 pt-2">
              {/* 4. Guest Lesson Limit */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
                  Guest Lesson Limit
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={config.guestLessonLimit ?? 5}
                  onChange={(e) => setConfig({ ...config, guestLessonLimit: e.target.value })}
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-300 bg-white font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-[11px] text-gray-500 mt-1.5 leading-snug">
                  Lessons allowed for guest before account prompt. Default: 5.
                </p>
              </div>

              {/* 5. Registered Student Trial Limit */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
                  Total Trial Lesson Limit
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={config.trialLessonLimit ?? 7}
                  onChange={(e) => setConfig({ ...config, trialLessonLimit: e.target.value })}
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-300 bg-white font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-[11px] text-gray-500 mt-1.5 leading-snug">
                  Max lessons playable during free trial. Default: 7.
                </p>
              </div>

              {/* 6. Pass Duration Days */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
                  Pass Validity (Days)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="730"
                    value={config.passDays ?? 180}
                    onChange={(e) => setConfig({ ...config, passDays: e.target.value })}
                    className="w-full h-11 px-3.5 rounded-xl border border-slate-300 bg-white font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-xs font-black text-slate-600 shrink-0">Days</span>
                </div>
                <p className="text-[11px] text-gray-500 mt-1.5 leading-snug">
                  Validity granted by one pass. Default: 180 days (6 months).
                </p>
              </div>
            </div>

            {/* Direct Save Button inside card */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-100 flex-wrap gap-3">
              <p className="text-xs text-gray-500 font-semibold">
                ⚡ Updates trial time and pricing live for all users instantly without app release.
              </p>
              <button
                type="button"
                disabled={saving}
                onClick={handleSaveConfig}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm rounded-2xl shadow-lg shadow-indigo-100 transition-all active:scale-95 disabled:opacity-50 cursor-pointer flex items-center gap-2"
              >
                <span>{saving ? 'Saving...' : '💾 Save Free Trial & Price Settings'}</span>
              </button>
            </div>
          </div>

          {/* Rollout: older Android builds can't run the trial, so they stay open until switched on */}
          <div className="bg-amber-50/80 p-6 rounded-3xl border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex-1">
              <h3 className="font-black text-gray-900 text-base mb-1">📱 Enforce on older app versions</h3>
              <p className="text-xs text-gray-600 leading-relaxed max-w-2xl">
                The website and the updated Android app always follow the trial. Older Android builds don't know about it,
                so while this is <strong>off</strong> they keep full access. Turn it on only after the updated app is on
                Play Store and the minimum app version forces everyone to update.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setConfig({ ...config, enforceLegacyClients: !config.enforceLegacyClients })}
              className={`shrink-0 px-4 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer shadow-sm active:scale-95 ${
                config.enforceLegacyClients ? 'bg-amber-600 hover:bg-amber-700 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
              }`}
            >
              {config.enforceLegacyClients ? 'ON (all app versions)' : 'OFF (website + new app only)'}
            </button>
          </div>

          <div className="flex justify-end pt-4">
            <button
              disabled={saving}
              onClick={handleSaveConfig}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-2xl shadow-md transition-transform active:scale-95 disabled:opacity-50"
            >
              {saving ? 'Saving...' : '💾 Save Billing Rules'}
            </button>
          </div>
        </div>
      )}

      {/* TAB 4: TRANSACTIONS & AUDIT LOG */}
      {activeTab === 'transactions' && (
        <div className="space-y-6 animate-fade-in">
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gray-50 p-4 rounded-2xl border border-gray-200">
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                placeholder="Search phone, student, order ID..."
                value={txSearch}
                onChange={(e) => setTxSearch(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { setTxPage(1); loadTransactions(); } }}
                className="px-3 py-2 rounded-xl border border-gray-300 text-xs bg-white min-w-[220px]"
              />

              <select
                value={txStatus}
                onChange={(e) => setTxStatus(e.target.value)}
                className="px-3 py-2 rounded-xl border border-gray-300 text-xs bg-white font-semibold"
              >
                <option value="all">All Statuses</option>
                <option value="captured">Paid</option>
                <option value="created">Started, not paid</option>
                <option value="failed">Failed</option>
                <option value="refunded">Refunded</option>
              </select>

              <select
                value={txSource}
                onChange={(e) => { setTxSource(e.target.value); setTxPage(1); }}
                className="px-3 py-2 rounded-xl border border-gray-300 text-xs bg-white font-semibold"
              >
                <option value="all">Paid anywhere</option>
                {Object.entries(SOURCE_LABEL).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>

              <button
                onClick={loadTransactions}
                className="px-4 py-2 bg-gray-900 text-white rounded-xl text-xs font-bold hover:bg-black"
              >
                Search
              </button>
            </div>

            <button
              onClick={handleExportCSV}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm self-start sm:self-auto"
            >
              <span>📥 Export CSV</span>
            </button>
          </div>

          {/* Transactions Table */}
          <div className="overflow-x-auto rounded-2xl border border-gray-200">
            <table className="w-full text-left text-xs text-gray-700 font-sans">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Paid via</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Order / Payment ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {txLoading ? (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-gray-400">Loading payments...</td>
                  </tr>
                ) : transactions.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-gray-400">No payments found.</td>
                  </tr>
                ) : (
                  transactions.map((t) => (
                    <tr key={t._id} className="hover:bg-gray-50/70">
                      <td className="py-3 px-4 whitespace-nowrap text-gray-500 font-mono text-[11px]">
                        {new Date(t.createdAt).toLocaleString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-gray-900">
                          {t.userSnapshot?.username || t.userId?.username || 'Unknown'}
                        </div>
                        <div className="text-[11px] text-gray-500">
                          {t.userSnapshot?.phoneNumber || t.userId?.phone || ''}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold">
                          {SOURCE_LABEL[t.experimentVariant] || 'Website (Razorpay)'}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-gray-900">
                        ₹{t.amount}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                            t.status === 'captured'
                              ? 'bg-green-100 text-green-800'
                              : t.status === 'failed'
                              ? 'bg-red-100 text-red-800'
                              : t.status === 'refunded'
                              ? 'bg-slate-200 text-slate-700'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {t.status === 'captured' ? 'paid' : t.status === 'created' ? 'not paid' : t.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-gray-500">
                        <div>{t.orderId}</div>
                        {t.paymentId && <div className="text-gray-400 text-[10px]">{t.paymentId}</div>}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {txTotalPages > 1 && (
            <div className="flex items-center justify-between text-xs font-semibold text-gray-600 pt-2">
              <button
                disabled={txPage <= 1}
                onClick={() => setTxPage(txPage - 1)}
                className="px-3 py-1.5 rounded-lg border border-gray-300 disabled:opacity-40"
              >
                Previous
              </button>
              <span>Page {txPage} of {txTotalPages}</span>
              <button
                disabled={txPage >= txTotalPages}
                onClick={() => setTxPage(txPage + 1)}
                className="px-3 py-1.5 rounded-lg border border-gray-300 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'refunds' && <RefundsPanel />}
    </div>
  );
}
