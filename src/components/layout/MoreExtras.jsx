import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { isVibrationEnabled, setVibrationEnabled, vibrateMedium } from '../../utils/vibrationService.js';

// HoshiYaar's WhatsApp support line
export const SUPPORT_WHATSAPP = '918310532323';

const Chevron = () => (
  <svg className="w-4 h-4 text-blue-200 group-hover:text-blue-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);

/** "Refund or payment help" row: opens WhatsApp with the learner's account details filled in */
export function RefundRow({ className = '' }) {
  const { user } = useAuth();
  const who = [user?.name || user?.username, user?.phone].filter(Boolean).join(', ');
  const text = `Hi HoshiYaar team, I need help with a refund / payment for my Pro pass.${who ? ` Account: ${who}.` : ''}`;
  return (
    <a
      href={`https://wa.me/${SUPPORT_WHATSAPP}?text=${encodeURIComponent(text)}`}
      target="_blank"
      rel="noopener noreferrer"
      className={`w-full flex items-center justify-between p-4 hover:bg-blue-50/50 transition-all group ${className}`}
    >
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-green-50 flex items-center justify-center text-green-600">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12.04 2c-5.46 0-9.9 4.44-9.9 9.9 0 1.75.46 3.45 1.32 4.95L2 22l5.3-1.39a9.9 9.9 0 0 0 4.74 1.21h.01c5.46 0 9.9-4.44 9.9-9.9S17.5 2 12.04 2zm5.78 14.04c-.24.68-1.4 1.3-1.95 1.38-.5.08-1.13.11-1.82-.11-.42-.13-.96-.31-1.65-.61-2.9-1.25-4.79-4.17-4.94-4.37-.14-.19-1.18-1.57-1.18-3s.75-2.13 1.02-2.42c.27-.29.58-.36.78-.36h.56c.18 0 .42-.07.66.5.24.58.82 2.01.89 2.16.07.14.12.31.02.5-.1.19-.14.31-.29.48-.14.17-.3.38-.43.51-.14.14-.29.3-.13.59.17.29.74 1.22 1.59 1.97 1.09.97 2.01 1.27 2.3 1.41.29.14.46.12.63-.07.17-.19.72-.84.91-1.13.19-.29.38-.24.65-.14.27.1 1.69.8 1.98.94.29.14.48.22.55.34.07.12.07.7-.17 1.38z" />
          </svg>
        </div>
        <div className="text-left">
          <span className="block text-sm font-bold text-blue-900">Refund &amp; payment help</span>
          <span className="block text-[11px] font-semibold text-slate-500">Chat with us on WhatsApp</span>
        </div>
      </div>
      <Chevron />
    </a>
  );
}

/** On/off switch for vibration feedback (stored on this device) */
export function VibrationRow({ className = '' }) {
  const [on, setOn] = useState(() => isVibrationEnabled());
  const toggle = () => {
    const next = !on;
    setVibrationEnabled(next);
    setOn(next);
    if (next) vibrateMedium(); // a short buzz so you feel it's back on
  };
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={toggle}
      className={`w-full flex items-center justify-between p-4 hover:bg-blue-50/50 transition-all ${className}`}
    >
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <rect x="7" y="3" width="10" height="18" rx="2" strokeWidth={2} />
            <path strokeLinecap="round" strokeWidth={2} d="M3 9v6M21 9v6" />
          </svg>
        </div>
        <div className="text-left">
          <span className="block text-sm font-bold text-blue-900">Vibration</span>
          <span className="block text-[11px] font-semibold text-slate-500">Buzz on answers, taps and wins</span>
        </div>
      </div>
      <span className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors ${on ? 'bg-green-500' : 'bg-slate-300'}`}>
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${on ? 'translate-x-5' : 'translate-x-0.5'}`} />
      </span>
    </button>
  );
}
