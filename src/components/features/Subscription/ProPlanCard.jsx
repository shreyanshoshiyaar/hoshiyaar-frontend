import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAccess, trialMsLeft, passTimeLeft } from '../../../context/AccessContext.jsx';
import { useShowPro } from '../../../hooks/useShowPro.js';

const formatDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

const hoursLeft = (ms) => {
  const totalMin = Math.floor(ms / 60000);
  const h = Math.floor(totalMin / 60);
  return h > 0 ? `${h}h ${String(totalMin % 60).padStart(2, '0')}m left` : `${totalMin % 60}m left`;
};

// Purple-and-gold card that opens the Pro page, with the learner's current status
export default function ProPlanCard({ className = '' }) {
  const navigate = useNavigate();
  const { access, now } = useAccess();
  if (!useShowPro()) return null;

  let status = 'Unlock every lesson for 6 months';
  if (access?.state === 'pass') status = `Pro active · ${passTimeLeft(access, now)?.text || `till ${formatDate(access.passExpiresAt)}`}`;
  else if (access?.state === 'trial_ended') status = 'Free trial ended · unlock for ₹99';
  else if (access?.state === 'trial_active' || access?.state === 'guest_limit' || (access?.state === 'trial_not_started' && trialMsLeft(access, now) != null)) {
    const ms = trialMsLeft(access, now);
    status = `Free trial · ${ms != null ? hoursLeft(ms) : ''}`;
  } else if (access?.state === 'trial_not_started') status = 'Free trial: 48 hours, starts with your first lesson';

  return (
    <button
      onClick={() => navigate('/subscription')}
      className={`w-full text-left rounded-[22px] p-[2px] bg-gradient-to-br from-[#FDE68A] via-[#D97706] to-[#FDE68A] shadow-[0_8px_20px_rgba(76,29,149,0.3)] active:scale-[0.99] transition-transform ${className}`}
    >
      <span className="relative flex items-center gap-3 overflow-hidden rounded-[20px] bg-gradient-to-br from-[#3B0764] via-[#4C1D95] to-[#1E1B4B] px-4 py-3">
        <span className="pointer-events-none absolute -top-8 -left-6 w-32 h-20 rounded-full bg-white/10 blur-2xl" aria-hidden="true" />
        <span className="relative text-3xl drop-shadow" aria-hidden="true">👑</span>
        <span className="relative flex-1 min-w-0">
          <span className="block text-[11px] font-black uppercase tracking-[0.18em] text-[#FCD34D]">HoshiYaar Pro</span>
          <span className="block text-sm font-black text-white leading-snug">{status}</span>
        </span>
        <span className="relative shrink-0 rounded-full bg-gradient-to-b from-[#FEF3C7] via-[#FCD34D] to-[#F59E0B] px-3 py-1 text-xs font-black text-[#3B0764] shadow-[0_2px_0_0_#B45309]">
          View →
        </span>
      </span>
    </button>
  );
}
