import React from 'react';

const pad = (n) => String(n).padStart(2, '0');

const Unit = ({ value, label, urgent }) => (
  <div className="flex flex-col items-center">
    <div className="relative w-[62px] h-[64px] rounded-2xl bg-gradient-to-b from-white/15 to-white/5 border border-white/15 shadow-[inset_0_1px_0_rgba(255,255,255,0.15),0_8px_18px_rgba(0,0,0,0.25)] flex items-center justify-center overflow-hidden">
      {/* split line, like a flip clock */}
      <span className="absolute left-0 right-0 top-1/2 h-px bg-black/25" aria-hidden="true" />
      <span
        key={value}
        className={`relative text-[30px] font-black tabular-nums leading-none animate-[countTick_0.35s_ease-out] ${
          urgent ? 'text-[#FDA4AF]' : 'bg-gradient-to-b from-[#FEF3C7] to-[#FBBF24] bg-clip-text text-transparent'
        }`}
      >
        {value}
      </span>
    </div>
    <span className="mt-1.5 text-[12px] font-black uppercase tracking-[0.12em] text-indigo-200">{label}</span>
  </div>
);

// Live trial countdown: hours, minutes and seconds in separate boxes
export default function LiveCountdown({ ms }) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const urgent = ms < 6 * 60 * 60 * 1000;

  return (
    <div className="flex items-start justify-center gap-2" role="timer" aria-label={`${h} hours ${m} minutes ${s} seconds left`}>
      <style>{'@keyframes countTick{0%{transform:translateY(-35%);opacity:0}100%{transform:translateY(0);opacity:1}}'}</style>
      <Unit value={pad(h)} label="Hours" urgent={urgent} />
      <span className="mt-[18px] text-2xl font-black text-[#FCD34D]/70">:</span>
      <Unit value={pad(m)} label="Mins" urgent={urgent} />
      <span className="mt-[18px] text-2xl font-black text-[#FCD34D]/70">:</span>
      <Unit value={pad(s)} label="Secs" urgent={urgent} />
    </div>
  );
}
