import React from 'react';
import { useAccess } from '../../../context/AccessContext.jsx';

const OPTIONS = [
  { id: '', label: 'Normal' },
  { id: 'running', label: 'Trial running' },
  { id: 'ended', label: 'Trial ended' },
  { id: 'pro', label: 'Pro' },
];

// Admin-only switch to see the app as a learner in the trial, or after it ends.
// It only changes what this device shows; the server still decides real access.
export default function TrialTestToggle({ className = '' }) {
  const { testView, setTestView, canUseTestView } = useAccess();
  if (!canUseTestView) return null;

  return (
    <div className={`rounded-[20px] bg-white border-2 border-dashed border-[#C4B5FD] p-3.5 ${className}`}>
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <p className="text-[14px] font-black text-[#3B0764]">🧪 Trial test view</p>
        <span className="text-[11px] font-black uppercase tracking-wider text-[#7C3AED] bg-[#F5F3FF] rounded-full px-2 py-0.5">Admin</span>
      </div>
      <div className="grid grid-cols-4 gap-1.5 rounded-2xl bg-[#F5F3FF] p-1">
        {OPTIONS.map((o) => {
          const active = (testView || '') === o.id;
          return (
            <button
              key={o.id || 'normal'}
              onClick={() => setTestView(o.id)}
              className={`rounded-xl py-2 text-[13px] font-black transition-all cursor-pointer ${
                active
                  ? 'bg-gradient-to-b from-[#A855F7] to-[#7C3AED] text-white shadow-[0_2px_0_0_#5B21B6]'
                  : 'text-[#4C1D95] hover:bg-white'
              }`}
            >
              {o.label}
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-[12px] font-semibold text-slate-500 leading-snug">
        {testView === 'pro'
          ? 'You are seeing the Pro pass with its days left (your real end date if this account bought it).'
          : testView === 'ended'
          ? 'Unplayed lessons now show a lock. Tap one on the Learn map to see the payment pop-up.'
          : testView === 'running'
            ? 'You are seeing a fresh 48-hour trial with the live countdown.'
            : 'Shows your real access. Only this device is affected.'}
      </p>
    </div>
  );
}
