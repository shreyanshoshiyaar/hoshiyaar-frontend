import React from 'react';

// "All Chapters" button on the Learn dashboard headers. Gold face matches the "Go Pro" pill
// on the trial timer bar (features/Subscription/TrialTimerBar.jsx), with black text and a
// white arrow tile with a black arrow, and a gold glow. Every few seconds it does a small hop with a gold ring pulsing out, so it reads as the
// thing to tap.
// size: 'sm' for the compact mobile header, 'md' for the wide header.
// hideLabelOnMobile: on small screens show a short "Chapters" label (wide header).
export default function AllChaptersButton({ onClick, size = 'sm', hideLabelOnMobile = false, className = '' }) {
  const big = size === 'md';
  return (
    <span className={`relative inline-flex animate-[chapters-hop_4s_ease-in-out_infinite] ${className}`}>
      {/* soft gold glow */}
      <span aria-hidden className="pointer-events-none absolute -inset-[3px] rounded-[18px] bg-[#FCD34D]/45 blur-[7px]" />
      {/* gold ring that pulses out with each hop */}
      <span aria-hidden className="pointer-events-none absolute inset-0 rounded-2xl ring-[3px] ring-[#FDE68A] animate-[chapters-ring_4s_ease-out_infinite]" />
      <button
        type="button"
        onClick={onClick}
        aria-label="All Chapters"
        className={`group relative overflow-hidden flex items-center ${big ? 'gap-2.5 py-2 pl-5 pr-2 text-base' : 'gap-2 py-1.5 pl-4 pr-1.5 text-sm'}
          rounded-2xl font-black text-black cursor-pointer select-none
          bg-gradient-to-b from-[#FEF3C7] via-[#FCD34D] to-[#F59E0B] border-2 border-[#FEF3C7]
          shadow-[0_4px_0_#B45309,0_8px_18px_rgba(245,158,11,0.5)] hover:brightness-105 hover:-translate-y-px
          active:translate-y-[3px] active:shadow-[0_1px_0_#B45309,0_3px_8px_rgba(245,158,11,0.45)] transition-all`}
      >
        {/* light streak sweeping across */}
        <span aria-hidden className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/2 bg-gradient-to-r from-transparent via-white/80 to-transparent animate-[chapters-shine_4s_ease-in-out_infinite]" />
        <span className="relative leading-tight whitespace-nowrap">
          {hideLabelOnMobile ? (<><span className="sm:hidden">Chapters</span><span className="hidden sm:inline">All Chapters</span></>) : 'All Chapters'}
        </span>
        <span className={`relative inline-flex items-center justify-center rounded-xl bg-white text-black shadow-sm ring-1 ring-black/5 flex-shrink-0 ${big ? 'w-8 h-8' : 'w-7 h-7'}`}>
          <svg className={`${big ? 'w-5 h-5' : 'w-4 h-4'} animate-[chapters-arrow_4s_ease-in-out_infinite] group-hover:translate-x-0.5 transition-transform`} viewBox="0 0 20 20" fill="currentColor" aria-hidden>
            <path fillRule="evenodd" d="M7.3 4.3a1 1 0 011.4 0l5 5a1 1 0 010 1.4l-5 5a1 1 0 01-1.4-1.4L11.6 10 7.3 5.7a1 1 0 010-1.4z" clipRule="evenodd" />
          </svg>
        </span>
      </button>
    </span>
  );
}
