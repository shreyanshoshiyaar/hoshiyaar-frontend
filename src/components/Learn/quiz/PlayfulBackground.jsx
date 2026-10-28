import React from 'react';

/**
 * PlayfulBackground
 * Renders dynamic, cheerful pastel gradients and normal, subtle science & math doodles
 * that change on each card index (0, 1, 2, 3, 4, 5...) so every question feels fresh and lively!
 */

const PALETTES = [
  // 0: Sunny Citrus & Peach
  {
    gradient: 'from-[#FFF8F0] via-[#FEF3C7] to-[#F0FDF4]',
    glow1: 'bg-[#FDE68A]/35',
    glow2: 'bg-[#FDBA74]/25',
    glow3: 'bg-[#BBF7D0]/30',
    glow4: 'bg-[#DDD6FE]/20',
    doodle1Color: 'text-amber-500/30',
    doodle2Color: 'text-orange-400/30',
    doodle3Color: 'text-emerald-500/30',
    doodle4Color: 'text-sky-400/30',
    starColor: 'text-amber-400/40',
  },
  // 1: Fresh Mint & Sky Blue
  {
    gradient: 'from-[#F0FDF4] via-[#E0F2FE] to-[#F5F3FF]',
    glow1: 'bg-[#86EFAC]/30',
    glow2: 'bg-[#7DD3FC]/35',
    glow3: 'bg-[#C4B5FD]/25',
    glow4: 'bg-[#FDE047]/20',
    doodle1Color: 'text-teal-500/30',
    doodle2Color: 'text-sky-500/30',
    doodle3Color: 'text-indigo-400/30',
    doodle4Color: 'text-emerald-400/30',
    starColor: 'text-sky-400/40',
  },
  // 2: Berry Lavender & Blossom Rose
  {
    gradient: 'from-[#FAF5FF] via-[#FCE7F3] to-[#EFF6FF]',
    glow1: 'bg-[#C084FC]/30',
    glow2: 'bg-[#F472B6]/30',
    glow3: 'bg-[#93C5FD]/25',
    glow4: 'bg-[#FED7AA]/25',
    doodle1Color: 'text-purple-500/30',
    doodle2Color: 'text-rose-400/30',
    doodle3Color: 'text-violet-500/30',
    doodle4Color: 'text-pink-400/30',
    starColor: 'text-rose-400/40',
  },
  // 3: Aquamarine & Electric Lime
  {
    gradient: 'from-[#ECFEFF] via-[#F0FDF4] to-[#FEF9C3]',
    glow1: 'bg-[#67E8F9]/30',
    glow2: 'bg-[#6EE7B7]/30',
    glow3: 'bg-[#FDE047]/30',
    glow4: 'bg-[#A7F3D0]/25',
    doodle1Color: 'text-cyan-500/30',
    doodle2Color: 'text-emerald-500/30',
    doodle3Color: 'text-amber-500/30',
    doodle4Color: 'text-teal-400/30',
    starColor: 'text-emerald-400/40',
  },
  // 4: Coral Sunrise & Mango
  {
    gradient: 'from-[#FFF1F2] via-[#FFFBEB] to-[#F0FDFA]',
    glow1: 'bg-[#FB7185]/25',
    glow2: 'bg-[#FBBF24]/30',
    glow3: 'bg-[#5EEAD4]/25',
    glow4: 'bg-[#FDA4AF]/25',
    doodle1Color: 'text-rose-500/30',
    doodle2Color: 'text-amber-500/30',
    doodle3Color: 'text-teal-500/30',
    doodle4Color: 'text-orange-400/30',
    starColor: 'text-amber-400/40',
  },
  // 5: Dreamy Periwinkle & Lilac
  {
    gradient: 'from-[#EEF2FF] via-[#FAF5FF] to-[#FDF4FF]',
    glow1: 'bg-[#A5B4FC]/30',
    glow2: 'bg-[#F0ABFC]/25',
    glow3: 'bg-[#38BDF8]/25',
    glow4: 'bg-[#C7D2FE]/30',
    doodle1Color: 'text-indigo-500/30',
    doodle2Color: 'text-fuchsia-400/30',
    doodle3Color: 'text-sky-500/30',
    doodle4Color: 'text-purple-400/30',
    starColor: 'text-indigo-400/40',
  },
];

