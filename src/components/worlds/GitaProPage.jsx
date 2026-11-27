import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useAccess } from '../../context/AccessContext.jsx';
import paymentService from '../../services/paymentService.js';
import { usesPlayBilling } from '../../services/billingService.js';
import { useWorlds } from '../../hooks/useWorlds.js';
import PaywallModal from '../features/Subscription/PaywallModal.jsx';
import GuestVerifyModal from '../forms/GuestVerifyModal.jsx';
import BottomNavigation from '../layout/BottomNavigation.jsx';
import { clarityEvent } from '../../utils/clarity.js';
import { LotusArt } from './WorldArt.jsx';
import { gitaChapterOpen } from './GitaOffer.jsx';

// The Gita chapters page (route /gita-pro): Gita is sold per chapter, ₹99 each, and a bought chapter stays open for
// good. Lists every chapter with Unlock / Unlocked, then what a chapter includes, questions and Gita payments.
// /gita-pro?chapter=<id>&buy=1 opens that chapter's checkout straight away. Saffron where Science Pro is purple.

const GITA_PLANS = ['gita_chapter', 'gita_pass_6m'];

const formatDate = (d, withTime = false) => {
  if (!d) return '';
  const x = new Date(d);
  if (isNaN(x.getTime())) return '';
  return x.toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', ...(withTime ? { hour: 'numeric', minute: '2-digit' } : {}) });
};
const historySource = (t) => {
  const v = String(t.experimentVariant || '');
  if (v.startsWith('google_play')) return v.endsWith('_test') ? 'Google Play (test)' : 'Google Play';
  if (v === 'mock_sandbox') return 'Sandbox test';
  return 'Razorpay';
};
const shortTitle = (t) => String(t || '').replace(/^\s*chapter\s*\d+\s*[:.\-–]\s*/i, '').replace(/\s*\(placeholder\)\s*$/i, '').trim();
const numberOf = (t, i) => (String(t || '').match(/chapter\s*(\d+)/i) || [])[1] || String(i + 1);

