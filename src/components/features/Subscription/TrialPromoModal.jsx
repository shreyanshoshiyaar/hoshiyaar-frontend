import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAccess, trialMsLeft } from '../../../context/AccessContext.jsx';
import { useAuth } from '../../../context/AuthContext.jsx';
import { useServerNow } from '../../../hooks/useServerNow.js';
import GuestVerifyModal from '../../forms/GuestVerifyModal.jsx';
import PaywallModal from './PaywallModal.jsx';

const StopwatchIcon = ({ className = '' }) => (
  <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
    <defs>
      <linearGradient id="promoGold" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#FDE68A" />
        <stop offset="55%" stopColor="#F59E0B" />
        <stop offset="100%" stopColor="#B45309" />
      </linearGradient>
    </defs>
    <rect x="19" y="2" width="10" height="5" rx="2" fill="url(#promoGold)" />
    <rect x="22" y="6" width="4" height="5" fill="#D97706" />
    <rect x="35" y="9" width="6" height="4" rx="1.5" transform="rotate(45 38 11)" fill="#D97706" />
    <circle cx="24" cy="27" r="18" fill="url(#promoGold)" />
    <circle cx="24" cy="27" r="13.5" fill="#1E1B4B" />
    <circle cx="24" cy="27" r="13.5" fill="none" stroke="#FDE68A" strokeOpacity="0.5" strokeWidth="1" />
    <path d="M24 17v10l6 4" stroke="#FDE68A" strokeWidth="3" strokeLinecap="round" fill="none" />
  </svg>
);

const clockParts = (ms) => {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return { h, m, s };
};

/**
 * TrialPromoModal: High-converting, non-intrusive modal that pops up 2-3 times max
 * on app open / returning to the Home screen during the 48-hour free trial.
 */
export default function TrialPromoModal({ isOpen, onClose }) {
  const { access, refresh } = useAccess();
  const { user } = useAuth();
  const now = useServerNow();
  const navigate = useNavigate();

  const [showGuestVerify, setShowGuestVerify] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);

  if (!isOpen || !access || access.state === 'pass') return null;

  const msLeft = trialMsLeft(access, now);
  const notStarted = access.state === 'trial_not_started';
  const clock = notStarted ? { h: access.trialHours || 48, m: 0, s: 0 } : clockParts(msLeft);

  const planPrice = access?.plan?.amount ?? 99;
  const planOriginalPrice = access?.plan?.discountedFrom ?? 599;

  const handleGoPro = () => {
    if (access?.isGuest || user?.isGuest) {
      setShowGuestVerify(true);
      return;
    }
    setShowPaywall(true);
  };

  return (
    <>
      <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/75 backdrop-blur-md p-4 font-sans select-none animate-fade-in">
        <div className="relative w-full max-w-sm rounded-[32px] p-[2.5px] bg-gradient-to-br from-[#FDE68A] via-[#F59E0B] to-[#B45309] shadow-[0_20px_50px_rgba(76,29,149,0.5)] animate-in zoom-in-95 duration-300">
          
          {/* Card inner */}
          <div className="relative overflow-hidden rounded-[30px] bg-gradient-to-br from-[#2E0854] via-[#4C1D95] to-[#1E1B4B] p-6 text-center text-white">
            
            {/* Soft decorative background glows */}
            <span className="pointer-events-none absolute -top-12 -left-12 w-48 h-48 rounded-full bg-[radial-gradient(closest-side,rgba(252,211,77,0.22),transparent)]" aria-hidden="true" />
            <span className="pointer-events-none absolute -bottom-16 -right-12 w-52 h-52 rounded-full bg-[radial-gradient(closest-side,rgba(168,85,247,0.35),transparent)]" aria-hidden="true" />

            {/* Close 'X' button */}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-white/80 hover:text-white flex items-center justify-center text-xs font-bold transition-all cursor-pointer z-20"
            >
              ✕
            </button>

            {/* Top Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/20 to-purple-500/20 border border-amber-300/40 text-amber-300 text-[11px] font-black uppercase tracking-wider mb-4 shadow-sm">
              <span className="text-sm">👑</span>
              <span>Exclusive Pro Offer</span>
            </div>

            {/* Stopwatch & Big Live Timer Box */}
            <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white/5 border border-white/10 mb-4 backdrop-blur-xs">
              <div className="flex items-center gap-2 mb-1">
                <StopwatchIcon className="w-6 h-6 shrink-0" />
                <span className="text-xs font-black uppercase tracking-[0.18em] text-amber-300">
                  {notStarted ? '48-Hour Free Trial' : 'Free Trial Ending Soon'}
                </span>
              </div>

              {/* Huge Live Clock */}
              <p className="font-black tabular-nums tracking-tight text-3xl sm:text-4xl text-white leading-none my-1">
                {clock.h > 0 && (
                  <>
                    {clock.h}<span className="text-sm font-black text-indigo-200 ml-0.5 mr-1.5">h</span>
                  </>
                )}
                {String(clock.m).padStart(clock.h > 0 ? 2 : 1, '0')}<span className="text-sm font-black text-indigo-200 ml-0.5 mr-1.5">m</span>
                {String(clock.s ?? 0).padStart(2, '0')}<span className="text-sm font-black text-indigo-200 ml-0.5">s</span>
              </p>

              <span className="text-[12px] font-bold text-indigo-200/80">
                {notStarted ? 'Starts on your first lesson' : 'Remaining to unlock special relaunch pricing'}
              </span>
            </div>

            {/* Headline & Value Prop */}
            <h3 className="text-xl font-black text-white leading-tight mb-1.5">
              Unlock All Lessons &amp; Chapters
            </h3>
            <p className="text-xs font-medium text-indigo-100/90 leading-relaxed mb-5 px-2">
              Get full 6-month access to every chapter, story mode, quizzes &amp; boards across Class 6, 7 &amp; 8.
            </p>

            {/* Pricing Pill */}
            <div className="flex items-center justify-center gap-2.5 mb-5">
              <span className="text-3xl font-black text-white tracking-tight leading-none">
                ₹{planPrice}
              </span>
              <span className="text-base font-bold text-white/50 line-through decoration-rose-400 decoration-2">
                ₹{planOriginalPrice}
              </span>
              <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-[11px] font-black uppercase tracking-wider">
                83% OFF
              </span>
            </div>

            {/* Main CTA */}
            <button
              type="button"
              onClick={handleGoPro}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-b from-[#FEF3C7] via-[#FCD34D] to-[#F59E0B] text-[#3B0764] font-black text-base shadow-[0_4px_0_0_#B45309,0_0_24px_rgba(252,211,77,0.5)] active:translate-y-0.5 active:shadow-none hover:brightness-105 transition-all cursor-pointer flex items-center justify-center gap-2 mb-3"
            >
              <span>Go Pro Now</span>
              <span className="text-lg">→</span>
            </button>

            {/* Secondary CTA: Keep browsing trial */}
            <button
              type="button"
              onClick={onClose}
              className="text-xs font-semibold text-indigo-200/70 hover:text-white transition-colors cursor-pointer py-1"
            >
              Continue with Free Trial
            </button>

          </div>
        </div>
      </div>

      {showGuestVerify && (
        <GuestVerifyModal
          onClose={() => {
            setShowGuestVerify(false);
            refresh();
          }}
        />
      )}

      {showPaywall && (
        <PaywallModal
          isOpen={showPaywall}
          onClose={() => {
            setShowPaywall(false);
            onClose();
          }}
          onSuccess={() => {
            setShowPaywall(false);
            onClose();
            navigate('/learn');
          }}
        />
      )}
    </>
  );
}
