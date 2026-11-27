import React from 'react';
import HeaderBar from './home/HeaderBar.jsx';
import HeroSection from './home/HeroSection.jsx';
import ChaptersGrid from './home/ChaptersGrid.jsx';
import PlayWithFriends from './home/PlayWithFriends.jsx';
import TrialBanner from '../features/Subscription/TrialBanner.jsx';
import OfferTag from '../features/Subscription/OfferTag.jsx';

// Home screen for phones, built to the client's spec: header badges, free trial banner,
// Solve Squad hero, chapter cards and the Play with Friends bar. The bottom nav is shared app-wide.
export default function MobileHomeView({ stars, myRank, myStreak, chapters, loading, onContinue, onAllLessons, onShare, onBackHome }) {
  return (
    <div className="w-full font-sans select-none bg-[#F0F6FF]" style={{ paddingBottom: 'calc(88px + env(safe-area-inset-bottom, 0px))' }}>
      <HeaderBar stars={stars} myRank={myRank} myStreak={myStreak} />
      {/* Science landing (when the Gita world is live): back to the two doors */}
      {onBackHome && (
        <div className="px-3 mt-1">
          <button type="button" onClick={onBackHome} className="inline-flex items-center gap-1.5 rounded-full bg-white border border-blue-200 px-3 py-1.5 text-[13px] font-black text-[#1D4ED8] shadow-sm cursor-pointer active:scale-95">
            <span aria-hidden="true">←</span> Home
          </button>
        </div>
      )}
      <div className="px-3 mt-3 mb-1">
        <OfferTag rounded className="mb-2" />
        <TrialBanner />
      </div>
      <HeroSection />
      <ChaptersGrid chapters={chapters} loading={loading} onContinue={onContinue} onAllLessons={onAllLessons} />
      {/* Not on the Science landing: sharing lives on the two-world Home */}
      {!onBackHome && <PlayWithFriends onClick={onShare} />}
    </div>
  );
}
