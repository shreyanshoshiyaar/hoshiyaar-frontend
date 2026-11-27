import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAccess, trialMsLeft } from '../../context/AccessContext.jsx';
import { useServerNow } from '../../hooks/useServerNow.js';

// Plans: Science Pro (6 months) and Gita chapters (₹99 each, for good), bought separately.
// Each card opens that world's Pro page (Science: /subscription, Gita: /gita-pro), where it is bought.
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '');
const hoursLeft = (ms) => (ms == null ? null : Math.max(0, Math.ceil(ms / 3600000)));

const Card = ({ tone, title, price, was, months = 6, term, status, perks, action, onAction, disabled, highlight, ribbon }) => {
  const T = {
    blue: { ring: 'border-[#93C5FD]', head: 'text-[#1D4ED8]', btn: 'from-[#3B82F6] to-[#1D4ED8] shadow-[0_4px_0_0_#1E3A8A]', chip: 'bg-blue-50 text-blue-800' },
    orange: { ring: 'border-[#FDBA74]', head: 'text-[#C2410C]', btn: 'from-[#FB923C] to-[#EA580C] shadow-[0_4px_0_0_#9A3412]', chip: 'bg-orange-50 text-orange-800' },
    purple: { ring: 'border-[#C4B5FD]', head: 'text-[#6D28D9]', btn: 'from-[#A855F7] to-[#7C3AED] shadow-[0_4px_0_0_#5B21B6]', chip: 'bg-violet-50 text-violet-800' },
  }[tone];
  return (
    <div className={`relative rounded-[22px] bg-white border-2 ${T.ring} p-4 ${highlight ? 'ring-4 ring-offset-2 ring-amber-300' : ''}`}>
      {ribbon && <span className="absolute -top-3 right-4 rounded-full bg-gradient-to-r from-[#FDE68A] to-[#F59E0B] px-3 py-0.5 text-[11px] font-black uppercase tracking-wide text-[#3B0764] shadow">{ribbon}</span>}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className={`text-[13px] font-black uppercase tracking-wider ${T.head}`}>{title}</p>
          <p className="mt-1 flex items-baseline gap-2">
            <span className="text-[30px] font-black text-[#101F33] leading-none">₹{price}</span>
            {was > price && <span className="text-[15px] font-bold text-slate-400 line-through">₹{was}</span>}
          </p>
          <p className="mt-0.5 text-[12.5px] font-semibold text-slate-500">{term || `${months} months · one-time payment`}</p>
        </div>
        {status && <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11.5px] font-black ${T.chip}`}>{status}</span>}
      </div>
      <ul className="mt-3 space-y-1">
        {perks.map((p) => (
          <li key={p} className="flex items-start gap-2 text-[13.5px] font-semibold text-slate-700">
            <span className="mt-0.5 w-4 h-4 rounded-full bg-green-500 text-white flex items-center justify-center text-[10px] shrink-0" aria-hidden="true">✓</span>{p}
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={onAction}
        disabled={disabled}
        className={`mt-4 w-full rounded-full bg-gradient-to-b ${T.btn} py-3 text-[15px] font-black text-white active:translate-y-0.5 active:shadow-none disabled:opacity-50 disabled:shadow-none cursor-pointer`}
      >
        {action}
      </button>
    </div>
  );
};

export default function PlansPage({ isMobile = true }) {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const focus = params.get('focus') || '';
  const { access } = useAccess();
  const now = useServerNow();
  const g = access?.gita || {};
  const sciencePrice = Number(access?.plan?.amount) || 99;
  const scienceWas = Number(access?.plan?.discountedFrom) || 599;
  const gitaPrice = Number(g.price) || 99;

  const st = access?.state;
  const scienceStatus = st === 'pass'
    ? `Active till ${fmtDate(access?.passExpiresAt)}`
    : st === 'trial_active' || st === 'trial_not_started'
      ? (hoursLeft(trialMsLeft(access, now)) != null ? `Trial · ${hoursLeft(trialMsLeft(access, now))}h left` : 'Free trial')
      : st === 'trial_ended' ? 'Trial ended' : st === 'open' ? 'All open' : '';
  // Everything open (admin, or the paywall switched off): nothing to buy, say so plainly
  const allOpen = st === 'open';
  const gitaOwned = (g.ownedChapters || []).length;
  const gitaStatus = g.hasPass ? 'All open' : gitaOwned ? `${gitaOwned} ${gitaOwned === 1 ? 'chapter' : 'chapters'} unlocked` : `${g.freeLessons ?? 5} lessons free`;

  return (
    <div className="w-full font-sans bg-[#F5F3FF] min-h-full" style={isMobile ? { paddingBottom: 'calc(96px + env(safe-area-inset-bottom, 0px))' } : undefined}>
      <div className={isMobile ? 'px-4 pt-4' : 'max-w-3xl mx-auto pt-4'}>
        <h1 className="text-[24px] font-black text-[#101F33]">Plans</h1>
        <p className="text-[14px] font-semibold text-slate-500">Each world is bought on its own.</p>

        <div className="mt-5 space-y-5">
          <Card
            tone="blue"
            title="Science Pro"
            price={sciencePrice}
            was={scienceWas}
            status={scienceStatus}
            highlight={focus === 'science'}
            perks={['Every Science chapter and lesson', 'Stories, boards, quizzes and revision', 'Your class, plus every other class']}
            action={st === 'pass' ? 'See my Science Pro' : allOpen ? 'See Science Pro' : `Get Science Pro ₹${sciencePrice}`}
            onAction={() => navigate('/subscription')}
          />
          <Card
            tone="orange"
            title="Gita chapters"
            price={gitaPrice}
            was={Number(g.originalPrice) || 599}
            term="per chapter · pay once, yours for good"
            status={gitaStatus}
            highlight={focus === 'gita'}
            perks={['Every lesson and shloka in the chapter', 'Recorded audio for every line', 'For every class']}
            action={g.hasPass ? 'See Gita chapters' : `Unlock chapters ₹${gitaPrice} each`}
            onAction={() => navigate('/gita-pro')}
          />
        </div>
        <p className="mt-5 text-center text-[12px] font-semibold text-slate-400">No auto-renewal. Lessons you played stay open.</p>
      </div>
    </div>
  );
}
