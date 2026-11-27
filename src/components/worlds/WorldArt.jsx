import React from 'react';

// Small drawn emblems for the two worlds (no images to download, crisp at any size)

export const AtomArt = ({ className = '' }) => (
  <svg viewBox="0 0 120 120" className={className} aria-hidden="true">
    <defs>
      <radialGradient id="hyAtomCore" cx="50%" cy="45%" r="55%">
        <stop offset="0%" stopColor="#FEF3C7" />
        <stop offset="100%" stopColor="#F59E0B" />
      </radialGradient>
    </defs>
    <g fill="none" stroke="#FFFFFF" strokeWidth="4" strokeOpacity="0.9">
      <ellipse cx="60" cy="60" rx="50" ry="19" />
      <ellipse cx="60" cy="60" rx="50" ry="19" transform="rotate(60 60 60)" />
      <ellipse cx="60" cy="60" rx="50" ry="19" transform="rotate(120 60 60)" />
    </g>
    <circle cx="60" cy="60" r="12" fill="url(#hyAtomCore)" />
    <circle cx="110" cy="60" r="5" fill="#BFDBFE" />
    <circle cx="35" cy="17" r="5" fill="#BFDBFE" />
    <circle cx="35" cy="103" r="5" fill="#BFDBFE" />
  </svg>
);

// A lotus over a chariot wheel: the Gita's setting (Arjuna's chariot) and its calm
export const LotusArt = ({ className = '' }) => (
  <svg viewBox="0 0 120 120" className={className} aria-hidden="true">
    <defs>
      <linearGradient id="hyPetal" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#FFF7ED" />
        <stop offset="100%" stopColor="#FDBA74" />
      </linearGradient>
    </defs>
    <g fill="none" stroke="#FFFFFF" strokeOpacity="0.55" strokeWidth="3">
      <circle cx="60" cy="72" r="40" />
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i * Math.PI) / 6;
        return <line key={i} x1={60 + Math.cos(a) * 12} y1={72 + Math.sin(a) * 12} x2={60 + Math.cos(a) * 40} y2={72 + Math.sin(a) * 40} />;
      })}
    </g>
    <g fill="url(#hyPetal)" stroke="#EA580C" strokeWidth="1.5" strokeOpacity="0.5">
      <path d="M60 18 C70 34 72 52 60 70 C48 52 50 34 60 18Z" />
      <path d="M60 70 C50 58 36 48 20 46 C26 62 40 72 60 70Z" />
      <path d="M60 70 C70 58 84 48 100 46 C94 62 80 72 60 70Z" />
      <path d="M60 70 C54 56 44 44 34 38 C34 54 44 66 60 70Z" />
      <path d="M60 70 C66 56 76 44 86 38 C86 54 76 66 60 70Z" />
    </g>
    <circle cx="60" cy="72" r="5" fill="#FDE68A" />
  </svg>
);
