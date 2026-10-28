import React from 'react';
import ProgressBar from '../ui/ProgressBar.jsx';
import { StarCounter } from '../../context/StarsContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { isUserAdmin } from '../../utils/adminCheck.js';

export default function LessonHeader({
  onBack,
  title = 'LEARN PROGRESS',
  currentIndex = 0,
  total = 1,
  showProgress = true,
  showCount = true,
  theme = 'light', // 'light' | 'dark' | 'blackboard' | 'hotzone' | 'exam'
  onSkip,
  canMasterSkip,
  rightExtra = null,
  stageNumber: propStageNumber = null,
  totalStages: propTotalStages = null,
  stageInfo = null,
  className = ''
}) {
  const { user } = useAuth() || {};
  const isMasterUser = canMasterSkip ?? isUserAdmin(user);

  const isDark = theme === 'dark' || theme === 'blackboard' || theme === 'hotzone' || theme === 'exam';

  const getTitleColor = () => {
    switch (theme) {
      case 'blackboard':
        return 'text-[#38BDF8]'; // Chalk sky blue
      case 'hotzone':
        return 'text-[#FF8A48]'; // Fire orange
      case 'exam':
        return 'text-[#7BB1FF]'; // Exam blue
      default:
        return 'text-blue-600/90';
    }
  };

  const stageNumber = stageInfo?.stageNumber ?? propStageNumber;
  const totalStages = stageInfo?.totalStages ?? propTotalStages;
  const stageTitle = stageInfo?.stageTitle || title;
  const itemCountInStage = stageInfo?.itemCountInStage || 1;
  const stageStartIndex = stageInfo?.stageStartIndex ?? 0;
  const stageIndexInStage = Math.max(0, currentIndex - stageStartIndex);

  // Smooth progress calculation across stages
  let smoothPercent = null;
  if (stageNumber && totalStages && totalStages > 1) {
    const stageBase = (stageNumber - 1) / totalStages;
    const stageProgress = (stageIndexInStage + 1) / Math.max(1, itemCountInStage);
    const overallFraction = stageBase + (stageProgress * (1 / totalStages));
    smoothPercent = Math.min(100, Math.max(5, Math.round(overallFraction * 100)));
  } else {
    smoothPercent = Math.min(100, Math.max(5, Math.round(((currentIndex + 1) / Math.max(total || 1, 1)) * 100)));
  }

  // Header Title
  let displayTitle = stageTitle;
  let mobileTitle = stageTitle;

  if (stageNumber && totalStages && totalStages > 1) {
    if (stageTitle.toUpperCase().includes('PRACTICE')) {
      displayTitle = `PRACTICE · STAGE ${stageNumber} OF ${totalStages} (${stageIndexInStage + 1}/${itemCountInStage})`;
      mobileTitle = `STAGE ${stageNumber} OF ${totalStages} · PRACTICE`;
    } else {
      displayTitle = `${stageTitle} · STAGE ${stageNumber} OF ${totalStages}`;
      mobileTitle = `STAGE ${stageNumber} OF ${totalStages}`;
    }
  } else {
    if (showCount && total > 1) {
      displayTitle = `${stageTitle} · ${Math.min(currentIndex + 1, total)}/${total}`;
      mobileTitle = `${stageTitle} (${Math.min(currentIndex + 1, total)}/${total})`;
    } else {
      displayTitle = stageTitle;
      mobileTitle = stageTitle;
    }
  }

  return (
    <div className={`w-full max-w-5xl mx-auto flex items-center justify-between p-2 sm:p-3 md:p-4 flex-shrink-0 z-40 transition-colors duration-200 ${className}`}>
      {/* Back Button */}
      <button
        onClick={onBack}
        type="button"
        title="Back"
        aria-label="Back"
        className={`w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center rounded-full transition-all active:scale-95 cursor-pointer flex-shrink-0 ${
          isDark 
            ? 'bg-white/10 hover:bg-white/20 text-white border border-white/15 backdrop-blur-md shadow-xs' 
            : 'bg-white/90 hover:bg-white text-gray-700 border border-slate-200/80 backdrop-blur-md shadow-xs'
        }`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5 sm:w-6 sm:h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
        </svg>
      </button>

      {/* Center: Title Badge & Progress Bar */}
      <div className="flex-1 mx-1.5 sm:mx-4 md:mx-6 flex flex-col items-center min-w-0 max-w-sm sm:max-w-lg">
        {displayTitle && (
          <div className="w-full flex items-center justify-center mb-0.5">
            {/* Mobile: compact title that NEVER truncates */}
            <span 
              style={{ fontFamily: "'Nunito', sans-serif" }}
              className={`block sm:hidden text-[11px] font-black uppercase tracking-tight text-center truncate px-1 ${getTitleColor()}`}
            >
              {mobileTitle}
            </span>
            {/* Tablet & Desktop: full title */}
            <span 
              style={{ fontFamily: "'Nunito', system-ui, sans-serif" }}
              className={`hidden sm:block sm:text-base md:text-lg font-black uppercase tracking-wide text-center truncate px-1 ${getTitleColor()}`}
            >
              {displayTitle}
            </span>
          </div>
        )}
        {showProgress && (
          <ProgressBar 
            percent={smoothPercent}
            className={isDark ? 'bg-white/20' : 'bg-gray-200/80'}
          />
        )}
      </div>

      {/* Right: Actions + StarCounter */}
      <div 
        style={{ fontFamily: "'Nunito', sans-serif" }}
        className="flex items-center gap-1 sm:gap-2 md:gap-3 flex-shrink-0"
      >
        {rightExtra}

        {/* Skip is an admin tool for moving through lessons; students don't see it */}
        {onSkip && isMasterUser && (
          <button
            onClick={onSkip}
            type="button"
            style={{ fontFamily: "'Nunito', sans-serif" }}
            className="px-2.5 sm:px-3 py-1 bg-yellow-500 hover:bg-yellow-600 text-white text-[11px] sm:text-xs font-black rounded-lg shadow-sm border-b-2 sm:border-b-4 border-yellow-700 active:border-b-0 active:translate-y-1 transition-all uppercase cursor-pointer"
          >
            Skip ⚡️
          </button>
        )}

        <div className={isDark ? 'text-white' : 'text-gray-800'}>
          <StarCounter className={isDark ? 'text-white' : 'text-gray-800'} />
        </div>
      </div>
    </div>
  );
}
