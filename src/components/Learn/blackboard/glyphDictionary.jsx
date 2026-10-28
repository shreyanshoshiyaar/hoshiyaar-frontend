import React, { useState, useEffect } from 'react';

/**
 * Visual Chalk Glyph Dictionary
 * Renders glowing chalkboard drawings/icons for science, digestion, food, biology, and chemistry
 * with dynamic directional reveal animations:
 * - Swipe from left
 * - Coming from top
 * - Slide from right
 * - Drop from top with bounce
 */

export const BlackboardAnimationStyles = () => (
  <style>{`
    @keyframes swipeFromLeft {
      0% {
        opacity: 0;
        transform: translateX(-46px);
      }
      100% {
        opacity: 1;
        transform: translateX(0);
      }
    }

    @keyframes slideFromRight {
      0% {
        opacity: 0;
        transform: translateX(46px);
      }
      100% {
        opacity: 1;
        transform: translateX(0);
      }
    }

    @keyframes comeFromTop {
      0% {
        opacity: 0;
        transform: translateY(-46px);
      }
      100% {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @keyframes dropFromTopBounce {
      0% {
        opacity: 0;
        transform: translateY(-28px) scale(0.8);
      }
      65% {
        opacity: 1;
        transform: translateY(4px) scale(1.08);
      }
      100% {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }

    @keyframes arrowSwipeIn {
      0% {
        opacity: 0;
        transform: translateX(-28px) scaleX(0.6);
      }
      100% {
        opacity: 1;
        transform: translateX(0) scaleX(1);
      }
    }

    @keyframes cardSlideUp {
      0% {
        opacity: 0;
        transform: translateY(22px) scale(0.97);
      }
      100% {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }

    @keyframes mixerBladeSpin {
      0% {
        transform: rotate(0deg);
      }
      100% {
        transform: rotate(360deg);
      }
    }

    /* ── Continuous Living Blackboard Animations ("In this everything moves") ── */
    @keyframes teethChompUpper {
      0%, 100% {
        transform: translateY(0px);
      }
      38% {
        transform: translateY(4.5px);
      }
      48% {
        transform: translateY(5px);
      }
      65% {
        transform: translateY(0px);
      }
    }

    @keyframes teethChompLower {
      0%, 100% {
        transform: translateY(0px);
      }
      38% {
        transform: translateY(-4.5px);
      }
      48% {
        transform: translateY(-5px);
      }
      65% {
        transform: translateY(0px);
      }
    }

    @keyframes crumbsJiggle {
      0%, 35%, 100% {
        transform: scale(1) rotate(0deg);
      }
      42% {
        transform: scale(1.08, 0.92) rotate(2.5deg);
      }
      50% {
        transform: scale(0.94, 1.06) rotate(-3.5deg);
      }
      62% {
        transform: scale(1.04, 0.98) rotate(1deg);
      }
      75% {
        transform: scale(1) rotate(0deg);
      }
    }

    @keyframes mixerBodyVibrate {
      0%, 100% {
        transform: translate(0px, 0px);
      }
      25% {
        transform: translate(0.4px, -0.3px);
      }
      50% {
        transform: translate(-0.35px, 0.3px);
      }
      75% {
        transform: translate(0.3px, 0.35px);
      }
    }

    @keyframes mixerBladesSpinning {
      from {
        transform: rotate(0deg);
      }
      to {
        transform: rotate(360deg);
      }
    }

    @keyframes mixerCrumbsTumble {
      0% {
        transform: rotate(0deg) translate(0px, 0px) scale(1);
      }
      25% {
        transform: rotate(90deg) translate(1.4px, -1.8px) scale(1.08);
      }
      50% {
        transform: rotate(180deg) translate(0px, 1.2px) scale(0.92);
      }
      75% {
        transform: rotate(270deg) translate(-1.4px, -0.8px) scale(1.05);
      }
      100% {
        transform: rotate(360deg) translate(0px, 0px) scale(1);
      }
    }

    @keyframes redButtonPulse {
      0%, 100% {
        filter: drop-shadow(0 0 1px #FF6B6B);
        opacity: 0.85;
      }
      50% {
        filter: drop-shadow(0 0 4.5px #FF4444);
        opacity: 1;
      }
    }

    @keyframes goldBadgePulse {
      0%, 100% {
        filter: drop-shadow(0 0 3px rgba(255, 209, 102, 0.4));
        opacity: 0.92;
      }
      50% {
        filter: drop-shadow(0 0 9px rgba(255, 209, 102, 0.95));
        opacity: 1;
      }
    }

    @keyframes chapatiGentleBreathe {
      0%, 100% {
        transform: scale(1) translateY(0);
      }
      50% {
        transform: scale(1.03) translateY(-2px);
      }
    }

    @keyframes dropletFloat {
      0%, 100% {
        transform: translateY(0);
      }
      50% {
        transform: translateY(4px);
      }
    }

    @keyframes stomachChurn {
      0%, 100% {
        transform: scale(1);
      }
      50% {
        transform: scale(1.04, 0.97);
      }
    }

    @keyframes chapatiBiteWobble {
      0%, 100% {
        transform: scale(1);
      }
      38% {
        transform: scale(1.05, 0.94);
      }
      48% {
        transform: scale(1.08, 0.92);
      }
      65% {
        transform: scale(1);
      }
    }

    @keyframes breakBurst {
      0% {
        opacity: 0.2;
        transform: scale(0.65);
      }
      60% {
        opacity: 1;
        transform: scale(1.12);
      }
      100% {
        opacity: 1;
        transform: scale(1);
      }
    }

    .glabel {
      font-family: var(--f-display, 'Fredoka', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif);
      font-size: 5.5px;
      fill: #FFFFFF !important;
      font-weight: 500;
      stroke: none !important;
      filter: none !important;
      text-shadow: none !important;
    }
  `}</style>
);

/**
 * Calculates directional entry animation based on explicit tags or smart contextual semantics
 */
