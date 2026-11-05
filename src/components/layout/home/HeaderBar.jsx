import React from 'react';

const LOGO_URL = 'https://res.cloudinary.com/imq5966f/image/upload/v1791543780/img-to-link/bihseec7aigbmau4amnd.png';

// Dark blue pill: icon on the left, value over label on the right
const Badge = ({ icon, value, label }) => (
  <span className="flex items-center gap-1 rounded-full bg-gradient-to-b from-[#2B4FB8] to-[#1A3184] border-2 border-[#93C5FD]/70 pl-1 pr-2.5 py-0.5 shadow-[0_2px_4px_rgba(26,49,132,0.35)]">
    <span className="w-6 h-6 rounded-full flex items-center justify-center text-[15px] leading-none shrink-0">{icon}</span>
    <span className="flex flex-col items-center leading-[1.1]">
      <span className="text-[11px] font-black text-white whitespace-nowrap">{value}</span>
      <span className="text-[10px] font-bold text-white/90 whitespace-nowrap">{label}</span>
    </span>
  </span>
);

// Logo plus streak / stars / rank. No profile or notification icons, per the client's spec.
export default function HeaderBar({ stars, myRank, myStreak }) {
  return (
    <div className="flex items-center justify-between gap-1.5 px-3 pt-2.5 pb-1">
      <img src={LOGO_URL} alt="HoshiYaar" className="h-9 w-auto min-w-0 shrink" />
      <div className="flex items-center gap-1.5 shrink-0">
        <Badge icon="🔥" value={`${myStreak} ${myStreak === 1 ? 'Day' : 'Days'}`} label="Streak" />
        <Badge icon="⭐" value={stars === null ? '…' : Number(stars).toLocaleString('en-IN')} label="Stars" />
        <Badge icon="👑" value={myRank === '-' ? '-' : `#${myRank}`} label="Rank" />
      </div>
    </div>
  );
}
