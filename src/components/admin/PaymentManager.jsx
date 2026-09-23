import React, { useState, useEffect } from 'react';
import paymentService from '../../services/paymentService.js';
import SimpleLoading from '../ui/SimpleLoading.jsx';

export default function PaymentManager() {
  const [activeTab, setActiveTab] = useState('rules'); // 'rules' | 'abtest' | 'plans' | 'transactions'
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Settings State
  const [config, setConfig] = useState(null);
  const [plans, setPlans] = useState([]);
  const [analytics, setAnalytics] = useState(null);

  // Transactions State
  const [transactions, setTransactions] = useState([]);
  const [txLoading, setTxLoading] = useState(false);
  const [txSearch, setTxSearch] = useState('');
  const [txStatus, setTxStatus] = useState('all');
  const [txType, setTxType] = useState('all');
  const [txPage, setTxPage] = useState(1);
  const [txTotalPages, setTxTotalPages] = useState(1);

  // Segment Rule Draft State
  const [newSegment, setNewSegment] = useState({
    segmentType: 'classLevel',
    segmentValue: 'Class 6',
    action: 'free',
    discountPercent: 0,
    description: ''
  });

  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    if (activeTab === 'transactions') {
      loadTransactions();
    }
  }, [activeTab, txPage, txStatus, txType]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await paymentService.getAdminSettings();
      setConfig(data.config);
      setPlans(data.plans || []);
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
        paymentType: txType
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
      await paymentService.updateAdminSettings(config);
      setMessage({ type: 'success', text: 'Payment settings saved successfully!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 4000);
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to save settings' });
    } finally {
      setSaving(false);
    }
  };

  const handleSavePlan = async (plan) => {
    try {
      setSaving(true);
      setMessage({ type: '', text: '' });
      await paymentService.savePlan({
        id: plan._id,
        code: plan.code,
        name: plan.name,
        description: plan.description,
        type: plan.type,
        billingCycle: plan.billingCycle,
        amount: Number(plan.amount), // In plain Rupees
        discountedFrom: Number(plan.discountedFrom || 0),
        badge: plan.badge,
        features: plan.features,
        isActive: plan.isActive
      });
      setMessage({ type: 'success', text: `Plan '${plan.name}' updated successfully in Rupees!` });
      setTimeout(() => setMessage({ type: '', text: '' }), 4000);
      await loadSettings();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to save plan' });
    } finally {
      setSaving(false);
    }
  };

  const handleAddSegmentRule = () => {
    if (!newSegment.segmentValue) return;
    const updatedRules = [...(config.segmentRules || []), { ...newSegment }];
    setConfig({ ...config, segmentRules: updatedRules });
    setNewSegment({
      segmentType: 'classLevel',
      segmentValue: '',
      action: 'free',
      discountPercent: 0,
      description: ''
    });
  };

  const handleRemoveSegmentRule = (idx) => {
    const updatedRules = config.segmentRules.filter((_, i) => i !== idx);
    setConfig({ ...config, segmentRules: updatedRules });
  };

  const handleExportCSV = () => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('adminToken');
    window.open(`${paymentService.getExportCsvUrl ? paymentService.getExportCsvUrl() : '/api/payments/admin/transactions/export-csv'}?token=${token}`, '_blank');
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
              Payments & Subscriptions
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Manage billing rules, 30-day free trials, A/B test splits, and live Razorpay transactions.
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

      {/* Analytics Summary Cards */}
      {analytics && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-blue-50/70 border border-blue-100 rounded-2xl p-4">
            <div className="text-xs font-bold text-blue-600 uppercase tracking-wider">Total Revenue</div>
            <div className="text-2xl font-black text-blue-950 mt-1">₹{analytics.totalRevenueRupees}</div>
            <div className="text-[11px] text-blue-500 mt-0.5">Plain Rupees (₹)</div>
          </div>

          <div className="bg-emerald-50/70 border border-emerald-100 rounded-2xl p-4">
            <div className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Active Subscribers</div>
            <div className="text-2xl font-black text-emerald-950 mt-1">{analytics.activeSubscribersCount}</div>
            <div className="text-[11px] text-emerald-500 mt-0.5">Monthly passes</div>
          </div>

          <div className="bg-purple-50/70 border border-purple-100 rounded-2xl p-4">
            <div className="text-xs font-bold text-purple-600 uppercase tracking-wider">Single Lessons Sold</div>
            <div className="text-2xl font-black text-purple-950 mt-1">{analytics.singleLessonsPurchasedCount}</div>
            <div className="text-[11px] text-purple-500 mt-0.5">Pay-per-lesson</div>
          </div>

          <div className="bg-amber-50/70 border border-amber-100 rounded-2xl p-4">
            <div className="text-xs font-bold text-amber-600 uppercase tracking-wider">Successful Payments</div>
            <div className="text-2xl font-black text-amber-950 mt-1">{analytics.capturedTransactionsCount}</div>
            <div className="text-[11px] text-amber-500 mt-0.5">Captured orders</div>
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
          { id: 'rules', label: '⚙️ Billing Rules', desc: 'Trial & Gateway' },
          { id: 'abtest', label: '🧪 A/B Testing', desc: 'Experiment Splits' },
          { id: 'plans', label: '💰 Plans & Pricing', desc: 'Rupees Setup' },
          { id: 'transactions', label: '📊 Transactions Log', desc: 'Audit & CSV' }
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
          {/* Section: Trial Duration */}
          <div className="bg-gray-50/60 p-6 rounded-3xl border border-gray-200/80">
            <h3 className="font-black text-gray-900 text-base mb-1">
              1. Usage-Based Free Trial Duration
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              Students can freely access all lessons during this initial period. Payment is required online after these days of usage.
            </p>

            <div className="flex flex-col sm:flex-row sm:items-center gap-4 max-w-md">
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="365"
                  value={config.freeTrialDays}
                  onChange={(e) => setConfig({ ...config, freeTrialDays: parseInt(e.target.value) || 0 })}
                  className="w-24 px-4 py-2.5 rounded-xl border border-gray-300 font-bold text-gray-900 text-center"
                />
                <span className="font-bold text-sm text-gray-700">Days of Free Usage</span>
              </div>
              <span className="text-xs text-gray-400">
                (Currently: {config.freeTrialDays} days trial)
              </span>
            </div>
          </div>

          {/* Section: Segment Specific Rules */}
          <div className="bg-gray-50/60 p-6 rounded-3xl border border-gray-200/80">
            <h3 className="font-black text-gray-900 text-base mb-1">
              2. User Segment Exceptions (Class, School, Region)
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              Grant free access or custom rules to specific student cohorts (e.g. Class 6 completely free, or partner schools).
            </p>

            {/* Existing Rules Table */}
            <div className="space-y-2 mb-4">
              {(config.segmentRules || []).length === 0 ? (
                <div className="text-xs text-gray-400 italic py-2">No segment exceptions defined. Global billing rules apply to all students.</div>
              ) : (
                (config.segmentRules || []).map((rule, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-200 text-xs sm:text-sm">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-gray-800">
                        {rule.segmentType}: <span className="text-blue-600">{rule.segmentValue}</span>
                      </span>
                      <span className="px-2 py-0.5 rounded-md font-bold text-xs uppercase bg-green-100 text-green-800">
                        {rule.action === 'free' ? '100% Free Bypass' : rule.action}
                      </span>
                    </div>
                    <button
                      onClick={() => handleRemoveSegmentRule(idx)}
                      className="text-red-500 hover:text-red-700 font-bold text-xs"
                    >
                      Remove
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Add New Rule Form */}
            <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-gray-200">
              <select
                value={newSegment.segmentType}
                onChange={(e) => setNewSegment({ ...newSegment, segmentType: e.target.value })}
                className="px-3 py-2 rounded-xl border border-gray-300 text-xs font-semibold bg-white"
              >
                <option value="classLevel">Class Level</option>
                <option value="school">School Name</option>
                <option value="board">Education Board</option>
              </select>

              <input
                type="text"
                placeholder="e.g. Class 6 or DPS"
                value={newSegment.segmentValue}
                onChange={(e) => setNewSegment({ ...newSegment, segmentValue: e.target.value })}
                className="px-3 py-2 rounded-xl border border-gray-300 text-xs font-semibold bg-white flex-1 min-w-[140px]"
              />

              <button
                onClick={handleAddSegmentRule}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl"
              >
                + Add Segment Rule
              </button>
            </div>
          </div>

          {/* Section: Razorpay Gateway & Mock Sandbox Mode */}
          <div className="bg-gray-50/60 p-6 rounded-3xl border border-gray-200/80">
            <h3 className="font-black text-gray-900 text-base mb-1">
              3. Payment Gateway & Testing Mode
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              Configure Razorpay production keys or use Mock Mode to test transactions without real payments.
            </p>

            {/* Mock Mode Toggle */}
            <div className="flex items-center justify-between p-4 bg-amber-50 border border-amber-200 rounded-2xl mb-5">
              <div>
                <div className="font-bold text-sm text-amber-950">🧪 Local Sandbox / Mock Mode</div>
                <div className="text-xs text-amber-800 mt-0.5">
                  When enabled, students can test checkout and unlock lessons with 1-click simulation without charging real money.
                </div>
              </div>
              <button
                onClick={() =>
                  setConfig({
                    ...config,
                    razorpay: { ...config.razorpay, mockMode: !config.razorpay?.mockMode }
                  })
                }
                className={`px-4 py-2 rounded-xl font-bold text-xs transition-colors ${
                  config.razorpay?.mockMode
                    ? 'bg-amber-600 text-white'
                    : 'bg-gray-300 text-gray-700'
                }`}
              >
                {config.razorpay?.mockMode ? 'MOCK MODE ON' : 'LIVE API'}
              </button>
            </div>

            {/* Razorpay Credentials */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Razorpay Key ID</label>
                <input
                  type="text"
                  placeholder="rzp_live_..."
                  value={config.razorpay?.keyId || ''}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      razorpay: { ...config.razorpay, keyId: e.target.value }
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs font-mono bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Razorpay Key Secret</label>
                <input
                  type="password"
                  placeholder="••••••••••••••••"
                  value={config.razorpay?.keySecret || ''}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      razorpay: { ...config.razorpay, keySecret: e.target.value }
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs font-mono bg-white"
                />
              </div>
            </div>
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

      {/* TAB 2: A/B TESTING CONTROL */}
      {activeTab === 'abtest' && config && (
        <div className="space-y-8 animate-fade-in">
          <div className="bg-gray-50/60 p-6 rounded-3xl border border-gray-200/80">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-black text-gray-900 text-base">
                  A/B Testing Payment Models Engine
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Dynamically test showing payment options to some users but not others, or compare Monthly vs Pay-Per-Lesson conversion.
                </p>
              </div>

              <button
                onClick={() =>
                  setConfig({
                    ...config,
                    abTesting: { ...config.abTesting, enabled: !config.abTesting?.enabled }
                  })
                }
                className={`px-4 py-2 rounded-xl font-bold text-xs ${
                  config.abTesting?.enabled
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-300 text-gray-700'
                }`}
              >
                {config.abTesting?.enabled ? 'A/B TEST ACTIVE' : 'PAUSED'}
              </button>
            </div>

            {/* Variant Sliders */}
            <div className="space-y-4 pt-2">
              {/* Variant 1: Control (Free) */}
              <div className="p-4 bg-white rounded-2xl border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-bold text-sm text-gray-900">
                    Variant A: Control Group (100% Free / No Paywall)
                  </div>
                  <span className="font-mono font-bold text-sm text-blue-600">
                    {config.abTesting?.variants?.control_free?.percentage ?? 10}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={config.abTesting?.variants?.control_free?.percentage ?? 10}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 0;
                    setConfig({
                      ...config,
                      abTesting: {
                        ...config.abTesting,
                        variants: {
                          ...config.abTesting.variants,
                          control_free: { ...config.abTesting.variants.control_free, percentage: val }
                        }
                      }
                    });
                  }}
                  className="w-full accent-blue-600"
                />
                <p className="text-[11px] text-gray-400 mt-1">Users in this group never see a paywall even after 30 days.</p>
              </div>

              {/* Variant 2: Monthly Only */}
              <div className="p-4 bg-white rounded-2xl border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-bold text-sm text-gray-900">
                    Variant B: Monthly Subscription Only
                  </div>
                  <span className="font-mono font-bold text-sm text-blue-600">
                    {config.abTesting?.variants?.monthly_only?.percentage ?? 30}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={config.abTesting?.variants?.monthly_only?.percentage ?? 30}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 0;
                    setConfig({
                      ...config,
                      abTesting: {
                        ...config.abTesting,
                        variants: {
                          ...config.abTesting.variants,
                          monthly_only: { ...config.abTesting.variants.monthly_only, percentage: val }
                        }
                      }
                    });
                  }}
                  className="w-full accent-blue-600"
                />
                <p className="text-[11px] text-gray-400 mt-1">Users see only the ₹299/month unlimited pass option.</p>
              </div>

              {/* Variant 3: Pay-Per-Lesson Only */}
              <div className="p-4 bg-white rounded-2xl border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-bold text-sm text-gray-900">
                    Variant C: Pay-Per-Lesson Only
                  </div>
                  <span className="font-mono font-bold text-sm text-blue-600">
                    {config.abTesting?.variants?.pay_per_lesson_only?.percentage ?? 30}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={config.abTesting?.variants?.pay_per_lesson_only?.percentage ?? 30}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 0;
                    setConfig({
                      ...config,
                      abTesting: {
                        ...config.abTesting,
                        variants: {
                          ...config.abTesting.variants,
                          pay_per_lesson_only: { ...config.abTesting.variants.pay_per_lesson_only, percentage: val }
                        }
                      }
                    });
                  }}
                  className="w-full accent-blue-600"
                />
                <p className="text-[11px] text-gray-400 mt-1">Users are prompted to buy lessons individually for ₹19 each.</p>
              </div>

              {/* Variant 4: Hybrid */}
              <div className="p-4 bg-white rounded-2xl border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-bold text-sm text-gray-900">
                    Variant D: Hybrid (Both Monthly & Per-Lesson Offered)
                  </div>
                  <span className="font-mono font-bold text-sm text-blue-600">
                    {config.abTesting?.variants?.hybrid?.percentage ?? 30}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={config.abTesting?.variants?.hybrid?.percentage ?? 30}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 0;
                    setConfig({
                      ...config,
                      abTesting: {
                        ...config.abTesting,
                        variants: {
                          ...config.abTesting.variants,
                          hybrid: { ...config.abTesting.variants.hybrid, percentage: val }
                        }
                      }
                    });
                  }}
                  className="w-full accent-blue-600"
                />
                <p className="text-[11px] text-gray-400 mt-1">Users see both side-by-side and can choose between ₹19 single lesson or ₹299 monthly pass.</p>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              disabled={saving}
              onClick={handleSaveConfig}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-2xl shadow-md transition-transform active:scale-95 disabled:opacity-50"
            >
              {saving ? 'Saving...' : '💾 Save A/B Test Distribution'}
            </button>
          </div>
        </div>
      )}

      {/* TAB 3: PLANS & PRICING (RUPEES) */}
      {activeTab === 'plans' && (
        <div className="space-y-6 animate-fade-in">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl text-xs sm:text-sm text-blue-900">
            ℹ️ <strong>Standard Rupees (₹) Format:</strong> Prices are stored and edited in standard Rupees (e.g. 299, 19), NOT in paise.
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {plans.map((plan) => (
              <div key={plan.code} className="bg-gray-50/70 p-6 rounded-3xl border border-gray-200 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-mono text-xs uppercase px-2.5 py-1 rounded-md bg-gray-200 text-gray-800 font-bold">
                      {plan.code}
                    </span>
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-gray-700">
                      <input
                        type="checkbox"
                        checked={plan.isActive}
                        onChange={(e) => {
                          const updated = plans.map((p) => p.code === plan.code ? { ...p, isActive: e.target.checked } : p);
                          setPlans(updated);
                        }}
                        className="rounded accent-blue-600"
                      />
                      Active Plan
                    </label>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Plan Display Name</label>
                      <input
                        type="text"
                        value={plan.name}
                        onChange={(e) => {
                          const updated = plans.map((p) => p.code === plan.code ? { ...p, name: e.target.value } : p);
                          setPlans(updated);
                        }}
                        className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs font-semibold bg-white"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Price (₹ Rupees)</label>
                        <input
                          type="number"
                          value={plan.amount}
                          onChange={(e) => {
                            const updated = plans.map((p) => p.code === plan.code ? { ...p, amount: Number(e.target.value) } : p);
                            setPlans(updated);
                          }}
                          className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm font-bold text-blue-700 bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Discount Strike Price (₹)</label>
                        <input
                          type="number"
                          value={plan.discountedFrom || 0}
                          onChange={(e) => {
                            const updated = plans.map((p) => p.code === plan.code ? { ...p, discountedFrom: Number(e.target.value) } : p);
                            setPlans(updated);
                          }}
                          className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm font-semibold text-gray-500 bg-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Badge Tag</label>
                      <input
                        type="text"
                        placeholder="e.g. Most Popular"
                        value={plan.badge || ''}
                        onChange={(e) => {
                          const updated = plans.map((p) => p.code === plan.code ? { ...p, badge: e.target.value } : p);
                          setPlans(updated);
                        }}
                        className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs font-semibold bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Description</label>
                      <textarea
                        rows="2"
                        value={plan.description || ''}
                        onChange={(e) => {
                          const updated = plans.map((p) => p.code === plan.code ? { ...p, description: e.target.value } : p);
                          setPlans(updated);
                        }}
                        className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs text-gray-700 bg-white"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-gray-200">
                  <button
                    disabled={saving}
                    onClick={() => handleSavePlan(plan)}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm transition-transform active:scale-95 disabled:opacity-50"
                  >
                    Save Changes (₹{plan.amount})
                  </button>
                </div>
              </div>
            ))}
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
                onKeyDown={(e) => e.key === 'Enter' && loadTransactions()}
                className="px-3 py-2 rounded-xl border border-gray-300 text-xs bg-white min-w-[220px]"
              />

              <select
                value={txStatus}
                onChange={(e) => setTxStatus(e.target.value)}
                className="px-3 py-2 rounded-xl border border-gray-300 text-xs bg-white font-semibold"
              >
                <option value="all">All Statuses</option>
                <option value="captured">Captured (Paid)</option>
                <option value="created">Created (Pending)</option>
                <option value="failed">Failed</option>
              </select>

              <select
                value={txType}
                onChange={(e) => setTxType(e.target.value)}
                className="px-3 py-2 rounded-xl border border-gray-300 text-xs bg-white font-semibold"
              >
                <option value="all">All Types</option>
                <option value="subscription">Monthly Pass</option>
                <option value="pay_per_lesson">Pay Per Lesson</option>
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
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Order / Payment ID</th>
                  <th className="py-3 px-4">Variant</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {txLoading ? (
                  <tr>
                    <td colSpan="7" className="py-8 text-center text-gray-400">Loading transactions...</td>
                  </tr>
                ) : transactions.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-8 text-center text-gray-400">No payment transactions found.</td>
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
                        <span className="font-semibold capitalize">
                          {t.paymentType === 'subscription' ? 'Monthly Pass' : 'Single Lesson'}
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
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {t.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-gray-500">
                        <div>{t.orderId}</div>
                        {t.paymentId && <div className="text-gray-400 text-[10px]">{t.paymentId}</div>}
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-gray-500">
                        {t.experimentVariant || 'hybrid'}
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
    </div>
  );
}