export const getAnimationForToken = (token = "", idx = 0, total = 1) => {
  const t = token.toLowerCase();

  // Explicit token tags support (e.g., [left], [from-left], [top], [right])
  if (t.includes('[top]') || t.includes('[from-top]')) return 'comeFromTop 0.55s cubic-bezier(0.16, 1, 0.3, 1) forwards';
  if (t.includes('[left]') || t.includes('[from-left]')) return 'swipeFromLeft 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards';
  if (t.includes('[right]') || t.includes('[from-right]')) return 'slideFromRight 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards';
  if (t.includes('[bounce]') || t.includes('[drop]')) return 'dropFromTopBounce 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards';

  // Smart Contextual Defaults:
  if (t === '->' || t === '=>') {
    return 'arrowSwipeIn 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards'; // Swipes across from left
  }
  if (t.includes('teeth') || t.includes('saliva') || t.includes('water') || t.includes('chew') || t.includes('droplet')) {
    return 'comeFromTop 0.55s cubic-bezier(0.16, 1, 0.3, 1) forwards'; // Coming from top
  }
  if (t.includes('pieces') || t.includes('crumbs')) {
    return 'dropFromTopBounce 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards'; // Drop & bounce
  }
  if (t.includes('mixer') || t.includes('grinder') || t.includes('blender')) {
    return 'slideFromRight 0.55s cubic-bezier(0.16, 1, 0.3, 1) forwards'; // Slide from right
  }
  if (idx === 0) {
    return 'swipeFromLeft 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards'; // Starting food/item: Swipe from left
  }
  // Terminal or destination organs (stomach, intestines, cells):
  return 'slideFromRight 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards'; // Slide from right
};

