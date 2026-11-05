import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext.jsx';
import { useAccess, trialMsLeft } from '../../../context/AccessContext.jsx';
import paymentService from '../../../services/paymentService.js';
import { usesPlayBilling } from '../../../services/billingService.js';
import PaywallModal from './PaywallModal.jsx';
import GuestVerifyModal from '../../forms/GuestVerifyModal.jsx';
import BottomNavigation from '../../layout/BottomNavigation.jsx';
import LiveCountdown from './LiveCountdown.jsx';
import TrialTestToggle from './TrialTestToggle.jsx';
import { useServerNow } from '../../../hooks/useServerNow.js';

const formatDate = (dateStr, withTime = false, withYear = true) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  const opts = { day: 'numeric', month: 'short', ...(withYear ? { year: 'numeric' } : {}) };
  return d.toLocaleString('en-IN', withTime ? { ...opts, hour: 'numeric', minute: '2-digit' } : opts);
};

const SOURCE_LABEL = { google_play: 'Google Play', razorpay: 'Razorpay', admin: 'HoshiYaar team', mock: 'Sandbox test' };
const historySource = (t) => {
  const v = String(t.experimentVariant || '');
  if (v.startsWith('google_play')) return v.endsWith('_test') ? 'Google Play (test)' : 'Google Play';
  if (v === 'mock_sandbox') return 'Sandbox test';
  return 'Razorpay';
};

// Dev builds only, when the backend has no trial data: a sample so the page can be checked
let previewStart = null;
const previewAccess = (now) => {
  previewStart = previewStart || now - 6 * 60000;
  return {
    state: 'trial_active', trialHours: 48, trialLessonLimit: 7, lessonLimit: 7, lessonsUsed: 2, lessonsLeft: 5,
    trialStartedAt: new Date(previewStart), trialEndsAt: new Date(previewStart + 48 * 3600000), isGuest: false
  };
};

// Line icons (stroke follows the text colour)
const Icon = ({ d, className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {d}
  </svg>
);
const ICONS = {
  book: <><path d="M2 4h6a4 4 0 0 1 4 4v13a3 3 0 0 0-3-3H2z" /><path d="M22 4h-6a4 4 0 0 0-4 4v13a3 3 0 0 1 3-3h7z" /></>,
  play: <><rect x="3" y="4" width="18" height="14" rx="3" /><path d="M10 9l5 2.5-5 2.5z" /></>,
  brain: <><path d="M9 3a3 3 0 0 0-3 3v.5A3 3 0 0 0 4 12a3 3 0 0 0 2 5.5V18a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3z" /><path d="M15 3a3 3 0 0 1 3 3v.5a3 3 0 0 1 2 5.5 3 3 0 0 1-2 5.5V18a3 3 0 0 1-6 0" /></>,
  replay: <><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5" /></>,
  lock: <><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></>,
  calendar: <><rect x="3" y="4" width="18" height="17" rx="2" /><path d="M3 9h18M8 2v4M16 2v4" /></>,
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  x: <path d="M6 6l12 12M18 6L6 18" />,
  chevron: <path d="M6 9l6 6 6-6" />,
  back: <path d="M15 18l-6-6 6-6" />,
};

const Crown = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    <defs>
      <linearGradient id="proCrown" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#FEF3C7" />
        <stop offset="60%" stopColor="#FBBF24" />
        <stop offset="100%" stopColor="#D97706" />
      </linearGradient>
    </defs>
    <path d="M4 17L2.5 7l5.5 4.5L12 4l4 7.5L21.5 7 20 17z" fill="url(#proCrown)" />
    <rect x="4" y="18" width="16" height="2.5" rx="1.2" fill="url(#proCrown)" />
  </svg>
);

const DetailRow = ({ icon, label, value }) => (
  <div className="flex items-center gap-3 py-3 border-b border-slate-100 last:border-0">
    <span className="w-8 h-8 rounded-xl bg-[#F5F3FF] text-[#6D28D9] flex items-center justify-center shrink-0">
      <Icon d={ICONS[icon]} className="w-4 h-4" />
    </span>
    <span className="flex-1 text-[15px] font-bold text-slate-500 whitespace-nowrap">{label}</span>
    <span className="text-[15px] font-black text-slate-900 text-right">{value}</span>
  </div>
);

const FEATURES = [
  { icon: 'book', title: 'Every chapter', text: 'All lessons, all subjects' },
  { icon: 'play', title: 'Stories & boards', text: 'Animated, voiced lessons' },
  { icon: 'brain', title: 'Quizzes & revision', text: 'Practice that sticks' },
  { icon: 'replay', title: 'Replay anytime', text: 'Learn at your own pace' },
];

