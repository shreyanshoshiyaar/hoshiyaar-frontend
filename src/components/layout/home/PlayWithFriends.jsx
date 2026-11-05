import React from 'react';

const Gamepad = () => (
  <svg viewBox="0 0 64 44" className="w-10 h-7 shrink-0 drop-shadow-[0_2px_0_#4C1D95]" aria-hidden="true">
    <path d="M18 2h28c9 0 15 6 17 16l1 9c1 9-4 15-10 15-5 0-8-3-11-8H21c-3 5-6 8-11 8C4 42-1 36 0 27l1-9C3 8 9 2 18 2z" fill="#7C3AED" />
    <path d="M18 5h28c7 0 12 5 14 13" stroke="#A78BFA" strokeWidth="3" fill="none" strokeLinecap="round" />
    <rect x="12" y="17" width="12" height="4" rx="2" fill="#EDE9FE" />
    <rect x="16" y="13" width="4" height="12" rx="2" fill="#EDE9FE" />
    <circle cx="45" cy="15" r="3" fill="#FACC15" />
    <circle cx="51" cy="21" r="3" fill="#F472B6" />
    <circle cx="39" cy="21" r="3" fill="#34D399" />
    <circle cx="45" cy="27" r="3" fill="#60A5FA" />
  </svg>
);

// Short yellow "Play with Friends" pill, centred under the chapters; shares the app on WhatsApp
export default function PlayWithFriends({ onClick }) {
  return (
    <div className="mt-5 mb-2 flex justify-center">
      <button
        onClick={onClick}
        className="inline-flex items-center gap-2.5 rounded-full border-[3px] border-white bg-gradient-to-b from-[#FFF176] via-[#FDE047] to-[#FACC15] pl-4 pr-2.5 py-1.5 shadow-[inset_0_-3px_0_rgba(202,138,4,0.45),0_3px_0_0_#EAB308,0_6px_14px_rgba(234,179,8,0.35)] active:translate-y-px transition-transform"
      >
        <Gamepad />
        <span className="text-[18px] font-black text-[#4C1D95] tracking-tight whitespace-nowrap">Play with Friends</span>
        <span className="flex -space-x-2 shrink-0" aria-hidden="true">
          <span className="w-9 h-9 rounded-full bg-sky-100 border-2 border-white flex items-center justify-center text-lg">👦</span>
          <span className="w-9 h-9 rounded-full bg-pink-100 border-2 border-white flex items-center justify-center text-lg">👧</span>
        </span>
      </button>
    </div>
  );
}