// 1. Food: Chapati / Flatbread with baked spots ("Living gentle breathing")
export const ChapatiGlyph = ({ label = "chapati", isActive = true }) => (
  <div 
    className="flex flex-col items-center justify-center gap-2 select-none"
    style={{ animation: 'chapatiGentleBreathe 2.5s ease-in-out infinite' }}
  >
    <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-[#D8AF72] shadow-[0_0_16px_rgba(216,175,114,0.35)] border-2 border-[#C69A58] flex items-center justify-center">
      {/* Baked spots/crumbs on chapati */}
      <span className="absolute top-4 left-5 w-2.5 h-2.5 rounded-full bg-[#7D5122]/70"></span>
      <span className="absolute top-6 right-5 w-3 h-3 rounded-full bg-[#7D5122]/80"></span>
      <span className="absolute bottom-5 left-6 w-3.5 h-2.5 rounded-full bg-[#7D5122]/70"></span>
      <span className="absolute bottom-6 right-6 w-2.5 h-2.5 rounded-full bg-[#7D5122]/60"></span>
      <span className="absolute top-10 left-10 w-2.5 h-2.5 rounded-full bg-[#7D5122]/70"></span>
    </div>
    {label && (
      <span 
        style={{ fontFamily: "var(--f-hand, 'Patrick Hand', cursive, sans-serif)" }}
        className="text-white text-base sm:text-lg font-bold italic tracking-wide"
      >
        {label}
      </span>
    )}
  </div>
);

// 2. Full Digestion Breakdown: Teeth + Crumbs ("Initially shows chapati, then breaks into crumbs")
export const TeethBreakdownDiagram = ({ isActive = true, revealedCount = 99, animKey = 0 }) => {
  const showTeeth = revealedCount >= 3;
  const showCrumbs = revealedCount >= 4;

  const [isBroken, setIsBroken] = useState(false);

  useEffect(() => {
    setIsBroken(false);
    if (showCrumbs) {
      const timer = setTimeout(() => {
        setIsBroken(true);
      }, 1100);
      return () => clearTimeout(timer);
    }
  }, [animKey, showCrumbs, isActive]);

  return (
    <div className="flex flex-col items-center justify-center gap-1 select-none">
      {/* Teeth Section: Step 3 - Coming from top with active chewing */}
      <div 
        className={`flex flex-col items-center justify-center gap-1 transition-all ${
          showTeeth ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        style={{
          animation: showTeeth ? 'comeFromTop 0.55s cubic-bezier(0.16, 1, 0.3, 1) forwards' : 'none'
        }}
      >
        {/* Label: teeth */}
        <span 
          style={{ fontFamily: "var(--f-hand, 'Patrick Hand', cursive, sans-serif)" }}
          className="text-white text-base sm:text-lg font-bold italic tracking-wide"
        >
          teeth
        </span>
        {/* Glowing Teeth Zigzag with chewing chomp */}
        <div 
          className="flex items-center justify-center"
          style={{ animation: 'teethChompUpper 1.3s cubic-bezier(0.45, 0, 0.55, 1) infinite' }}
        >
          <svg 
            className="w-24 sm:w-32 h-10 sm:h-12 overflow-visible" 
            viewBox="0 0 100 40" 
            fill="none"
          >
            <defs>
              <filter id="chalkGlowTeeth" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="0" stdDeviation="2.5" floodColor="#FFFFFF" floodOpacity="0.9" />
              </filter>
            </defs>
            <line x1="2" y1="5" x2="98" y2="5" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" filter="url(#chalkGlowTeeth)" />
            <path 
              d="M 5,5 L 12,32 L 19,5 L 26,32 L 33,5 L 40,32 L 47,5 L 54,32 L 61,5 L 68,32 L 75,5 L 82,32 L 89,5 L 95,32" 
              stroke="#FFFFFF" 
              strokeWidth="3.5" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              filter="url(#chalkGlowTeeth)"
            />
          </svg>
        </div>
      </div>

      {/* Whole Chapati under teeth before break OR Crumb pieces after break */}
      {showTeeth && (
        !isBroken ? (
          <div 
            className="flex flex-col items-center justify-center gap-1 cursor-pointer transition-all"
            onClick={() => setIsBroken(true)}
            style={{ animation: 'chapatiBiteWobble 1.3s cubic-bezier(0.45, 0, 0.55, 1) infinite' }}
          >
            <div className="relative w-12 h-12 rounded-full bg-[#E9C27A] border border-[#C69A58] shadow-[0_0_10px_rgba(233,194,122,0.4)] flex items-center justify-center">
              <span className="absolute top-2 left-2.5 w-1.5 h-1.5 rounded-full bg-[#7D5122]/80"></span>
              <span className="absolute top-3.5 right-2.5 w-2 h-2 rounded-full bg-[#7D5122]/85"></span>
              <span className="absolute bottom-2.5 left-3.5 w-1.5 h-1.5 rounded-full bg-[#7D5122]/75"></span>
              <span className="absolute bottom-3 right-3 w-1.5 h-1.5 rounded-full bg-[#7D5122]/70"></span>
            </div>
            <span 
              style={{ fontFamily: "var(--f-hand, 'Patrick Hand', cursive, sans-serif)" }}
              className="text-white text-base sm:text-lg font-bold italic tracking-wide"
            >
              chapati
            </span>
          </div>
        ) : (
          <div 
            className="flex flex-col items-center justify-center gap-0.5 cursor-pointer transition-all"
            onClick={() => setIsBroken(false)}
            style={{ animation: 'breakBurst 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards' }}
          >
            <div 
              className="relative w-16 h-5 flex items-center justify-center gap-1 mt-0.5"
              style={{ animation: 'crumbsJiggle 1.3s cubic-bezier(0.45, 0, 0.55, 1) infinite' }}
            >
              <div className="w-3 h-3 rounded-full bg-[#E5B562] shadow-[0_0_8px_rgba(229,181,98,0.9)]"></div>
              <div className="w-3.5 h-3.5 rounded-full bg-[#E8C58D] shadow-[0_0_8px_rgba(232,197,141,0.9)] -mt-1"></div>
              <div className="w-3 h-3 rounded-full bg-[#D4A362] shadow-[0_0_8px_rgba(212,163,98,0.9)] mt-1"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-[#F3D7A4] shadow-[0_0_6px_rgba(243,215,164,0.9)]"></div>
            </div>
            {/* Label: tiny pieces */}
            <span 
              style={{ fontFamily: "var(--f-hand, 'Patrick Hand', cursive, sans-serif)" }}
              className="text-white text-base sm:text-lg font-bold italic tracking-wide"
            >
              tiny pieces
            </span>
          </div>
        )
      )}
    </div>
  );
};

// 3. Teeth: Standalone Zigzag teeth ("Living chewing chomp")
export const TeethGlyph = ({ label = "teeth", isActive = true }) => (
  <div 
    className="flex flex-col items-center justify-center gap-1 select-none"
    style={{ animation: 'comeFromTop 0.55s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}
  >
    <span 
      style={{ fontFamily: "var(--f-hand, 'Patrick Hand', cursive, sans-serif)" }}
      className="text-white text-base sm:text-lg font-bold italic tracking-wide"
    >
      {label}
    </span>
    <div 
      className="flex flex-col items-center justify-center"
      style={{ animation: 'teethChompUpper 1.3s cubic-bezier(0.45, 0, 0.55, 1) infinite' }}
    >
      <svg 
        className="w-22 sm:w-28 h-9 sm:h-11 overflow-visible" 
        viewBox="0 0 100 40" 
        fill="none"
      >
        <line x1="2" y1="5" x2="98" y2="5" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" filter="drop-shadow(0 0 6px white)" />
        <path 
          d="M 5,5 L 12,32 L 19,5 L 26,32 L 33,5 L 40,32 L 47,5 L 54,32 L 61,5 L 68,32 L 75,5 L 82,32 L 89,5 L 95,32" 
          stroke="#FFFFFF" 
          strokeWidth="3.5" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          filter="drop-shadow(0 0 6px white)"
        />
      </svg>
    </div>
  </div>
);

// 4. Tiny Pieces / Crushed Food Crumbs ("Living jiggling crumbs")
export const TinyPiecesGlyph = ({ label = "tiny pieces", isActive = true }) => (
  <div 
    className="flex flex-col items-center justify-center gap-1 select-none"
    style={{ animation: 'dropFromTopBounce 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards' }}
  >
    <div 
      className="relative w-16 h-7 flex items-center justify-center gap-1"
      style={{ animation: 'crumbsJiggle 1.3s cubic-bezier(0.45, 0, 0.55, 1) infinite' }}
    >
      <div className="w-3 h-3 rounded-full bg-[#E5B562] shadow-[0_0_8px_rgba(229,181,98,0.9)]"></div>
      <div className="w-3.5 h-3.5 rounded-full bg-[#E8C58D] shadow-[0_0_8px_rgba(232,197,141,0.9)] -mt-1"></div>
      <div className="w-3 h-3 rounded-full bg-[#D4A362] shadow-[0_0_8px_rgba(212,163,98,0.9)] mt-1"></div>
      <div className="w-2.5 h-2.5 rounded-full bg-[#F3D7A4] shadow-[0_0_6px_rgba(243,215,164,0.9)]"></div>
    </div>
    {label && (
      <span 
        style={{ fontFamily: "var(--f-hand, 'Patrick Hand', cursive, sans-serif)" }}
        className="text-white text-base sm:text-lg font-bold italic tracking-wide text-center"
      >
        {label}
      </span>
    )}
  </div>
);

// 5. Brand Blue Glowing Chalk Arrow (Matching Hoshi Brand - Swipe from left)
export const ChalkArrowGlyph = ({ direction = "right" }) => (
  <div 
    className="flex items-center justify-center px-2 sm:px-4 select-none"
    style={{ animation: 'arrowSwipeIn 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}
  >
    <svg 
      className="w-12 sm:w-16 h-7 sm:h-9 overflow-visible" 
      viewBox="0 0 50 24" 
      fill="none"
    >
      <defs>
        <filter id="chalkGlowArrow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0" stdDeviation="2.5" floodColor="#1F6FE5" floodOpacity="0.9" />
        </filter>
      </defs>
      <path 
        d="M 4,12 L 42,12 M 32,5 L 44,12 L 32,19" 
        stroke="#1F6FE5" 
        strokeWidth="3.5" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        filter="url(#chalkGlowArrow)"
      />
    </svg>
  </div>
);

// 6. Saliva Droplets ("Living floating droplets")
export const SalivaGlyph = ({ label = "saliva", isActive = true }) => (
  <div 
    className="flex flex-col items-center justify-center gap-1 select-none"
    style={{ animation: 'comeFromTop 0.55s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}
  >
    <div 
      className="flex items-center justify-center gap-1.5 py-1"
      style={{ animation: 'dropletFloat 1.8s ease-in-out infinite' }}
    >
      <svg className="w-8 h-10 text-[#7CD3FF]" viewBox="0 0 24 30" fill="none">
        <path d="M12 2 C12 2 4 14 4 20 C4 24.4 7.6 28 12 28 C16.4 28 20 24.4 20 20 C20 14 12 2 12 2 Z" fill="#7CD3FF" fillOpacity="0.6" stroke="#7CD3FF" strokeWidth="2" filter="drop-shadow(0 0 6px #7CD3FF)" />
      </svg>
      <svg className="w-6 h-8 text-[#58C4F6] -mt-2" viewBox="0 0 24 30" fill="none">
        <path d="M12 2 C12 2 4 14 4 20 C4 24.4 7.6 28 12 28 C16.4 28 20 24.4 20 20 C20 14 12 2 12 2 Z" fill="#58C4F6" fillOpacity="0.7" stroke="#58C4F6" strokeWidth="2" filter="drop-shadow(0 0 6px #58C4F6)" />
      </svg>
    </div>
    {label && (
      <span 
        style={{ fontFamily: "var(--f-hand, 'Patrick Hand', cursive, sans-serif)" }}
        className="text-[#7CD3FF] text-base sm:text-lg font-bold italic tracking-wide"
      >
        {label}
      </span>
    )}
  </div>
);

// 7. Stomach Outline ("Living churning contraction")
export const StomachGlyph = ({ label = "stomach", isActive = true }) => (
  <div 
    className="flex flex-col items-center justify-center gap-1 select-none"
    style={{ animation: 'slideFromRight 0.55s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}
  >
    <div style={{ animation: 'stomachChurn 2.2s ease-in-out infinite', transformOrigin: 'center center' }}>
      <svg className="w-16 sm:w-20 h-14 sm:h-16 text-[#FF8585]" viewBox="0 0 60 50" fill="none">
        <path 
          d="M20,5 C25,12 22,22 15,25 C8,28 8,42 22,46 C35,50 48,45 52,32 C56,18 42,12 36,15 C33,16 32,8 30,5" 
          stroke="#FF8585" 
          strokeWidth="3" 
          strokeLinecap="round" 
          fill="#FF8585" 
          fillOpacity="0.2"
          filter="drop-shadow(0 0 6px #FF8585)"
        />
      </svg>
    </div>
    {label && (
      <span 
        style={{ fontFamily: "var(--f-hand, 'Patrick Hand', cursive, sans-serif)" }}
        className="text-[#FF8585] text-base sm:text-lg font-bold italic tracking-wide"
      >
        {label}
      </span>
    )}
  </div>
);

// 8. Mixer-Grinder / Blender with spinning blades & crumbs ("Everything moves")
export const MixerGrinderGlyph = ({ label = "mixer-grinder", isActive = true }) => (
  <div 
    className="flex flex-col items-center justify-center gap-1 select-none"
    style={{ animation: 'slideFromRight 0.55s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}
  >
    {label && (
      <span 
        style={{ fontFamily: "var(--f-hand, 'Patrick Hand', cursive, sans-serif)" }}
        className="text-[#A8E6FF] text-base sm:text-lg font-bold italic tracking-wide"
      >
        {label}
      </span>
    )}
    <div className="relative flex items-center justify-center">
      <svg className="w-20 sm:w-24 h-24 sm:h-28 overflow-visible" viewBox="-15 -20 30 40" fill="none">
        <defs>
          <filter id="chalkGlowMixer" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="1.1" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        
        {/* Blender Jar Body & Base with motor hum vibration */}
        <g style={{ animation: 'mixerBodyVibrate 0.12s linear infinite', transformOrigin: '0 0' }}>
          <polygon 
            points="-7,-13 7,-13 5,6 -5,6" 
            fill="#16324A" 
            stroke="#A8E6FF" 
            strokeWidth="1" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            filter="url(#chalkGlowMixer)"
          />
          <rect 
            x="-8" 
            y="7" 
            width="16" 
            height="8" 
            rx="1" 
            fill="#F4F8FF" 
            fillOpacity="0.22" 
            stroke="#F4F8FF" 
            strokeWidth="1" 
            strokeLinecap="round"
            strokeLinejoin="round" 
          />
          <rect 
            x="-6" 
            y="-15.7" 
            width="12" 
            height="2.8" 
            rx="1" 
            fill="#FF6B6B" 
            fillOpacity="0.95" 
            stroke="#FF6B6B" 
            strokeWidth="0.8" 
          />
          <circle 
            cx="4" 
            cy="11" 
            r="1.6" 
            fill="#FF6B6B" 
            style={{ animation: 'redButtonPulse 1s ease-in-out infinite' }}
          />
        </g>

        {/* Crumbs swirling & tumbling wildly inside jar */}
        <g style={{ animation: 'mixerCrumbsTumble 0.75s ease-in-out infinite', transformOrigin: '0px -3px' }}>
          <circle cx="-3" cy="-4" r="1.5" fill="#E9C27A" fillOpacity="0.95" />
          <circle cx="2" cy="-6" r="1.3" fill="#E9C27A" fillOpacity="0.95" />
          <circle cx="-1" cy="-2" r="1.2" fill="#E9C27A" fillOpacity="0.95" />
          <circle cx="3" cy="-3" r="1.4" fill="#E9C27A" fillOpacity="0.95" />
        </g>

        {/* Rapidly spinning blade in center */}
        <g 
          transform="translate(0, 2)" 
          style={{ animation: 'mixerBladesSpinning 0.28s linear infinite', transformOrigin: '0px 2px' }}
        >
          <line x1="-5" y1="2" x2="5" y2="2" stroke="#F4F8FF" strokeWidth="1.2" strokeLinecap="round" />
          <line x1="-5" y1="2" x2="-6.5" y2="0.5" stroke="#F4F8FF" strokeWidth="1.2" strokeLinecap="round" />
          <line x1="5" y1="2" x2="6.5" y2="3.5" stroke="#F4F8FF" strokeWidth="1.2" strokeLinecap="round" />
          <circle cx="0" cy="2" r="1.2" fill="#F4F8FF" />
        </g>
      </svg>
    </div>
  </div>
);

// 9. Opposing Dual Teeth Rows actively chewing & chomping food
export const DualTeethCrushGlyph = ({ label = "small pieces", isActive = true }) => (
  <div 
    className="flex flex-col items-center justify-center gap-1 select-none"
    style={{ animation: 'comeFromTop 0.55s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}
  >
    <div className="relative flex flex-col items-center justify-center">
      <svg className="w-24 sm:w-32 h-20 sm:h-24 overflow-visible" viewBox="-20 -25 40 50" fill="none">
        <defs>
          <filter id="chalkGlowDualTeeth" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="1.1" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Upper teeth row with active chomp */}
        <g transform="translate(0, -12)">
          <g style={{ animation: 'teethChompUpper 1.3s cubic-bezier(0.45, 0, 0.55, 1) infinite', transformOrigin: '0 0' }}>
            <line x1="-15" y1="-4" x2="15" y2="-4" stroke="#F4F8FF" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" filter="url(#chalkGlowDualTeeth)" />
            <polyline points="-15,-4 -13.5,4 -12,-4 -10.5,4 -9,-4 -7.5,4 -6,-4 -4.5,4 -3,-4 -1.5,4 0,-4 1.5,4 3,-4 4.5,4 6,-4 7.5,4 9,-4 10.5,4 12,-4 13.5,4 15,-4" fill="none" stroke="#F4F8FF" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" filter="url(#chalkGlowDualTeeth)" />
          </g>
        </g>

        {/* Lower teeth row with active chomp (inverted) */}
        <g transform="translate(0, 10)">
          <g style={{ animation: 'teethChompLower 1.3s cubic-bezier(0.45, 0, 0.55, 1) infinite', transformOrigin: '0 0' }}>
            <g transform="rotate(180)">
              <line x1="-15" y1="-4" x2="15" y2="-4" stroke="#F4F8FF" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" filter="url(#chalkGlowDualTeeth)" />
              <polyline points="-15,-4 -13.5,4 -12,-4 -10.5,4 -9,-4 -7.5,4 -6,-4 -4.5,4 -3,-4 -1.5,4 0,-4 1.5,4 3,-4 4.5,4 6,-4 7.5,4 9,-4 10.5,4 12,-4 13.5,4 15,-4" fill="none" stroke="#F4F8FF" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" filter="url(#chalkGlowDualTeeth)" />
            </g>
          </g>
        </g>

        {/* Crushed crumbs jiggling from teeth bite impact */}
        <g transform="translate(0, 22)">
          <g style={{ animation: 'crumbsJiggle 1.3s cubic-bezier(0.45, 0, 0.55, 1) infinite', transformOrigin: '0 0' }}>
            <circle cx="-6.5" cy="0.5" r="2.2" fill="#E9C27A" fillOpacity="0.95" stroke="#E9C27A" strokeWidth="0.7" />
            <circle cx="-1.5" cy="-1.5" r="1.9" fill="#E9C27A" fillOpacity="0.95" stroke="#E9C27A" strokeWidth="0.7" />
            <circle cx="3.5" cy="0.8" r="2.3" fill="#E9C27A" fillOpacity="0.95" stroke="#E9C27A" strokeWidth="0.7" />
            <circle cx="7.5" cy="-1" r="1.8" fill="#E9C27A" fillOpacity="0.95" stroke="#E9C27A" strokeWidth="0.7" />
            <circle cx="1" cy="2.5" r="1.3" fill="#E9C27A" fillOpacity="0.95" stroke="#E9C27A" strokeWidth="0.7" />
          </g>
        </g>
      </svg>
    </div>
    {label && (
      <span 
        style={{ fontFamily: "var(--f-hand, 'Patrick Hand', cursive, sans-serif)" }}
        className="text-white text-base sm:text-lg font-bold italic tracking-wide"
      >
        {label}
      </span>
    )}
  </div>
);

// 10. Side-by-Side Comparison: Teeth vs. Mixer-Grinder ("Initially shows chapati and then breaks")
export const TeethMixerComparisonDiagram = ({ isActive = true, revealedCount = 99, animKey = 0 }) => {
  const showTeeth = revealedCount >= 1;
  const showMixer = revealedCount >= 2;
  const showSummary = revealedCount >= 3;

  // Initially shows whole chapati, then breaks into small pieces after ~1.5s of teeth chomping
  const [isBroken, setIsBroken] = useState(false);

  useEffect(() => {
    setIsBroken(false);
    const timer = setTimeout(() => {
      setIsBroken(true);
    }, 1500);
    return () => clearTimeout(timer);
  }, [animKey, isActive]);

  return (
    <div className="w-full flex flex-col items-center justify-center select-none py-1">
      <BlackboardAnimationStyles />
      <svg 
        viewBox="0 0 160 100" 
        className="w-full max-w-[340px] sm:max-w-[420px] md:max-w-[460px] h-auto overflow-visible"
        role="img" 
        aria-label="Teeth and mixer comparison board drawing"
      >
        <defs>
          <filter id="chalkGlowFull" filterUnits="userSpaceOnUse" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="1.1" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* LEFT SIDE: TEETH & CHAPATI -> BREAKS INTO SMALL PIECES (Active Chewing & Breaking) */}
        <g 
          className={`transition-all duration-300 ${showTeeth ? 'opacity-100' : 'opacity-0'}`}
          style={{
            animation: showTeeth ? 'swipeFromLeft 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards' : 'none'
          }}
        >
          {/* Upper teeth with active chewing chomp animation (with subtle chalk glow) */}
          <g transform="translate(34 21.05)" filter="url(#chalkGlowFull)">
            <g style={{ animation: 'teethChompUpper 1.3s cubic-bezier(0.45, 0, 0.55, 1) infinite', transformOrigin: '0 0' }}>
              <g transform="scale(1.1)">
                <line x1="-15" y1="-4" x2="15" y2="-4" stroke="#F4F8FF" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
                <polyline 
                  points="-15,-4 -13.5,4 -12,-4 -10.5,4 -9,-4 -7.5,4 -6,-4 -4.5,4 -3,-4 -1.5,4 0,-4 1.5,4 3,-4 4.5,4 6,-4 7.5,4 9,-4 10.5,4 12,-4 13.5,4 15,-4" 
                  fill="none" 
                  stroke="#F4F8FF" 
                  strokeWidth="1.1" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                />
              </g>
            </g>
          </g>

          {/* Lower teeth with active chewing chomp animation (reversed, with subtle chalk glow) */}
          <g transform="translate(34 44.95)" filter="url(#chalkGlowFull)">
            <g style={{ animation: 'teethChompLower 1.3s cubic-bezier(0.45, 0, 0.55, 1) infinite', transformOrigin: '0 0' }}>
              <g transform="scale(1.1) rotate(180)">
                <line x1="-15" y1="-4" x2="15" y2="-4" stroke="#F4F8FF" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
                <polyline 
                  points="-15,-4 -13.5,4 -12,-4 -10.5,4 -9,-4 -7.5,4 -6,-4 -4.5,4 -3,-4 -1.5,4 0,-4 1.5,4 3,-4 4.5,4 6,-4 7.5,4 9,-4 10.5,4 12,-4 13.5,4 15,-4" 
                  fill="none" 
                  stroke="#F4F8FF" 
                  strokeWidth="1.1" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                />
              </g>
            </g>
          </g>

          {/* FOOD UNDER TEETH: INITIALLY WHOLE CHAPATI, THEN BREAKS INTO SMALL PIECES */}
          <g transform="translate(34 58)">
            {!isBroken ? (
              /* WHOLE CHAPATI UNDER TEETH (From user reference image media_1792158608660.png) */
              <g 
                className="cursor-pointer"
                onClick={() => setIsBroken(true)}
                style={{ 
                  animation: 'chapatiBiteWobble 1.3s cubic-bezier(0.45, 0, 0.55, 1) infinite',
                  transformBox: 'fill-box',
                  transformOrigin: 'center'
                }}
              >
                {/* Whole round baked chapati (graphics with subtle glow) */}
                <g filter="url(#chalkGlowFull)">
                  <circle cx="0" cy="0" r="9" fill="#E9C27A" stroke="#C69A58" strokeWidth="0.8" />
                  {/* Baked brown spots */}
                  <circle cx="-3" cy="-3.5" r="1.3" fill="#7D5122" fillOpacity="0.85" />
                  <circle cx="2" cy="-4" r="1.5" fill="#7D5122" fillOpacity="0.9" />
                  <circle cx="4.5" cy="1.5" r="1.4" fill="#7D5122" fillOpacity="0.8" />
                  <circle cx="-3.5" cy="3" r="1.3" fill="#7D5122" fillOpacity="0.8" />
                  <circle cx="0.5" cy="0.5" r="1.4" fill="#7D5122" fillOpacity="0.85" />
                </g>

                {/* Chalk Label: chapati (CRISP, CLEAN, NO GLOW, READABLE) */}
                <text 
                  x="0" 
                  y="16" 
                  textAnchor="middle" 
                  fill="#FFFFFF" 
                  style={{ 
                    fontFamily: "var(--f-hand, 'Patrick Hand', cursive, sans-serif)", 
                    fontSize: "6.5px", 
                    fontWeight: "600",
                    fontStyle: "italic",
                    letterSpacing: "0.2px"
                  }}
                >
                  chapati
                </text>
              </g>
            ) : (
              /* CRUSHED CRUMBS AFTER BREAK ("small pieces") */
              <g 
                className="cursor-pointer"
                onClick={() => setIsBroken(false)}
                style={{ 
                  animation: 'crumbsJiggle 1.3s cubic-bezier(0.45, 0, 0.55, 1) infinite',
                  transformBox: 'fill-box',
                  transformOrigin: 'center'
                }}
              >
                <g filter="url(#chalkGlowFull)">
                  <circle cx="-6.5" cy="0.5" r="2.3" fill="#E9C27A" fillOpacity="0.9" stroke="#E9C27A" strokeWidth="0.72" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="-1.5" cy="-1.5" r="2" fill="#E9C27A" fillOpacity="0.9" stroke="#E9C27A" strokeWidth="0.72" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="3.5" cy="0.8" r="2.4" fill="#E9C27A" fillOpacity="0.9" stroke="#E9C27A" strokeWidth="0.72" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="7.5" cy="-1" r="1.8" fill="#E9C27A" fillOpacity="0.9" stroke="#E9C27A" strokeWidth="0.72" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="1" cy="3" r="1.3" fill="#E9C27A" fillOpacity="0.9" stroke="#E9C27A" strokeWidth="0.72" strokeLinecap="round" strokeLinejoin="round" />
                </g>

                {/* Chalk Label: small pieces (CRISP, CLEAN, NO GLOW, READABLE) */}
                <text 
                  x="0" 
                  y="16" 
                  textAnchor="middle" 
                  fill="#FFFFFF" 
                  style={{ 
                    fontFamily: "var(--f-hand, 'Patrick Hand', cursive, sans-serif)", 
                    fontSize: "6.5px", 
                    fontWeight: "600",
                    fontStyle: "italic",
                    letterSpacing: "0.2px"
                  }}
                >
                  small pieces
                </text>
              </g>
            )}
          </g>
        </g>

        {/* RIGHT SIDE: MIXER-GRINDER (Step 2 - Slide From Right, Active Motor & Blades) */}
        <g 
          className={`transition-all duration-300 ${showMixer ? 'opacity-100' : 'opacity-0'}`}
          style={{
            animation: showMixer ? 'slideFromRight 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards' : 'none'
          }}
        >
          {/* Label: mixer-grinder (CRISP, CLEAN, NO GLOW, READABLE) */}
          <text 
            x="118" 
            y="21" 
            textAnchor="middle" 
            fill="#A8E6FF" 
            style={{ 
              fontFamily: "var(--f-hand, 'Patrick Hand', cursive, sans-serif)", 
              fontSize: "6.5px", 
              fontWeight: "600",
              fontStyle: "italic",
              letterSpacing: "0.2px"
            }}
          >
            mixer-grinder
          </text>

          {/* Mixer body, jar, base & lid with active motor vibration (subtle glow on drawing) */}
          <g transform="translate(118 48)" filter="url(#chalkGlowFull)">
            <g style={{ animation: 'mixerBodyVibrate 0.12s linear infinite', transformOrigin: '0 0' }}>
              <g transform="scale(1.5)">
                <polygon points="-7,-13 7,-13 5,6 -5,6" fill="#16324A" stroke="#16324A" strokeWidth="0.77" strokeLinecap="round" strokeLinejoin="round" />
                <polygon points="-7,-13 7,-13 5,6 -5,6" fill="none" stroke="#A8E6FF" strokeWidth="0.77" strokeLinecap="round" strokeLinejoin="round" />
                <rect x="-8" y="7" width="16" height="8" rx="0.6" fill="#F4F8FF" fillOpacity="0.18" stroke="#F4F8FF" strokeWidth="0.77" strokeLinecap="round" strokeLinejoin="round" />
                <rect x="-8" y="7" width="16" height="8" rx="0.6" fill="none" stroke="#F4F8FF" strokeWidth="0.77" strokeLinecap="round" strokeLinejoin="round" />
                <rect x="-6" y="-15.7" width="12" height="2.4" rx="0.6" fill="#FF6B6B" fillOpacity="0.9" stroke="#FF6B6B" strokeWidth="0.77" strokeLinecap="round" strokeLinejoin="round" />
                <circle 
                  cx="4" 
                  cy="11" 
                  r="1.4" 
                  fill="#FF6B6B" 
                  fillOpacity="1" 
                  stroke="#FF6B6B" 
                  strokeWidth="0.77" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  style={{ animation: 'redButtonPulse 1s ease-in-out infinite' }}
                />
              </g>
            </g>
          </g>

          {/* Fast spinning blades inside mixer jar */}
          <g transform="translate(118 52)" filter="url(#chalkGlowFull)">
            <g 
              style={{ 
                animation: 'mixerBladesSpinning 0.28s linear infinite', 
                transformOrigin: '0px 0px' 
              }}
            >
              <g transform="scale(1.2)">
                <line x1="-5" y1="0" x2="5" y2="0" stroke="#F4F8FF" strokeWidth="0.96" strokeLinecap="round" />
                <line x1="-5" y1="0" x2="-6.5" y2="-1.6" stroke="#F4F8FF" strokeWidth="0.96" strokeLinecap="round" />
                <line x1="5" y1="0" x2="6.5" y2="1.6" stroke="#F4F8FF" strokeWidth="0.96" strokeLinecap="round" />
                <circle cx="0" cy="0" r="0.9" fill="#F4F8FF" fillOpacity="1" stroke="#F4F8FF" strokeWidth="0.96" strokeLinecap="round" />
              </g>
            </g>
          </g>

          {/* Food crumbs actively swirling and tumbling inside mixer jar */}
          <g transform="translate(118 40)" filter="url(#chalkGlowFull)">
            <g 
              style={{ 
                animation: 'mixerCrumbsTumble 0.75s ease-in-out infinite', 
                transformOrigin: '0px 0px' 
              }}
            >
              <g transform="scale(0.8)">
                <circle cx="-6.5" cy="0.5" r="2.3" fill="#E9C27A" fillOpacity="0.9" stroke="#E9C27A" strokeWidth="1.44" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="-1.5" cy="-1.5" r="2" fill="#E9C27A" fillOpacity="0.9" stroke="#E9C27A" strokeWidth="1.44" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="3.5" cy="0.8" r="2.4" fill="#E9C27A" fillOpacity="0.9" stroke="#E9C27A" strokeWidth="1.44" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="7.5" cy="-1" r="1.8" fill="#E9C27A" fillOpacity="0.9" stroke="#E9C27A" strokeWidth="1.44" strokeLinecap="round" strokeLinejoin="round" />
              </g>
            </g>
          </g>
        </g>

        {/* BOTTOM SUMMARY: SAME JOB: MAKE FOOD SMALLER (Step 3 - Bounce In, Active Breathing Gold Pulse) */}
        <g 
          className={`transition-all duration-300 ${showSummary ? 'opacity-100' : 'opacity-0'}`}
          style={{
            animation: showSummary ? 'dropFromTopBounce 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards' : 'none'
          }}
        >
          <g style={{ animation: 'goldBadgePulse 2s ease-in-out infinite', transformOrigin: '80px 91px' }}>
            {/* Clean crisp dashed border pill without glow */}
            <rect 
              x="26" 
              y="86.5" 
              width="108" 
              height="10" 
              rx="5" 
              fill="rgba(255,209,102,0.08)" 
              stroke="#FFD166" 
              strokeWidth="0.65" 
              strokeDasharray="2.5 1.5"
            />
            {/* Crisp clean text, NO glow, NO blur, perfectly centered */}
            <text 
              x="80" 
              y="91.5" 
              dominantBaseline="central"
              textAnchor="middle" 
              fill="#FFD166" 
              style={{ 
                fontFamily: "var(--f-display, 'Fredoka', 'Trebuchet MS', sans-serif)", 
                fontSize: "5.4px", 
                fontWeight: "700",
                letterSpacing: "0.3px"
              }}
            >
              SAME JOB: MAKE FOOD SMALLER
            </text>
          </g>
        </g>
      </svg>
    </div>
  );
};

/**
 * Helper to calculate total reveal steps for a glyph code
 */
export const getGlyphTotalSteps = (glyphCode = "") => {
  if (!glyphCode || !glyphCode.trim()) return 1;
  const trimmed = glyphCode.trim().toLowerCase();

  // Teeth vs Mixer comparison diagram from user snippet
  if (
    trimmed.includes('teeth_vs_mixer') || 
    trimmed.includes('compare_mixer') ||
    (trimmed.includes('teeth') && trimmed.includes('mixer'))
  ) {
    return 3; // Step 1: Teeth + crumbs, Step 2: Mixer-grinder, Step 3: Comparison summary
  }

  if (
    trimmed.includes('chapati') && 
    (trimmed.includes('teeth') || trimmed.includes('chew')) && 
    (trimmed.includes('tiny') || trimmed.includes('pieces'))
  ) {
    return 4; // Step 1: chapati, Step 2: arrow, Step 3: teeth, Step 4: tiny pieces
  }
  const parts = glyphCode.trim().split(/(\s*->\s*|\s*=>\s*)/).filter(Boolean);
  return Math.max(1, parts.length);
};

/**
 * Universal Sequence Renderer
 * Reveals elements one by one based on revealedCount with dynamic directional animations
 */
export const renderGlyphSequence = (glyphCode = "", isActive = true, revealedCount = 99, animKey = 0) => {
  if (!glyphCode || !glyphCode.trim()) return null;

  const trimmed = glyphCode.trim();

  // If matches teeth vs mixer comparison diagram from user snippet
  if (
    trimmed.includes('teeth_vs_mixer') || 
    trimmed.includes('compare_mixer') ||
    (trimmed.includes('teeth') && trimmed.includes('mixer'))
  ) {
    return <TeethMixerComparisonDiagram isActive={isActive} revealedCount={revealedCount} animKey={animKey} />;
  }

  // If matches the digestion breakdown diagram from the user's screenshot
  if (
    trimmed.includes('chapati') && 
    (trimmed.includes('teeth') || trimmed.includes('chew')) && 
    (trimmed.includes('tiny') || trimmed.includes('pieces'))
  ) {
    return (
      <div className="flex items-center justify-center gap-4 sm:gap-8 py-3 px-2">
        <BlackboardAnimationStyles />

        {/* Step 1: Chapati - Swipe from left */}
        <div 
          className={`transition-all ${revealedCount >= 1 ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          style={{
            animation: revealedCount >= 1 ? 'swipeFromLeft 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards' : 'none'
          }}
        >
          <ChapatiGlyph label="chapati" isActive={isActive} />
        </div>

        {/* Step 2: Arrow - Swipes across from left */}
        <div 
          className={`transition-all ${revealedCount >= 2 ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          style={{
            animation: revealedCount >= 2 ? 'arrowSwipeIn 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards' : 'none'
          }}
        >
          <ChalkArrowGlyph />
        </div>

        {/* Steps 3 & 4: Teeth (Coming from top) and Crumbs (Drop from top bounce) */}
        <TeethBreakdownDiagram isActive={isActive} revealedCount={revealedCount} animKey={animKey} />
      </div>
    );
  }

  // Parse by arrows "->"
  const parts = trimmed.split(/(\s*->\s*|\s*=>\s*)/).filter(Boolean);

  return (
    <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-5 py-2 px-2">
      <BlackboardAnimationStyles />
      {parts.map((p, idx) => {
        const clean = p.trim().toLowerCase();
        const isShown = revealedCount >= idx + 1;
        const comp = (clean === '->' || clean === '=>') 
          ? <ChalkArrowGlyph />
          : renderSingleGlyph(clean, p.trim(), isActive);

        const animStyle = getAnimationForToken(clean, idx, parts.length);

        return (
          <div 
            key={idx} 
            className={`transition-all ${
              isShown ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
            style={{
              animation: isShown ? animStyle : 'none'
            }}
          >
            {comp}
          </div>
        );
      })}
    </div>
  );
};

export const renderSingleGlyph = (token = "", originalText = "", isActive = true) => {
  const t = token.toLowerCase().trim();

  // Strip any custom animation tags like [left], [top], [right] from visible label
  const cleanLabel = (originalText || token).replace(/\[.*?\]/g, '').trim();

  if (t.includes('chapati') || t.includes('cookie') || t.includes('food') || t.includes('bread')) {
    return <ChapatiGlyph label={cleanLabel || "chapati"} isActive={isActive} />;
  }
  if (t.includes('teeth') || t.includes('chew') || t.includes('crush') || t.includes('wwww')) {
    return <TeethGlyph label={cleanLabel || "teeth"} isActive={isActive} />;
  }
  if (t.includes('tiny pieces') || t.includes('pieces') || t.includes('crumbs') || t.includes('small pieces')) {
    return <TinyPiecesGlyph label={cleanLabel || "tiny pieces"} isActive={isActive} />;
  }
  if (t.includes('saliva') || t.includes('water') || t.includes('droplet')) {
    return <SalivaGlyph label={cleanLabel || "saliva"} isActive={isActive} />;
  }
  if (t.includes('stomach') || t.includes('belly') || t.includes('organ')) {
    return <StomachGlyph label={cleanLabel || "stomach"} isActive={isActive} />;
  }
  if (t.includes('mixer') || t.includes('grinder') || t.includes('blender')) {
    return <MixerGrinderGlyph label={cleanLabel || "mixer-grinder"} isActive={isActive} />;
  }
  if (t.includes('dual_teeth') || t.includes('teeth_crush')) {
    return <DualTeethCrushGlyph label={cleanLabel || "small pieces"} isActive={isActive} />;
  }

  // Image URL
  if (token.startsWith('http://') || token.startsWith('https://')) {
    return (
      <div className="flex flex-col items-center justify-center p-1">
        <img 
          src={token} 
          alt="Chalk diagram" 
          className="max-h-24 sm:max-h-28 object-contain rounded-lg filter drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]"
        />
      </div>
    );
  }

  // Default: Chalk text box
  return (
    <div className="flex flex-col items-center justify-center px-3 py-1.5 rounded-xl border border-white/20 bg-white/5 backdrop-blur-sm shadow-[0_0_10px_rgba(255,255,255,0.1)]">
      <span 
        style={{ fontFamily: "var(--f-hand, 'Patrick Hand', cursive, sans-serif)" }}
        className="text-white text-base sm:text-xl font-bold italic tracking-wide"
      >
        {cleanLabel || token}
      </span>
    </div>
  );
};
