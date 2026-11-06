import React from 'react';

// Purple "Play with Friends" card under the chapters, per the client's design; shares the app on WhatsApp
export default function PlayWithFriends({ onClick }) {
  return (
    <div className="mx-3 mt-5 mb-2">
      <button
        onClick={onClick}
        className="relative w-full overflow-hidden rounded-[18px] bg-gradient-to-br from-[#8B3FE8] via-[#7C2FE0] to-[#6A1FD0] border border-[#A78BFA]/40 shadow-[0_4px_0_#4C1D95,0_8px_18px_rgba(109,40,217,0.3)] active:translate-y-0.5 active:shadow-[0_2px_0_#4C1D95] transition-all text-left"
      >
        {/* Faint person silhouette and bubbles, as in the design */}
        <svg className="absolute right-6 -bottom-3 h-[115%] text-white/[0.12] pointer-events-none" viewBox="0 0 100 110" fill="currentColor" aria-hidden="true">
          <circle cx="50" cy="34" r="26" />
          <path d="M0 112c0-30 22-48 50-48s50 18 50 48z" />
        </svg>
        <span className="absolute -top-6 right-16 w-16 h-16 rounded-full bg-white/[0.08] pointer-events-none" aria-hidden="true" />
        <span className="absolute -top-3 -right-3 w-12 h-12 rounded-full bg-white/[0.08] pointer-events-none" aria-hidden="true" />

        <div className="relative flex items-center gap-3.5 py-3.5 pl-3.5 pr-10">
          <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shrink-0 shadow-sm">
            <svg viewBox="0 0 24 24" className="w-8 h-8 text-[#6D28D9]" fill="currentColor" aria-hidden="true">
              <circle cx="12" cy="8.5" r="3.2" />
              <path d="M5.8 18.5c0-3.2 2.8-5.4 6.2-5.4s6.2 2.2 6.2 5.4v.7H5.8z" />
              <circle cx="5.6" cy="9.8" r="2.3" opacity="0.75" />
              <path d="M1.5 18.2c0-2.3 1.8-3.9 4.2-3.9.6 0 1.1.1 1.6.3-1.2 1-1.9 2.4-2 3.9v.6H1.5z" opacity="0.75" />
              <circle cx="18.4" cy="9.8" r="2.3" opacity="0.75" />
              <path d="M22.5 18.2c0-2.3-1.8-3.9-4.2-3.9-.6 0-1.1.1-1.6.3 1.2 1 1.9 2.4 2 3.9v.6h3.8z" opacity="0.75" />
            </svg>
          </div>
          <div className="min-w-0">
            <div
              className="text-white text-[1.55rem] leading-none tracking-wide uppercase"
              style={{ fontFamily: "'Bangers', 'Barlow Condensed', Impact, sans-serif" }}
            >
              Play with Friends
            </div>
            <div className="font-dialogue text-[15px] text-white/90 leading-snug mt-1">
              Share with friends and see who plays more this week
            </div>
          </div>
        </div>

        <svg className="absolute right-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-white/80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
}