const COMPARE = [
  ['Lessons', '7 lessons', 'Every lesson'],
  ['Access time', '48 hours', '6 months'],
  ['Replay played lessons', true, true],
  ['New chapters as they launch', false, true],
];

const FAQ = [
  ['Does the pass renew automatically?', 'No. It is a one-time payment of ₹99 for 6 months. Nothing is charged again unless you choose to buy another pass.'],
  ['What happens after 6 months?', 'Lessons you played stay open. You can buy another pass any time to unlock everything again, and if you buy early the new 6 months are added on top.'],
  ['Will I lose my progress?', 'Never. Your stars, streaks and completed lessons stay with your account on every device.'],
  ['How can I pay?', 'In the Android app, through Google Play. On the website, through Razorpay with UPI, cards or netbanking.'],
];

// The HoshiYaar Pro page: status, plan, what's included, and payments
export default function SubscriptionPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { access: liveAccess, refresh } = useAccess();
  // Ticks every second on server time, so the countdown is live
  const now = useServerNow();
  const isPreview = import.meta.env.DEV && (!liveAccess || liveAccess.state === 'open');
  const access = isPreview ? previewAccess(now) : liveAccess;

  const handleBack = () => {
    if (window.history.state && typeof window.history.state.idx === 'number' && window.history.state.idx > 0) {
      navigate(-1);
    } else {
      navigate('/home', { replace: true });
    }
  };

  const [loading, setLoading] = useState(true);
  const [userStatus, setUserStatus] = useState(null);
  const [plan, setPlan] = useState({ amount: 99, discountedFrom: 599, features: [] });
  const [showPaywall, setShowPaywall] = useState(false);
  const [showGuestVerify, setShowGuestVerify] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const handleUnlockClick = () => {
    if (user?.isGuest || access?.isGuest) {
      setShowGuestVerify(true);
      return;
    }
    setShowPaywall(true);
  };
  const [openFaq, setOpenFaq] = useState(0);

  // The page renders straight away from the trial status the app already holds;
  // these only fill in payment history and the latest price, each as it arrives
  const loadData = () => {
    refresh();
    paymentService.getPublicConfig()
      .then(cfg => {
        const pass = cfg?.plans?.find(p => p.code === 'pass_6m');
        if (pass) setPlan(pass);
      })
      .catch(() => {});
    paymentService.getUserStatus()
      .then(setUserStatus)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (access?.plan?.amount) {
      setPlan(prev => ({
        ...prev,
        amount: access.plan.amount,
        discountedFrom: access.plan.discountedFrom || prev.discountedFrom,
        durationDays: access.plan.durationDays || prev.durationDays
      }));
    }
  }, [access?.plan?.amount, access?.plan?.discountedFrom, access?.plan?.durationDays]);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?._id]);

  const faqList = [
    ['Does the pass renew automatically?', `No. It is a one-time payment of ₹${plan.amount} for 6 months. Nothing is charged again unless you choose to buy another pass.`],
    ['What happens after 6 months?', 'Lessons you played stay open. You can buy another pass any time to unlock everything again, and if you buy early the new 6 months are added on top.'],
    ['Will I lose my progress?', 'Never. Your stars, streaks and completed lessons stay with your account on every device.'],
    ['How can I pay?', 'In the Android app, through Google Play. On the website, through Razorpay with UPI, cards or netbanking.'],
  ];

  const state = access?.state || 'open';
  const hasPass = state === 'pass';
  const inTrial = state === 'trial_active' || state === 'guest_limit' || state === 'trial_not_started';
  const msLeft = trialMsLeft(access, now);
  const history = userStatus?.paymentHistory || [];
  const saving = plan.discountedFrom > plan.amount ? Math.round((1 - plan.amount / plan.discountedFrom) * 100) : 0;
  const perMonth = (plan.amount / 6).toFixed(plan.amount % 6 === 0 ? 0 : 1);
  const lessonsUsed = access?.lessonsUsed ?? 0;
  const lessonCap = access?.trialLessonLimit ?? 7;

  const statusPill = hasPass
    ? `Pro active · till ${formatDate(access?.passExpiresAt)}`
    : state === 'trial_ended'
      ? 'Free trial ended'
      : state === 'trial_active' || state === 'guest_limit'
        ? 'Free trial running'
        : state === 'trial_not_started'
          ? `Free trial · ${access?.trialHours ?? 48} hours`
          : 'All lessons open';

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F5F3FF] to-[#F0F6FF] font-sans pb-28">
      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#1E1B4B] via-[#3B0764] to-[#4C1D95] rounded-b-[32px] px-5 pt-4 pb-16">
        <span className="pointer-events-none absolute -top-16 -right-10 w-56 h-56 rounded-full bg-[#F59E0B]/25 blur-3xl" aria-hidden="true" />
        <span className="pointer-events-none absolute top-24 -left-16 w-48 h-48 rounded-full bg-[#A855F7]/30 blur-3xl" aria-hidden="true" />
        <div className="relative max-w-xl mx-auto">
          <div className="flex items-center justify-between">
            <button onClick={handleBack} aria-label="Back" className="w-9 h-9 rounded-full bg-white/10 border border-white/15 text-white flex items-center justify-center cursor-pointer">
              <Icon d={ICONS.back} />
            </button>
            {(isPreview || liveAccess?.testView) && (
              <span className="rounded-full bg-black/30 border border-[#FCD34D]/50 px-2 py-px text-[11px] font-black uppercase tracking-wider text-[#FCD34D]">
                {liveAccess?.testView ? 'Test view' : 'Preview · dev only'}
              </span>
            )}
          </div>

          <div className="mt-5 flex flex-col items-center text-center">
            <span className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#FDE68A]/25 to-[#F59E0B]/10 border border-[#FCD34D]/40 flex items-center justify-center shadow-[0_0_30px_rgba(251,191,36,0.35)]">
              <Crown className="w-9 h-9" />
            </span>
            <h1 className="mt-3 text-[28px] font-black text-white tracking-tight leading-none">
              HoshiYaar <span className="bg-gradient-to-b from-[#FEF3C7] to-[#F59E0B] bg-clip-text text-transparent">Pro</span>
            </h1>
            <p className="mt-2 text-[15px] font-semibold text-indigo-200">Every lesson. Every chapter. Six months.</p>
            <p className={`mt-4 text-[17px] font-black ${state === 'trial_ended' ? 'text-[#FDA4AF]' : 'text-[#FDE68A]'}`}>
              {statusPill}
            </p>
            {(state === 'trial_active' || state === 'guest_limit') && msLeft != null && (
              <div className="mt-4">
                <LiveCountdown ms={msLeft} />
                <p className="mt-2 text-[13px] font-bold text-indigo-200">left in your free trial</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="relative max-w-xl mx-auto px-4 -mt-10 space-y-5">
        {successMessage && (
          <div className="bg-green-50 border border-green-200 text-green-800 text-[15px] font-bold rounded-2xl px-4 py-3">🎉 {successMessage}</div>
        )}

        <TrialTestToggle />

        {/* Your status */}
        <section className="rounded-[24px] bg-white shadow-[0_12px_30px_rgba(30,27,75,0.12)] border border-white px-4 pt-4 pb-2">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-[17px] font-black text-slate-900">Your plan</h2>
            <span className={`text-[12px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
              hasPass ? 'bg-[#FEF3C7] text-[#92400E]' : state === 'trial_ended' ? 'bg-rose-50 text-rose-600' : 'bg-[#F5F3FF] text-[#6D28D9]'
            }`}>
              {hasPass ? 'Pro' : state === 'trial_ended' ? 'Expired' : inTrial ? 'Free trial' : 'Open'}
            </span>
          </div>

          {(state === 'trial_active' || state === 'guest_limit') && (
            <div className="mt-2 mb-1">
              <div className="flex justify-between text-[13px] font-bold text-slate-500 mb-1.5">
                <span>Free lessons used</span>
                <span className="font-black text-slate-900">{lessonsUsed} of {lessonCap}</span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full rounded-full bg-[#7C3AED]" style={{ width: `${Math.min(100, (lessonsUsed / lessonCap) * 100)}%` }} />
              </div>
            </div>
          )}

          {hasPass ? (
            <>
              <DetailRow icon="calendar" label="Valid till" value={formatDate(access?.passExpiresAt)} />
              {access?.passSource && <DetailRow icon="lock" label="Paid via" value={SOURCE_LABEL[access.passSource] || access.passSource} />}
            </>
          ) : state === 'open' ? (
            <DetailRow icon="book" label="Access" value="All lessons open" />
          ) : (
            <>
              <DetailRow icon="calendar" label="Trial started" value={access?.trialStartedAt ? formatDate(access.trialStartedAt, true, false) : 'With your first lesson'} />
              <DetailRow icon="calendar" label="Trial ends" value={access?.trialEndsAt ? formatDate(access.trialEndsAt, true, false) : `${access?.trialHours ?? 48} hours later`} />
              {state === 'trial_ended' && <DetailRow icon="replay" label="Played lessons" value="Still open" />}
            </>
          )}
        </section>

        {/* The plan */}
        <section className="relative rounded-[26px] p-[2px] bg-gradient-to-br from-[#FDE68A] via-[#D97706] to-[#FDE68A] shadow-[0_14px_34px_rgba(76,29,149,0.35)]">
          <div className="relative overflow-hidden rounded-[24px] bg-gradient-to-br from-[#1E1B4B] via-[#3B0764] to-[#4C1D95] p-5">
            <span className="pointer-events-none absolute -top-12 -right-12 w-40 h-40 rounded-full bg-[#F59E0B]/20 blur-3xl" aria-hidden="true" />
            <span className="absolute top-4 right-0 rounded-l-full bg-gradient-to-r from-[#FCD34D] to-[#F59E0B] pl-3 pr-3 py-1 text-[12px] font-black uppercase tracking-wider text-[#3B0764]">
              Best value
            </span>
            <p className="relative text-[13px] font-black uppercase tracking-[0.18em] text-[#FCD34D]">6-Month Pass</p>
            <div className="relative mt-2 flex items-end gap-2">
              <span className="text-[44px] font-black text-white leading-none">₹{plan.amount}</span>
              {saving > 0 && <span className="mb-1 text-lg font-bold text-white/45 line-through decoration-[#FB7185] decoration-2">₹{plan.discountedFrom}</span>}
            </div>
            <p className="relative mt-1 text-[15px] font-semibold text-indigo-200">
              One-time payment · just ₹{perMonth} a month
              {saving > 0 && <span className="ml-2 rounded-full bg-[#22C55E]/20 text-[#86EFAC] px-2 py-px text-[13px] font-black">Save {saving}%</span>}
            </p>

            <button
              onClick={handleUnlockClick}
              className="relative mt-5 w-full py-3.5 rounded-full bg-gradient-to-b from-[#FEF3C7] via-[#FCD34D] to-[#F59E0B] text-[#3B0764] font-black text-base shadow-[0_4px_0_0_#B45309,0_0_22px_rgba(252,211,77,0.45)] active:translate-y-0.5 active:shadow-none cursor-pointer"
            >
              {hasPass ? 'Add 6 more months' : `Unlock Pro for ₹${plan.amount}`}
            </button>
            <p className="relative mt-3 flex items-center justify-center gap-1.5 text-[13px] font-semibold text-indigo-200/80">
              <Icon d={ICONS.lock} className="w-3.5 h-3.5" />
              {usesPlayBilling() ? 'Secure payment through Google Play' : 'Secure payment via Razorpay'} · No auto-renewal
            </p>
          </div>
        </section>

        {/* What's included */}
        <section>
          <h2 className="text-[17px] font-black text-slate-900 mb-3 px-1">Everything in Pro</h2>
          <div className="grid grid-cols-2 gap-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="rounded-[20px] bg-white border border-slate-100 shadow-sm p-3.5">
                <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#EDE9FE] to-[#FEF3C7] text-[#6D28D9] flex items-center justify-center">
                  <Icon d={ICONS[f.icon]} />
                </span>
                <p className="mt-2.5 text-[15px] font-black text-slate-900">{f.title}</p>
                <p className="text-[13px] font-semibold text-slate-500 leading-snug">{f.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Free vs Pro */}
        <section className="rounded-[24px] bg-white border border-slate-100 shadow-sm overflow-hidden">
          <div className="grid grid-cols-[1.4fr_1fr_1fr] items-center px-4 py-3 bg-slate-50 border-b border-slate-100 text-[13px] font-black uppercase tracking-wider">
            <span className="text-slate-400">Compare</span>
            <span className="text-center text-slate-500">Free</span>
            <span className="text-center text-[#6D28D9]">Pro</span>
          </div>
          {COMPARE.map(([label, free, pro]) => (
            <div key={label} className="grid grid-cols-[1.4fr_1fr_1fr] items-center px-4 py-3 border-b border-slate-100 last:border-0">
              <span className="text-[14px] font-bold text-slate-600">{label}</span>
              {[free, pro].map((v, i) => (
                <span key={i} className={`flex justify-center text-[14px] font-black ${i === 1 ? 'text-[#4C1D95]' : 'text-slate-500'}`}>
                  {v === true ? (
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center ${i === 1 ? 'bg-[#EDE9FE] text-[#6D28D9]' : 'bg-slate-100 text-slate-500'}`}>
                      <Icon d={ICONS.check} className="w-3.5 h-3.5" />
                    </span>
                  ) : v === false ? (
                    <span className="w-6 h-6 rounded-full bg-slate-50 text-slate-300 flex items-center justify-center"><Icon d={ICONS.x} className="w-3.5 h-3.5" /></span>
                  ) : v}
                </span>
              ))}
            </div>
          ))}
        </section>

        {/* FAQ */}
        <section>
          <h2 className="text-[17px] font-black text-slate-900 mb-3 px-1">Questions</h2>
          <div className="rounded-[24px] bg-white border border-slate-100 shadow-sm divide-y divide-slate-100">
            {faqList.map(([q, a], i) => (
              <div key={q}>
                <button
                  onClick={() => setOpenFaq(openFaq === i ? -1 : i)}
                  className="w-full flex items-center justify-between gap-3 px-4 py-3.5 text-left cursor-pointer"
                >
                  <span className="text-[15px] font-black text-slate-800">{q}</span>
                  <Icon d={ICONS.chevron} className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${openFaq === i ? 'rotate-180' : ''}`} />
                </button>
                {openFaq === i && <p className="px-4 pb-4 -mt-1 text-[14px] font-semibold text-slate-500 leading-relaxed">{a}</p>}
              </div>
            ))}
          </div>
        </section>

        {/* Payment history */}
        <section>
          <h2 className="text-[17px] font-black text-slate-900 mb-3 px-1">Payment history</h2>
          <div className="rounded-[24px] bg-white border border-slate-100 shadow-sm px-4">
            {loading && history.length === 0 ? (
              <p className="py-4 text-[15px] font-semibold text-slate-400">Loading…</p>
            ) : history.length === 0 ? (
              <p className="py-4 text-[15px] font-semibold text-slate-400">No payments yet.</p>
            ) : history.map((t) => (
              <div key={t._id} className="flex items-center gap-3 py-3 border-b border-slate-100 last:border-0">
                <span className="w-9 h-9 rounded-xl bg-[#FEF3C7] flex items-center justify-center shrink-0"><Crown className="w-5 h-5" /></span>
                <div className="flex-1 min-w-0">
                  <p className="text-[15px] font-black text-slate-900">6-Month Pass</p>
                  <p className="text-[13px] font-semibold text-slate-400">{formatDate(t.createdAt, true)} · {historySource(t)}</p>
                </div>
                <span className="text-[16px] font-black text-slate-900">₹{t.amount}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Payment help on WhatsApp */}
        <section className="rounded-[24px] bg-white border border-slate-100 shadow-sm p-4 flex items-center gap-3">
          <span className="w-11 h-11 rounded-2xl bg-[#DCFCE7] text-[#16A34A] flex items-center justify-center shrink-0">
            <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor" aria-hidden="true">
              <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.4.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.4.1-.7.3-.2.3-.9.9-.9 2.2s.9 2.5 1 2.7c.1.2 1.8 2.8 4.4 3.9 1.6.7 2.3.8 3.1.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.5-.3z" />
            </svg>
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-[15px] font-black text-slate-900">Need help with a payment?</p>
            <p className="text-[13px] font-semibold text-slate-500">Chat with us on WhatsApp</p>
          </div>
          <a
            href={`https://wa.me/918310532323?text=${encodeURIComponent(`Hi! I need help with my HoshiYaar Pro payment.${user?.phone ? ` My number is ${user.phone}.` : ''}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 inline-flex items-center gap-1.5 rounded-full bg-[#22C55E] hover:bg-[#16A34A] px-4 py-2 text-[15px] font-black text-white shadow-[0_3px_0_0_#15803D] active:translate-y-px active:shadow-none"
          >
            Chat now
          </a>
        </section>
      </div>

      <BottomNavigation />

      {showGuestVerify && (
        <GuestVerifyModal
          onClose={() => {
            setShowGuestVerify(false);
            refresh();
            loadData();
          }}
        />
      )}

      {showPaywall && (
        <PaywallModal
          isOpen={showPaywall}
          onClose={() => setShowPaywall(false)}
          onSuccess={() => {
            setShowPaywall(false);
            setSuccessMessage('Your 6-month pass is active. Enjoy every lesson!');
            loadData();
          }}
        />
      )}
    </div>
  );
}
