import React from 'react';
import HomeProgressCards from './HomeProgressCards.jsx';

const MobileHome = ({
  user,
  leaderboardData,
  chaptersList,
  chapterStats,
  currentChapterId,
  onSelectChapter,
  onNavigateToPractice,
}) => {
  return (
    <div className="w-full max-w-full flex-1 min-h-0 bg-[#F0F6FF] font-sans flex flex-col overflow-y-auto overflow-x-hidden md:hidden relative">
      <HomeProgressCards
        user={user}
        leaderboardData={leaderboardData}
        chaptersList={chaptersList}
        chapterStats={chapterStats}
        currentChapterId={currentChapterId}
        onSelectChapter={onSelectChapter}
        onNavigateToPractice={onNavigateToPractice}
        isMobile={true}
      />
    </div>
  );
};

export default MobileHome;
