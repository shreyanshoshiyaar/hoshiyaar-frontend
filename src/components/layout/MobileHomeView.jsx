import React from 'react';
import HeaderBar from './home/HeaderBar.jsx';
import HeroSection from './home/HeroSection.jsx';
import ChaptersGrid from './home/ChaptersGrid.jsx';
import PlayWithFriends from './home/PlayWithFriends.jsx';
import TrialBanner from '../features/Subscription/TrialBanner.jsx';

// Home screen for phones, built to the client's spec: header badges, free trial banner,
// Solve Squad hero, chapter cards and the Play with Friends bar. The bottom nav is shared app-wide.
export default function MobileHomeView({ stars, myRank, myStreak, chapters, loading, onContinue, onAllLessons, onShare }) {
  return (
    <div className="w-full font-sans select-none bg-[#F0F6FF]" style={{ paddingBottom: 'calc(88px + env(safe-area-inset-bottom, 0px))' }}>
      <HeaderBar stars={stars} myRank={myRank} myStreak={myStreak} />
      <div className="px-3 mt-3">
        <TrialBanner />
      </div>
      <HeroSection />
      <ChaptersGrid chapters={chapters} loading={loading} onContinue={onContinue} onAllLessons={onAllLessons} />
      <PlayWithFriends onClick={onShare} />
    </div>
  );
}
