import React, { useState, useEffect, useMemo } from 'react';
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

  // Chapter Payment Settings State
  const [chapters, setChapters] = useState([]);
  const [chLoading, setChLoading] = useState(false);
  const [chSearch, setChSearch] = useState('');
  const [chSubjectFilter, setChSubjectFilter] = useState('all');
  const [chClassFilter, setChClassFilter] = useState('all');
  const [savingChapterId, setSavingChapterId] = useState(null);

  // A/B Test User Search & Management State
  const [abUserSearch, setAbUserSearch] = useState('');
  const [abSearchResults, setAbSearchResults] = useState([]);
  const [searchingAbUsers, setSearchingAbUsers] = useState(false);
  const [togglingUserId, setTogglingUserId] = useState(null);

  const handleSearchAbUsers = async (q = abUserSearch) => {
    try {
      setSearchingAbUsers(true);
      const res = await paymentService.searchAbTestUsers(q);
      setAbSearchResults(res.users || []);
    } catch (err) {
      console.error('Error searching A/B test users:', err);
    } finally {
      setSearchingAbUsers(false);
    }
  };

  const handleToggleUserVariant = async (userId, targetVariant) => {
    try {
      setTogglingUserId(userId);
      const res = await paymentService.toggleAbTestUser(userId, targetVariant);
      if (res.config) {
        setConfig(res.config);
      }
      setAbSearchResults(prev => prev.map(u => u._id === userId ? { ...u, variant: targetVariant } : u));
      setMessage({ type: 'success', text: res.message || `User updated to ${targetVariant.toUpperCase()}!` });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to update user variant' });
    } finally {
      setTogglingUserId(null);
    }
  };

  // Extract unique class levels from chapters
  const uniqueClassLevels = useMemo(() => {
    const set = new Set();
    chapters.forEach(c => {
      const cl = c.subject?.classLevel;
      if (cl) set.add(String(cl).trim());
    });
    return Array.from(set).sort((a, b) => {
      const numA = parseInt(a.replace(/\D/g, ''), 10) || 0;
      const numB = parseInt(b.replace(/\D/g, ''), 10) || 0;
      return numA - numB;
    });
  }, [chapters]);

  // Filtered chapters list based on search query, subject filter, and class filter
  const filteredChapters = useMemo(() => {
    return chapters.filter(c => {
      const q = chSearch.toLowerCase().trim();
      const matchSearch = q === '' || 
        c.title?.toLowerCase().includes(q) ||
        c.subject?.name?.toLowerCase().includes(q) ||
        String(c.subject?.classLevel || '').toLowerCase().includes(q) ||
        `class ${String(c.subject?.classLevel || '').toLowerCase()}`.includes(q);

      const matchSubject = chSubjectFilter === 'all' || c.subject?.name === chSubjectFilter;

      const rawClass = String(c.subject?.classLevel || '').trim().toLowerCase();
      const filterClass = String(chClassFilter).trim().toLowerCase();
      const matchClass = chClassFilter === 'all' || 
        rawClass === filterClass || 
        rawClass === filterClass.replace(/^class\s*/, '') ||
        `class ${rawClass}` === filterClass;

      return matchSearch && matchSubject && matchClass;
    });
  }, [chapters, chSearch, chSubjectFilter, chClassFilter]);

  const loadChapterSettings = async () => {
    try {
      setChLoading(true);
      const data = await paymentService.getChapterSettings();
      setChapters(data.chapters || []);
    } catch (err) {
      console.error('Error loading chapter payment settings:', err);
    } finally {
      setChLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'chapterPricing') {
      loadChapterSettings();
    }
    if (activeTab === 'abtest') {
      handleSearchAbUsers('');
    }
  }, [activeTab]);

  const handleSaveChapter = async (ch) => {
    try {
      setSavingChapterId(ch._id);
      await paymentService.updateChapterSetting(ch._id, {
        freeLessonsCount: ch.freeLessonsCount,
        chapterPrice: ch.chapterPrice ?? ch.lessonPrice,
        lessonPrice: ch.chapterPrice ?? ch.lessonPrice
      });
      setMessage({ type: 'success', text: `Saved settings for "${ch.title}"!` });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to save chapter settings' });
    } finally {
      setSavingChapterId(null);
    }
  };

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
          { id: 'chapterPricing', label: '🏫 Free Levels & Pricing', desc: 'Chapter-wise controls' },
          { id: 'plans', label: '💰 Plans & Pricing', desc: 'Rupees Setup' },
          { id: 'abtest', label: '🧪 User A/B Testing', desc: 'Paid vs Free' },
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
          {/* Section: Pay As You Go & Global Price */}
          <div className="bg-indigo-50/70 p-6 rounded-3xl border border-indigo-200">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">💳</span>
              <h3 className="font-black text-gray-900 text-base">
                Pay As You Go & Free Levels Defaults
              </h3>
            </div>
            <p className="text-xs text-gray-500 mb-4">
              Set the platform-wide lesson price in Rupees and the default number of free levels per chapter.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Default Price Per Lesson (₹)
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-gray-500">₹</span>
                  <input
                    type="number"
                    min="0"
                    value={config.defaultLessonPrice ?? 50}
                    onChange={(e) => setConfig({ ...config, defaultLessonPrice: Number(e.target.value) })}
                    className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-sm font-black text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <p className="text-[11px] text-gray-400 mt-1">Single lesson unlock price for Pay As You Go.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Default Free Levels Per Chapter
                </label>
                <input
                  type="number"
                  min="0"
                  value={config.defaultFreeLessonsCount ?? 1}
                  onChange={(e) => setConfig({ ...config, defaultFreeLessonsCount: Number(e.target.value) })}
                  className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-sm font-black text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-[11px] text-gray-400 mt-1">E.g. 1 means Level 1 is free, Level 2+ requires unlock.</p>
              </div>
            </div>
          </div>

          {/* Section: Classroom Homework Free Chapter Access */}
          <div className="bg-gradient-to-r from-emerald-50/90 to-teal-50/70 p-6 rounded-3xl border border-emerald-200/90 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-xl">📚</span>
                  <h3 className="font-black text-gray-900 text-base">
                    Classroom Homework Chapter Free Access
                  </h3>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    config.freeAccessForActiveHomework !== false
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-gray-200 text-gray-700'
                  }`}>
                    {config.freeAccessForActiveHomework !== false ? 'Active' : 'Disabled'}
                  </span>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed max-w-2xl">
                  When enabled, any chapter where a student has an <strong>active homework assignment</strong> in their enrolled classroom will be <strong>100% free</strong> with zero paywall (including all lessons and Chapter Exam Mode) until the assignment’s due date expires. Once the due date passes or homework is closed, normal paywall rules apply.
                </p>
              </div>

              <div className="shrink-0 flex items-center gap-3">
                <button
                  type="button"
                  onClick={async () => {
                    const currentVal = config.freeAccessForActiveHomework !== false;
                    const updated = { ...config, freeAccessForActiveHomework: !currentVal };
                    setConfig(updated);
                    try {
                      setSaving(true);
                      await paymentService.updateAdminSettings(updated);
                      setMessage({
                        type: 'success',
                        text: `Classroom Homework Free Access is now ${!currentVal ? 'ENABLED (Free chapters for active homework)' : 'DISABLED (Standard paywall applies)'}`
                      });
                      setTimeout(() => setMessage({ type: '', text: '' }), 4000);
                    } catch (err) {
                      setMessage({ type: 'error', text: 'Failed to update homework access setting' });
                    } finally {
                      setSaving(false);
                    }
                  }}
                  className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer shadow-sm active:scale-95 ${
                    config.freeAccessForActiveHomework !== false
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                  }`}
                >
                  <span className={`w-2.5 h-2.5 rounded-full ${config.freeAccessForActiveHomework !== false ? 'bg-white animate-pulse' : 'bg-gray-400'}`}></span>
                  <span>{config.freeAccessForActiveHomework !== false ? 'ENABLED (FREE CHAPTERS)' : 'DISABLED'}</span>
                </button>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-emerald-200/60 flex flex-wrap items-center justify-between gap-2 text-[11px] text-emerald-800 font-medium">
              <span>✓ Auto-detects student classroom enrollments and assignment due dates</span>
              <span className="font-bold">Auto-locks when due date passes</span>
            </div>
          </div>

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

      {/* TAB 2: A/B TESTING CONTROL (USER-LEVEL: PAID VS FREE) */}
      {activeTab === 'abtest' && config && (
        <div className="space-y-8 animate-fade-in">
          {/* Main Master Control Banner */}
          <div className="bg-gradient-to-r from-blue-50/80 to-indigo-50/80 p-6 rounded-3xl border border-blue-200/80">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl">🧪</span>
                  <h3 className="font-black text-gray-900 text-base sm:text-lg">
                    User A/B Testing: Paid vs 100% Free
                  </h3>
                </div>
                <p className="text-xs sm:text-sm text-gray-600 mt-1 max-w-2xl leading-relaxed">
                  By default, <strong>all users</strong> are in the standard <strong>Paid</strong> model (₹50 Pay-Per-Chapter pass). 
                  You can selectively enable <strong>100% Free Access</strong> for specific users or assign a random test percentage below.
                </p>
              </div>

              <button
                onClick={() =>
                  setConfig({
                    ...config,
                    abTesting: { ...config.abTesting, enabled: !config.abTesting?.enabled }
                  })
                }
                className={`px-5 py-2.5 rounded-2xl font-bold text-xs shadow-sm transition-all whitespace-nowrap active:scale-95 ${
                  config.abTesting?.enabled
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                }`}
              >
                {config.abTesting?.enabled ? '✅ A/B TEST ACTIVE' : '⏸️ TESTING OFF (100% PAID)'}
              </button>
            </div>

            {/* Test Group Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-blue-600"></span>
                    <h4 className="font-bold text-sm text-gray-900">Group A: Standard Paid (Default)</h4>
                  </div>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                    Default Experience
                  </span>
                </div>
                <p className="text-xs text-gray-500">
                  Users encounter the standard chapter paywall (₹50/chapter 1-year pass). All users start in this group.
                </p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                    <h4 className="font-bold text-sm text-gray-900">Group B: Free Access (Test Group)</h4>
                  </div>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {(config.abTesting?.freeUsers?.length || 0) + (config.abTesting?.freePhones?.length || 0)} Users
                  </span>
                </div>
                <p className="text-xs text-gray-500">
                  Selected users bypass all chapter paywalls and enjoy completely free unlocked access across all chapters and exam mode.
                </p>
              </div>
            </div>
          </div>

          {/* Random Percentage Rollout Slider */}
          <div className="p-6 bg-white rounded-3xl border border-gray-200 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h4 className="font-bold text-sm text-gray-900">
                  🎲 Random Rollout Percentage to Free Group
                </h4>
                <p className="text-xs text-gray-500 mt-0.5">
                  Automatically assign a percentage of unassigned users to the Free test group. Set to 0% if you only want explicitly chosen users to be Free.
                </p>
              </div>
              <span className="font-mono font-black text-lg text-blue-600 bg-blue-50 px-3 py-1 rounded-xl border border-blue-100">
                {config.abTesting?.freePercentage ?? 0}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={config.abTesting?.freePercentage ?? 0}
              onChange={(e) => {
                const val = parseInt(e.target.value) || 0;
                setConfig({
                  ...config,
                  abTesting: {
                    ...config.abTesting,
                    freePercentage: val
                  }
                });
              }}
              className="w-full accent-blue-600 mt-3"
            />
            <div className="flex justify-between text-[11px] text-gray-400 font-mono mt-1">
              <span>0% (Only manual free users)</span>
              <span>50%</span>
              <span>100% (All users free)</span>
            </div>
          </div>

          {/* User Search & Assignment Section */}
          <div className="p-6 bg-white rounded-3xl border border-gray-200 shadow-xs space-y-5">
            <div>
              <h4 className="font-bold text-sm text-gray-900">
                🔍 Find Users & Toggle Free / Paid Status
              </h4>
              <p className="text-xs text-gray-500 mt-0.5">
                Search students by phone number, name, or email to grant or revoke 100% free access.
              </p>
            </div>

            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Search by phone number, student name, or email..."
                  value={abUserSearch}
                  onChange={(e) => setAbUserSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearchAbUsers(abUserSearch)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-gray-300 text-xs sm:text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="absolute left-3.5 top-3 text-gray-400 text-sm">🔍</span>
              </div>
              <button
                onClick={() => handleSearchAbUsers(abUserSearch)}
                disabled={searchingAbUsers}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs sm:text-sm font-bold shadow-xs active:scale-95 disabled:opacity-50"
              >
                {searchingAbUsers ? 'Searching...' : 'Search'}
              </button>
            </div>

            {/* Results Table */}
            {searchingAbUsers ? (
              <div className="text-center py-8 text-xs text-gray-400">Searching users...</div>
            ) : abSearchResults.length > 0 ? (
              <div className="overflow-x-auto rounded-2xl border border-gray-100">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 text-gray-500 font-semibold border-b border-gray-100">
                    <tr>
                      <th className="p-3">User</th>
                      <th className="p-3">Phone</th>
                      <th className="p-3">Class</th>
                      <th className="p-3">Current Status</th>
                      <th className="p-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {abSearchResults.map((u) => {
                      const isFree = u.variant === 'free';
                      const isToggling = togglingUserId === u._id;
                      return (
                        <tr key={u._id} className="hover:bg-gray-50/50">
                          <td className="p-3">
                            <div className="font-bold text-gray-900">{u.name || 'Unnamed Student'}</div>
                            <div className="text-[11px] text-gray-400">{u.email || 'No email'}</div>
                          </td>
                          <td className="p-3 font-mono font-semibold text-gray-700">
                            {u.phone || '—'}
                          </td>
                          <td className="p-3 text-gray-600">
                            {u.classLevel ? `Class ${u.classLevel}` : '—'}
                          </td>
                          <td className="p-3">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                                isFree
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-blue-100 text-blue-800'
                              }`}
                            >
                              {isFree ? '🎁 100% Free' : '💳 Paid Model'}
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            <button
                              disabled={isToggling}
                              onClick={() => handleToggleUserVariant(u._id, isFree ? 'paid' : 'free')}
                              className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all active:scale-95 disabled:opacity-50 ${
                                isFree
                                  ? 'bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300'
                                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                              }`}
                            >
                              {isToggling ? 'Updating...' : isFree ? 'Switch to Paid 💳' : 'Enable Free 🎁'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-6 text-xs text-gray-400">
                No users found matching your search. Type a phone number or name above.
              </div>
            )}
          </div>

          {/* Currently Configured Free Users List */}
          {config.abTesting?.freeUsers && config.abTesting.freeUsers.length > 0 && (
            <div className="p-6 bg-white rounded-3xl border border-gray-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-gray-900">
                    🎁 Active Free Test Users ({config.abTesting.freeUsers.length})
                  </h4>
                  <p className="text-xs text-gray-500 mt-0.5">
                    These users have been granted explicit 100% free access and will bypass all chapter paywalls.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                {config.abTesting.freeUsers.map((user) => {
                  const userId = typeof user === 'object' ? user._id : user;
                  const userName = typeof user === 'object' ? (user.name || user.phone || 'User') : user;
                  const userPhone = typeof user === 'object' ? user.phone : '';
                  const isToggling = togglingUserId === userId;

                  return (
                    <div
                      key={userId}
                      className="inline-flex items-center gap-2 pl-3 pr-2 py-1.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 font-semibold"
                    >
                      <span>
                        {userName} {userPhone && userPhone !== userName ? `(${userPhone})` : ''}
                      </span>
                      <button
                        type="button"
                        disabled={isToggling}
                        onClick={() => handleToggleUserVariant(userId, 'paid')}
                        title="Remove free access (Switch to Paid)"
                        className="w-5 h-5 flex items-center justify-center rounded-lg bg-emerald-200 hover:bg-red-200 hover:text-red-700 text-emerald-800 transition-colors disabled:opacity-50"
                      >
                        ✕
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Save Settings Footer */}
          <div className="flex justify-end pt-4">
            <button
              disabled={saving}
              onClick={handleSaveConfig}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-2xl shadow-md transition-transform active:scale-95 disabled:opacity-50"
            >
              {saving ? 'Saving...' : '💾 Save A/B Testing Settings'}
            </button>
          </div>
        </div>
      )}

      {/* TAB 3: PLANS & PRICING (RUPEES) */}
      {activeTab === 'plans' && (
        <div className="space-y-6 animate-fade-in">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl text-xs sm:text-sm text-blue-900">
            ℹ️ <strong>Active Subscription Plan:</strong> Standard chapter-based pass for full 1-year access. Prices are stored and edited in standard Rupees (₹), NOT in paise.
          </div>

          <div className="max-w-2xl mx-auto">
            {plans
              .filter((plan) => plan.code === 'pay_per_chapter' || plan.isActive)
              .slice(0, 1)
              .map((plan) => (
                <div key={plan.code} className="bg-gray-50/70 p-6 md:p-8 rounded-3xl border border-gray-200 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs uppercase px-2.5 py-1 rounded-md bg-blue-100 text-blue-800 font-bold">
                          {plan.code}
                        </span>
                        <span className="text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                          Active Plan
                        </span>
                      </div>
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

                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Plan Display Name</label>
                        <input
                          type="text"
                          value={plan.name}
                          onChange={(e) => {
                            const updated = plans.map((p) => p.code === plan.code ? { ...p, name: e.target.value } : p);
                            setPlans(updated);
                          }}
                          className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm font-semibold bg-white"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-1">Price (₹ Rupees)</label>
                          <input
                            type="number"
                            value={plan.amount}
                            onChange={(e) => {
                              const updated = plans.map((p) => p.code === plan.code ? { ...p, amount: Number(e.target.value) } : p);
                              setPlans(updated);
                            }}
                            className="w-full px-3 py-2 rounded-xl border border-gray-300 text-base font-bold text-blue-700 bg-white"
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
                            className="w-full px-3 py-2 rounded-xl border border-gray-300 text-base font-semibold text-gray-500 bg-white"
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

                  <div className="pt-6 mt-6 border-t border-gray-200">
                    <button
                      disabled={saving}
                      onClick={() => handleSavePlan(plan)}
                      className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-sm transition-transform active:scale-95 disabled:opacity-50"
                    >
                      {saving ? 'Saving...' : `Save Plan Changes (₹${plan.amount})`}
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

      {/* TAB: CHAPTER-WISE FREE LEVELS & PRICING */}
      {activeTab === 'chapterPricing' && (
        <div className="space-y-6 animate-fade-in">
          {/* Header Card */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-3xl border border-blue-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl">🏫</span>
                <h3 className="font-black text-gray-900 text-base">
                  Dynamic Chapter-Wise Free Levels & Pricing
                </h3>
              </div>
              <p className="text-xs text-gray-600 max-w-xl">
                Configure how many levels are free in each chapter, or set custom chapter prices. When left blank, chapters inherit the global default (<strong>{config?.defaultFreeLessonsCount ?? 1} level free</strong>, <strong>₹{config?.defaultChapterPrice ?? config?.defaultLessonPrice ?? 50}/chapter (1-Year Pass)</strong>).
              </p>
            </div>
            <button
              onClick={loadChapterSettings}
              disabled={chLoading}
              className="px-4 py-2 bg-white border border-blue-200 hover:bg-blue-50 text-blue-700 text-xs font-bold rounded-xl transition-all shadow-xs shrink-0 active:scale-95"
            >
              {chLoading ? 'Refreshing...' : '🔄 Refresh List'}
            </button>
          </div>

          {/* Search & Filter Controls */}
          <div className="flex flex-col gap-3">
            <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
              <div className="relative w-full md:w-80">
                <input
                  type="text"
                  placeholder="Search chapter, subject, or class..."
                  value={chSearch}
                  onChange={(e) => setChSearch(e.target.value)}
                  className="w-full pl-9 pr-8 py-2.5 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium shadow-xs"
                />
                <span className="absolute left-3 top-3 text-gray-400 text-xs">🔍</span>
                {chSearch && (
                  <button
                    type="button"
                    onClick={() => setChSearch('')}
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 font-bold text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                {/* Class Filter Dropdown */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 font-bold">Filter Class:</span>
                  <select
                    value={chClassFilter}
                    onChange={(e) => setChClassFilter(e.target.value)}
                    className="text-xs bg-white border border-gray-200 rounded-xl px-3 py-2 font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs cursor-pointer"
                  >
                    <option value="all">All Classes</option>
                    {uniqueClassLevels.map(cl => (
                      <option key={cl} value={cl}>
                        {cl.toLowerCase().startsWith('class') ? cl : `Class ${cl}`}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Subject Filter Dropdown */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 font-bold">Filter Subject:</span>
                  <select
                    value={chSubjectFilter}
                    onChange={(e) => setChSubjectFilter(e.target.value)}
                    className="text-xs bg-white border border-gray-200 rounded-xl px-3 py-2 font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs cursor-pointer"
                  >
                    <option value="all">All Subjects</option>
                    {Array.from(new Set(chapters.map(c => c.subject?.name).filter(Boolean))).map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Quick Class Selection Tabs/Pills */}
            {uniqueClassLevels.length > 0 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-0.5 no-scrollbar">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider shrink-0 mr-1">
                  Class Filter:
                </span>
                <button
                  type="button"
                  onClick={() => setChClassFilter('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 ${
                    chClassFilter === 'all'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-200'
                  }`}
                >
                  All Classes ({chapters.length})
                </button>
                {uniqueClassLevels.map(cl => {
                  const count = chapters.filter(c => {
                    const raw = String(c.subject?.classLevel || '').trim().toLowerCase();
                    const target = String(cl).trim().toLowerCase();
                    return raw === target || raw === target.replace(/^class\s*/, '') || `class ${raw}` === target;
                  }).length;
                  const isSelected = chClassFilter.toLowerCase() === cl.toLowerCase();
                  const label = cl.toLowerCase().startsWith('class') ? cl : `Class ${cl}`;
                  return (
                    <button
                      key={cl}
                      type="button"
                      onClick={() => setChClassFilter(isSelected ? 'all' : cl)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 ${
                        isSelected
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-200'
                      }`}
                    >
                      {label} ({count})
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Table */}
          <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider font-black text-[10px] border-b border-gray-200">
                  <tr>
                    <th className="py-3 px-4">Chapter Title</th>
                    <th className="py-3 px-4">Subject & Class</th>
                    <th className="py-3 px-4 text-center">Total Levels</th>
                    <th className="py-3 px-4">Free Levels Count</th>
                    <th className="py-3 px-4">Price Per Chapter (₹)</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredChapters.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-12 text-center text-gray-400">
                        <div className="text-3xl mb-2">🔍</div>
                        <p className="font-bold text-gray-600 text-sm">No chapters found</p>
                        <p className="text-xs text-gray-400 mt-1">
                          Try adjusting your search query, class filter, or subject filter.
                        </p>
                        {(chSearch || chClassFilter !== 'all' || chSubjectFilter !== 'all') && (
                          <button
                            type="button"
                            onClick={() => {
                              setChSearch('');
                              setChClassFilter('all');
                              setChSubjectFilter('all');
                            }}
                            className="mt-3 px-4 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                          >
                            Clear All Filters
                          </button>
                        )}
                      </td>
                    </tr>
                  ) : (
                    filteredChapters.map((ch) => (
                      <tr key={ch._id} className="hover:bg-blue-50/30 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-gray-900 max-w-[220px]">
                          <div className="line-clamp-1">{ch.title}</div>
                        </td>
                        <td className="py-3.5 px-4 text-gray-600">
                          {ch.subject ? (
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-gray-800">{ch.subject.name}</span>
                              <span className="text-gray-400">•</span>
                              {ch.subject.classLevel ? (
                                <span className="bg-blue-50 text-blue-700 font-extrabold px-2 py-0.5 rounded-md text-[11px] border border-blue-100">
                                  {ch.subject.classLevel.toLowerCase().startsWith('class') ? ch.subject.classLevel : `Class ${ch.subject.classLevel}`}
                                </span>
                              ) : null}
                              {ch.subject.board && (
                                <span className="text-[11px] text-gray-400 font-medium">({ch.subject.board})</span>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-400 italic">No subject</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center font-black text-gray-800">
                          <span className="bg-gray-100 px-2.5 py-0.5 rounded-full text-[11px]">
                            {ch.totalModules} levels
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              min="0"
                              max={ch.totalModules || 99}
                              placeholder={String(config?.defaultFreeLessonsCount ?? 1)}
                              value={ch.freeLessonsCount ?? ''}
                              onChange={(e) => {
                                const val = e.target.value === '' ? null : Number(e.target.value);
                                setChapters(prev => prev.map(c => c._id === ch._id ? { ...c, freeLessonsCount: val } : c));
                              }}
                              className="w-16 bg-white border border-gray-300 rounded-lg px-2 py-1 text-xs font-bold text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 text-center"
                            />
                            <span className="text-[10px] text-gray-400">
                              {ch.freeLessonsCount != null ? 'custom' : '(default: 1)'}
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5">
                            <span className="text-gray-400 font-bold">₹</span>
                            <input
                              type="number"
                              min="0"
                              placeholder={String(config?.defaultChapterPrice ?? config?.defaultLessonPrice ?? 50)}
                              value={ch.chapterPrice ?? ch.lessonPrice ?? ''}
                              onChange={(e) => {
                                const val = e.target.value === '' ? null : Number(e.target.value);
                                setChapters(prev => prev.map(c => c._id === ch._id ? { ...c, chapterPrice: val, lessonPrice: val } : c));
                              }}
                              className="w-20 bg-white border border-gray-300 rounded-lg px-2 py-1 text-xs font-bold text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 text-center"
                            />
                            <span className="text-[10px] text-gray-400">
                              {(ch.chapterPrice ?? ch.lessonPrice) != null ? 'custom' : `(default: ₹${config?.defaultChapterPrice ?? 50})`}
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => handleSaveChapter(ch)}
                            disabled={savingChapterId === ch._id}
                            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs transition-transform active:scale-95 shadow-xs disabled:opacity-50 cursor-pointer"
                          >
                            {savingChapterId === ch._id ? 'Saving...' : 'Save'}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
