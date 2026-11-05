import React from 'react';
import squadCharacters from '../../../assets/images/solve_squad_characters.webp';

const CONFETTI = [
  ['5%', '18%', '#F43F5E', 'rotate-12'], ['16%', '4%', '#FACC15', '-rotate-12'], ['86%', '8%', '#8B5CF6', 'rotate-45'],
  ['94%', '34%', '#22C55E', 'rotate-12'], ['2%', '48%', '#3B82F6', '-rotate-45'], ['70%', '0%', '#FB923C', 'rotate-6'],
  ['46%', '2%', '#EC4899', '-rotate-6'],
];

// Solve Squad: the characters stand straight on the page (no banner box), with the
// title and ribbon underneath, as in the client's design.
export default function HeroSection() {
  return (
    <div className="relative mx-3 mt-2 flex flex-col items-center">
      {CONFETTI.map(([left, top, color, rot], i) => (
        <span key={i} className={`absolute w-2 h-3 rounded-sm ${rot}`} style={{ left, top, background: color }} aria-hidden="true" />
      ))}
      {/* soft glow so the characters don't float on a flat colour */}
      <div className="absolute left-1/2 top-[38%] -translate-x-1/2 w-[85%] h-[55%] rounded-full bg-white/70 blur-2xl" aria-hidden="true" />

      <img src={squadCharacters} alt="Solve Squad" className="relative w-[96%] h-auto drop-shadow-[0_6px_8px_rgba(76,29,149,0.18)]" />

      <h1
        className="relative -mt-2 text-[2.7rem] leading-none tracking-wide text-[#FACC15]"
        style={{
          fontFamily: "'Bangers', 'Barlow Condensed', Impact, sans-serif",
          WebkitTextStroke: '2px #4C1D95',
          textShadow: '0 4px 0 #6D28D9, 0 6px 8px rgba(76,29,149,0.45)',
        }}
      >
        SOLVE SQUAD
      </h1>
      <span className="relative mt-1 flex items-center gap-1.5 whitespace-nowrap rounded-full bg-[#7E22CE] px-4 py-1 text-[12px] font-black text-white shadow-[0_3px_0_0_#4C1D95]">
        Learn <span className="text-[#FACC15]">★</span> Play <span className="text-[#FACC15]">★</span> Earn Rewards
      </span>
    </div>
  );
}
