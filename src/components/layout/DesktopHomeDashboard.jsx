import React from 'react';
import HomeProgressCards from './HomeProgressCards.jsx';

const DesktopHomeDashboard = ({
  user,
  leaderboardData,
  chaptersList,
  chapterStats,
  currentChapterId,
  onSelectChapter,
  onNavigateToPractice,
}) => {
  return (
    <div className="w-full h-full bg-[#F0F6FF] font-sans flex flex-col overflow-y-auto relative p-4 lg:px-6 lg:py-4 pb-28 lg:pb-3">
      <HomeProgressCards
        user={user}
        leaderboardData={leaderboardData}
        chaptersList={chaptersList}
        chapterStats={chapterStats}
        currentChapterId={currentChapterId}
        onSelectChapter={onSelectChapter}
        onNavigateToPractice={onNavigateToPractice}
        isMobile={false}
      />
    </div>
  );
};

export default DesktopHomeDashboard;