const Icon = ({ d, className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{d}</svg>
);
const ICONS = {
  book: <><path d="M2 4h6a4 4 0 0 1 4 4v13a3 3 0 0 0-3-3H2z" /><path d="M22 4h-6a4 4 0 0 0-4 4v13a3 3 0 0 1 3-3h7z" /></>,
  audio: <><path d="M11 5L6 9H2v6h4l5 4z" /><path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14" /></>,
  heart: <path d="M12 21s-7-4.4-9.3-9A5.3 5.3 0 0 1 12 6a5.3 5.3 0 0 1 9.3 6C19 16.6 12 21 12 21z" />,
  replay: <><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5" /></>,
  lock: <><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></>,
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  chevron: <path d="M6 9l6 6 6-6" />,
  back: <path d="M15 18l-6-6 6-6" />,
};

const FEATURES = [
  { icon: 'book', title: 'The whole chapter', text: 'Every lesson and shloka in it' },
  { icon: 'audio', title: 'Recorded audio', text: 'Every line, read aloud' },
  { icon: 'heart', title: 'Meaning made simple', text: 'Each shloka explained' },
  { icon: 'replay', title: 'Yours for good', text: 'No time limit, replay anytime' },
];

export default function GitaProPage() {
  useEffect(() => { clarityEvent('gita_paywall_seen'); }, []);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { access, refresh } = useAccess();
  const { gitaChapters, loading: chaptersLoading } = useWorlds();
  const g = access?.gita || {};

  const [userStatus, setUserStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState(null); // the chapter in the checkout
  const [showGuestVerify, setShowGuestVerify] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [openFaq, setOpenFaq] = useState(0);

  const loadData = () => {
    refresh();
    paymentService.getUserStatus().then(setUserStatus).catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(() => { loadData(); }, [user?._id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleBack = () => {
    if (window.history.state && typeof window.history.state.idx === 'number' && window.history.state.idx > 0) navigate(-1);
    else navigate('/gita', { replace: true });
  };
  const unlock = (ch) => {
    if (!ch) return;
    if (user?.isGuest || access?.isGuest) { setShowGuestVerify(true); return; }
    setBuying(ch);
  };

  // Straight to a chapter's checkout when asked (?chapter=<id>&buy=1), once the chapters are known
  const [params, setParams] = useSearchParams();
  useEffect(() => {
    if (params.get('buy') !== '1' || !access || chaptersLoading) return;
    const id = params.get('chapter');
    const next = new URLSearchParams(params);
    next.delete('buy');
    next.delete('chapter');
    setParams(next, { replace: true });
    const ch = gitaChapters.find((c) => String(c._id) === String(id)) || gitaChapters.find((c) => !gitaChapterOpen(g, c._id));
    if (ch && !gitaChapterOpen(g, ch._id)) unlock(ch);
  }, [params, access?.state, chaptersLoading]); // eslint-disable-line react-hooks/exhaustive-deps

  const allOpen = Boolean(g.hasPass);
  const price = Number(g.price) || 99;
  const was = Number(g.originalPrice) || 0;
  const saving = was > price ? Math.round((1 - price / was) * 100) : 0;
  const free = g.freeLessons ?? 5;
  const ownedCount = gitaChapters.filter((c) => gitaChapterOpen(g, c._id)).length;
  const titleOf = (id) => {
    const i = gitaChapters.findIndex((c) => String(c._id) === String(id));
    return i >= 0 ? `Chapter ${numberOf(gitaChapters[i].title, i)}: ${shortTitle(gitaChapters[i].title)}` : 'Gita chapter';
  };
  const history = (userStatus?.paymentHistory || []).filter((t) => GITA_PLANS.includes(t.planCode));

  const statusPill = allOpen
    ? 'Every chapter is open for you'
    : ownedCount ? `${ownedCount} of ${gitaChapters.length} ${gitaChapters.length === 1 ? 'chapter' : 'chapters'} unlocked` : `First ${free} lessons free`;

  const faq = [
    ['How does it work?', `The first ${free} Gita lessons are free. After that, each chapter is unlocked on its own for ₹${price}, and stays open for good.`],
    ['Does it renew or expire?', 'No. It is a one-time payment per chapter. There is no time limit and nothing is charged again.'],
    ['Is it separate from Science Pro?', 'Yes. Gita chapters are bought here, and Science Pro opens the Science world. Each is bought on its own.'],
    ['Who is it for?', 'Every student, whatever their class. The Gita world is the same for everyone.'],
    ['How can I pay?', 'In the Android app, through Google Play. On the website, through Razorpay with UPI, cards or netbanking.'],
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FFF7ED] to-[#FFFBF5] font-sans pb-28">
      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#431407] via-[#7C2D12] to-[#C2410C] rounded-b-[32px] px-5 pt-4 pb-16">
        <span className="pointer-events-none absolute -top-16 -right-10 w-56 h-56 rounded-full bg-[#FDBA74]/25 blur-3xl" aria-hidden="true" />
        <span className="pointer-events-none absolute top-24 -left-16 w-48 h-48 rounded-full bg-[#F59E0B]/25 blur-3xl" aria-hidden="true" />
        <div className="relative max-w-xl mx-auto">
          <button onClick={handleBack} aria-label="Back" className="w-9 h-9 rounded-full bg-white/10 border border-white/15 text-white flex items-center justify-center cursor-pointer">
            <Icon d={ICONS.back} />
          </button>
          <div className="mt-3 flex flex-col items-center text-center">
            <LotusArt className="w-20 h-20" />
            <h1 className="mt-1 text-[28px] font-black text-white tracking-tight leading-none">
              Gita <span className="bg-gradient-to-b from-[#FEF3C7] to-[#F59E0B] bg-clip-text text-transparent">chapters</span>
            </h1>
            <p className="mt-2 text-[15px] font-semibold text-orange-100">
              {allOpen ? 'Every chapter. Every shloka.' : <>₹{price} per chapter{saving > 0 && <span className="ml-1.5 text-white/55 line-through">₹{was}</span>} · yours for good</>}
            </p>
            <p className="mt-4 text-[17px] font-black text-[#FDE68A]">{statusPill}</p>
          </div>
        </div>
      </div>

      <div className="relative max-w-xl mx-auto px-4 -mt-10 space-y-5">
        {successMessage && (
          <div className="bg-green-50 border border-green-200 text-green-800 text-[15px] font-bold rounded-2xl px-4 py-3">{successMessage}</div>
        )}

        {/* The chapters, each unlocked on its own */}
        <section className="rounded-[24px] bg-white shadow-[0_12px_30px_rgba(124,45,18,0.12)] border border-white px-4 pt-4 pb-1">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-[17px] font-black text-slate-900">Chapters</h2>
            {!allOpen && <span className="text-[12px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#FFF7ED] text-[#C2410C]">₹{price} each</span>}
          </div>
          {chaptersLoading && <p className="py-4 text-[15px] font-semibold text-slate-400">Loading…</p>}
          {!chaptersLoading && gitaChapters.length === 0 && <p className="py-4 text-[15px] font-semibold text-slate-400">Gita chapters are coming soon.</p>}
          {gitaChapters.map((ch, i) => {
            const open = gitaChapterOpen(g, ch._id);
            return (
              <div key={ch._id} className="flex items-center gap-3 py-3 border-b border-slate-100 last:border-0">
                <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#FB923C] to-[#EA580C] text-white font-black flex items-center justify-center text-[15px] shrink-0">{numberOf(ch.title, i)}</span>
                <button type="button" onClick={() => navigate(`/learn?chapterId=${encodeURIComponent(ch._id)}&world=gita`)} className="flex-1 min-w-0 text-left cursor-pointer">
                  <span className="block text-[15px] font-black text-slate-900 truncate">{shortTitle(ch.title) || `Chapter ${i + 1}`}</span>
                  <span className="block text-[13px] font-semibold text-slate-400">
                    {ch.lessons} {ch.lessons === 1 ? 'lesson' : 'lessons'}
                    {ch.isPublished === false && ' · Draft'}
                  </span>
                </button>
                {open ? (
                  <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-green-50 text-green-700 px-3 py-1.5 text-[13px] font-black">
                    <Icon d={ICONS.check} className="w-3.5 h-3.5" /> {allOpen ? 'Open' : 'Unlocked'}
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => unlock(ch)}
                    className="shrink-0 rounded-full bg-gradient-to-b from-[#FEF3C7] via-[#FCD34D] to-[#F59E0B] px-3.5 py-1.5 text-[13px] font-black text-[#7C2D12] shadow-[0_2px_0_0_#B45309] active:translate-y-px active:shadow-none cursor-pointer"
                  >
                    Unlock ₹{price}
                  </button>
                )}
              </div>
            );
          })}
          {!allOpen && (
            <p className="py-3 flex items-center justify-center gap-1.5 text-[13px] font-semibold text-slate-400">
              <Icon d={ICONS.lock} className="w-3.5 h-3.5" />
              {usesPlayBilling() ? 'Secure payment through Google Play' : 'Secure payment via Razorpay'} · One-time, no renewal
            </p>
          )}
        </section>

        {/* What a chapter includes */}
        <section>
          <h2 className="text-[17px] font-black text-slate-900 mb-3 px-1">Every chapter you unlock</h2>
          <div className="grid grid-cols-2 gap-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="rounded-[20px] bg-white border border-orange-100 shadow-sm p-3.5">
                <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#FFEDD5] to-[#FEF3C7] text-[#C2410C] flex items-center justify-center">
                  <Icon d={ICONS[f.icon]} />
                </span>
                <p className="mt-2.5 text-[15px] font-black text-slate-900">{f.title}</p>
                <p className="text-[13px] font-semibold text-slate-500 leading-snug">{f.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Science Pro is separate */}
        <button
          type="button"
          onClick={() => navigate('/subscription')}
          className="w-full rounded-[20px] bg-white border border-blue-100 shadow-sm p-3.5 flex items-center gap-3 text-left cursor-pointer active:scale-[0.99] transition-transform"
        >
          <span className="w-10 h-10 rounded-xl bg-blue-50 text-[#1D4ED8] flex items-center justify-center shrink-0" aria-hidden="true"><Icon d={ICONS.book} /></span>
          <span className="flex-1 min-w-0">
            <span className="block text-[15px] font-black text-slate-900">Looking for Science Pro?</span>
            <span className="block text-[13px] font-semibold text-slate-500">It's a separate pass for the Science world</span>
          </span>
          <span className="text-slate-400 text-lg" aria-hidden="true">›</span>
        </button>

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
            href={`https://wa.me/918310532323?text=${encodeURIComponent(`Hi! I need help with my Gita chapter payment.${user?.phone ? ` My number is ${user.phone}.` : ''}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 inline-flex items-center gap-1.5 rounded-full bg-[#22C55E] hover:bg-[#16A34A] px-4 py-2 text-[15px] font-black text-white shadow-[0_3px_0_0_#15803D] active:translate-y-px active:shadow-none"
          >
            Chat now
          </a>
        </section>

        {/* Questions */}
        <section>
          <h2 className="text-[17px] font-black text-slate-900 mb-3 px-1">Questions</h2>
          <div className="rounded-[24px] bg-white border border-slate-100 shadow-sm divide-y divide-slate-100">
            {faq.map(([q, a], i) => (
              <div key={q}>
                <button onClick={() => setOpenFaq(openFaq === i ? -1 : i)} className="w-full flex items-center justify-between gap-3 px-4 py-3.5 text-left cursor-pointer">
                  <span className="text-[15px] font-black text-slate-800">{q}</span>
                  <Icon d={ICONS.chevron} className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${openFaq === i ? 'rotate-180' : ''}`} />
                </button>
                {openFaq === i && <p className="px-4 pb-4 -mt-1 text-[14px] font-semibold text-slate-500 leading-relaxed">{a}</p>}
              </div>
            ))}
          </div>
        </section>

        {/* Gita payments */}
        <section>
          <h2 className="text-[17px] font-black text-slate-900 mb-3 px-1">Gita payments</h2>
          <div className="rounded-[24px] bg-white border border-slate-100 shadow-sm px-4">
            {loading && history.length === 0 ? (
              <p className="py-4 text-[15px] font-semibold text-slate-400">Loading…</p>
            ) : history.length === 0 ? (
              <p className="py-4 text-[15px] font-semibold text-slate-400">No Gita payments yet.</p>
            ) : history.map((t) => (
              <div key={t._id} className="flex items-center gap-3 py-3 border-b border-slate-100 last:border-0">
                <span className="w-9 h-9 rounded-xl bg-[#FFEDD5] text-[#C2410C] flex items-center justify-center shrink-0" aria-hidden="true"><Icon d={ICONS.book} className="w-4 h-4" /></span>
                <div className="flex-1 min-w-0">
                  <p className="text-[15px] font-black text-slate-900 truncate">{t.planCode === 'gita_pass_6m' ? 'Gita Pro · 6 months' : t.gitaChapterId ? titleOf(t.gitaChapterId) : 'Gita chapter'}</p>
                  <p className="text-[13px] font-semibold text-slate-400">{formatDate(t.createdAt, true)} · {historySource(t)}</p>
                </div>
                <span className="text-[16px] font-black text-slate-900">₹{t.amount}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <BottomNavigation />

      {showGuestVerify && (
        <GuestVerifyModal onClose={() => { setShowGuestVerify(false); loadData(); }} />
      )}
      {buying && (
        <PaywallModal
          world="gita"
          chapterId={String(buying._id)}
          chapterTitle={titleOf(buying._id)}
          isOpen
          onClose={() => setBuying(null)}
          onSuccess={() => {
            const ch = buying;
            setBuying(null);
            setSuccessMessage(`${titleOf(ch._id)} is unlocked. Enjoy every shloka!`);
            loadData();
          }}
        />
      )}
    </div>
  );
}