const PlayfulBackground = ({ isHotZone = false, cardIndex = 0, children, className = "" }) => {
  if (isHotZone) {
    return (
      <div className={`relative w-full h-full bg-[#140805] text-white overflow-hidden ${className}`}>
        <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full bg-orange-600/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full bg-red-600/15 blur-3xl pointer-events-none" />
        <span className="absolute top-12 left-6 text-orange-400/40 text-base pointer-events-none select-none">🔥</span>
        <span className="absolute top-36 right-8 text-amber-400/30 text-xs pointer-events-none select-none">⚡</span>
        <span className="absolute bottom-24 left-8 text-orange-400/30 text-sm pointer-events-none select-none">✨</span>
        <span className="absolute bottom-16 right-10 text-red-400/30 text-base pointer-events-none select-none">💥</span>
        <div className="relative z-10 w-full h-full flex flex-col justify-between items-center select-none overflow-hidden">
          {children}
        </div>
      </div>
    );
  }

  // Pick palette based on card index
  const safeIdx = Math.abs(parseInt(cardIndex, 10) || 0);
  const palette = PALETTES[safeIdx % PALETTES.length];
  const variant = safeIdx % 4; // 4 doodle arrangement variants

  return (
    <div className={`relative w-full h-full bg-gradient-to-br ${palette.gradient} text-slate-800 overflow-hidden transition-colors duration-500 ${className}`}>
      {/* Dynamic Glowing Ambient Blobs */}
      <div className={`absolute -top-16 -left-16 w-64 h-64 rounded-full ${palette.glow1} blur-3xl pointer-events-none`} />
      <div className={`absolute top-1/4 -right-20 w-72 h-72 rounded-full ${palette.glow2} blur-3xl pointer-events-none`} />
      <div className={`absolute bottom-1/3 -left-20 w-64 h-64 rounded-full ${palette.glow3} blur-3xl pointer-events-none`} />
      <div className={`absolute -bottom-16 -right-16 w-72 h-72 rounded-full ${palette.glow4} blur-3xl pointer-events-none`} />

      {/* Decorative Doodles - normal cute sizes (28px - 36px) placed gently at margins */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
        {variant === 0 && (
          <>
            {/* Atom top-right */}
            <svg style={{ width: '34px', height: '34px' }} className={`absolute top-10 right-4 ${palette.doodle1Color} transform rotate-12`} viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2.5">
              <ellipse cx="50" cy="50" rx="42" ry="16" transform="rotate(30 50 50)" />
              <ellipse cx="50" cy="50" rx="42" ry="16" transform="rotate(-30 50 50)" />
              <ellipse cx="50" cy="50" rx="42" ry="16" transform="rotate(90 50 50)" />
              <circle cx="50" cy="50" r="4.5" fill="currentColor" />
            </svg>
            {/* Beaker top-left */}
            <svg style={{ width: '28px', height: '28px' }} className={`absolute top-14 left-4 ${palette.doodle2Color} transform -rotate-12`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 2v7.31L4.62 18.5A2 2 0 0 0 6.34 22h11.32a2 2 0 0 0 1.72-3.5L14 9.31V2" />
              <line x1="8.5" y1="2" x2="15.5" y2="2" />
              <line x1="7" y1="16" x2="17" y2="16" />
            </svg>
            {/* Planet Saturn bottom-left */}
            <svg style={{ width: '32px', height: '32px' }} className={`absolute bottom-20 left-4 ${palette.doodle3Color} transform rotate-[-20deg]`} viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2.2">
              <circle cx="32" cy="32" r="16" />
              <ellipse cx="32" cy="32" rx="30" ry="8" transform="rotate(-25 32 32)" />
            </svg>
            {/* Lightbulb bottom-right */}
            <svg style={{ width: '28px', height: '28px' }} className={`absolute bottom-20 right-5 ${palette.doodle4Color} transform rotate-6`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18h6" />
              <path d="M10 22h4" />
              <path d="M12 2a7 7 0 0 0-7 7c0 2.5 1.5 4.5 3 6h8c1.5-1.5 3-3.5 3-6a7 7 0 0 0-7-7z" />
            </svg>
          </>
        )}

        {variant === 1 && (
          <>
            {/* Lightbulb top-right */}
            <svg style={{ width: '28px', height: '28px' }} className={`absolute top-12 right-5 ${palette.doodle1Color} transform rotate-[-10deg]`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18h6" />
              <path d="M10 22h4" />
              <path d="M12 2a7 7 0 0 0-7 7c0 2.5 1.5 4.5 3 6h8c1.5-1.5 3-3.5 3-6a7 7 0 0 0-7-7z" />
            </svg>
            {/* Magnifying Glass top-left */}
            <svg style={{ width: '28px', height: '28px' }} className={`absolute top-12 left-5 ${palette.doodle2Color} transform rotate-15`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <circle cx="10" cy="10" r="7" />
              <line x1="15" y1="15" x2="21" y2="21" />
            </svg>
            {/* DNA double helix bottom-right */}
            <svg style={{ width: '22px', height: '44px' }} className={`absolute bottom-20 right-5 ${palette.doodle3Color} transform rotate-12`} viewBox="0 0 40 80" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M 10 10 Q 30 25 10 40 Q 30 55 10 70" />
              <path d="M 30 10 Q 10 25 30 40 Q 10 55 30 70" />
              <line x1="13" y1="18" x2="27" y2="18" strokeDasharray="2 2" />
              <line x1="13" y1="48" x2="27" y2="48" strokeDasharray="2 2" />
            </svg>
            {/* Science Atom bottom-left */}
            <svg style={{ width: '32px', height: '32px' }} className={`absolute bottom-20 left-5 ${palette.doodle4Color} transform -rotate-15`} viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2.5">
              <ellipse cx="50" cy="50" rx="42" ry="16" transform="rotate(30 50 50)" />
              <ellipse cx="50" cy="50" rx="42" ry="16" transform="rotate(-30 50 50)" />
              <circle cx="50" cy="50" r="4.5" fill="currentColor" />
            </svg>
          </>
        )}

        {variant === 2 && (
          <>
            {/* Saturn top-left */}
            <svg style={{ width: '32px', height: '32px' }} className={`absolute top-12 left-4 ${palette.doodle1Color} transform rotate-[-15deg]`} viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2.2">
              <circle cx="32" cy="32" r="16" />
              <ellipse cx="32" cy="32" rx="30" ry="8" transform="rotate(-25 32 32)" />
            </svg>
            {/* Beaker / Test Tube top-right */}
            <svg style={{ width: '28px', height: '28px' }} className={`absolute top-12 right-5 ${palette.doodle2Color} transform rotate-12`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 2v7.31L4.62 18.5A2 2 0 0 0 6.34 22h11.32a2 2 0 0 0 1.72-3.5L14 9.31V2" />
              <line x1="8.5" y1="2" x2="15.5" y2="2" />
            </svg>
            {/* Math Plus bottom-left */}
            <svg style={{ width: '22px', height: '22px' }} className={`absolute bottom-24 left-6 ${palette.doodle3Color}`} viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 11h-6V5h-2v6H5v2h6v6h2v-6h6z" />
            </svg>
            {/* Atom bottom-right */}
            <svg style={{ width: '34px', height: '34px' }} className={`absolute bottom-20 right-5 ${palette.doodle4Color} transform rotate-45`} viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2.5">
              <ellipse cx="50" cy="50" rx="42" ry="16" transform="rotate(30 50 50)" />
              <ellipse cx="50" cy="50" rx="42" ry="16" transform="rotate(-30 50 50)" />
              <circle cx="50" cy="50" r="4.5" fill="currentColor" />
            </svg>
          </>
        )}

        {variant === 3 && (
          <>
            {/* DNA double helix top-left */}
            <svg style={{ width: '22px', height: '44px' }} className={`absolute top-12 left-4 ${palette.doodle1Color} transform -rotate-12`} viewBox="0 0 40 80" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M 10 10 Q 30 25 10 40 Q 30 55 10 70" />
              <path d="M 30 10 Q 10 25 30 40 Q 10 55 30 70" />
              <line x1="13" y1="25" x2="27" y2="25" strokeDasharray="2 2" />
              <line x1="13" y1="55" x2="27" y2="55" strokeDasharray="2 2" />
            </svg>
            {/* Atom top-right */}
            <svg style={{ width: '32px', height: '32px' }} className={`absolute top-12 right-5 ${palette.doodle2Color} transform -rotate-20`} viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2.5">
              <ellipse cx="50" cy="50" rx="42" ry="16" transform="rotate(30 50 50)" />
              <ellipse cx="50" cy="50" rx="42" ry="16" transform="rotate(-30 50 50)" />
              <circle cx="50" cy="50" r="4.5" fill="currentColor" />
            </svg>
            {/* Lightbulb bottom-left */}
            <svg style={{ width: '28px', height: '28px' }} className={`absolute bottom-20 left-5 ${palette.doodle3Color} transform rotate-12`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18h6" />
              <path d="M10 22h4" />
              <path d="M12 2a7 7 0 0 0-7 7c0 2.5 1.5 4.5 3 6h8c1.5-1.5 3-3.5 3-6a7 7 0 0 0-7-7z" />
            </svg>
            {/* Saturn bottom-right */}
            <svg style={{ width: '32px', height: '32px' }} className={`absolute bottom-20 right-5 ${palette.doodle4Color} transform rotate-20`} viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2.2">
              <circle cx="32" cy="32" r="16" />
              <ellipse cx="32" cy="32" rx="30" ry="8" transform="rotate(-25 32 32)" />
            </svg>
          </>
        )}

        {/* Small Playful Floating Stars & Sparkles (14px - 18px) */}
        <svg style={{ width: '16px', height: '16px' }} className={`absolute top-[28%] right-6 ${palette.starColor}`} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0l3 9 9 3-9 3-3 9-3-9-9-3 9-3z" />
        </svg>
        <svg style={{ width: '16px', height: '16px' }} className={`absolute top-[48%] left-4 ${palette.starColor} animate-pulse`} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2l2.4 6.9 7.1.3-5.5 4.5 1.9 6.9-5.9-4-5.9 4 1.9-6.9-5.5-4.5 7.1-.3z" />
        </svg>
        <svg style={{ width: '14px', height: '14px' }} className={`absolute bottom-[36%] right-8 ${palette.starColor}`} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0l3 9 9 3-9 3-3 9-3-9-9-3 9-3z" />
        </svg>

        {/* Soft mini squiggle at bottom */}
        <svg style={{ width: '80px', height: '16px' }} className="absolute bottom-5 left-1/3 text-indigo-400/20" viewBox="0 0 100 20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <path d="M5 10 Q 20 2 35 10 T 65 10 T 95 10" />
        </svg>
      </div>

      {/* Content Container */}
      <div className="relative z-10 w-full h-full flex flex-col justify-between items-center select-none overflow-hidden">
        {children}
      </div>
    </div>
  );
};

export default PlayfulBackground;
