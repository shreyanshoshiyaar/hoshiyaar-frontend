import React, { useState } from 'react';
import ReportProblemModal from '../modals/ReportProblemModal.jsx';
import { vibrateLight } from '../../utils/vibrationService.js';

export default function ReportFlagButton({
  itemId = '',
  moduleId = '',
  chapterId = '',
  questionText = '',
  screenName = '',
  className = '',
  theme = 'light'
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const isDark = theme === 'dark' || theme === 'blackboard' || theme === 'hotzone' || theme === 'exam';

  const handleClick = (e) => {
    e.stopPropagation();
    vibrateLight();
    setModalOpen(true);
  };

  const buttonStyle = isDark
    ? 'bg-[#122238] hover:bg-[#1a2f4c] border-2 border-slate-600 text-slate-100 shadow-[2px_3px_0px_0px_#060D17]'
    : 'bg-white hover:bg-slate-50 border-2 border-[#101F33] text-[#101F33] shadow-[2px_3px_0px_0px_#101F33]';

  const iconColor = isDark ? 'text-slate-100' : 'text-[#101F33]';

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        title="Report a problem with this screen"
        aria-label="Report a problem"
        className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl active:translate-x-[1px] active:translate-y-[2px] active:shadow-none transition-all flex items-center justify-center cursor-pointer flex-shrink-0 ${buttonStyle} ${className}`}
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          viewBox="0 0 24 24" 
          fill="currentColor" 
          className={`w-4 h-4 sm:w-4.5 sm:h-4.5 ${iconColor}`}
        >
          <path 
            fillRule="evenodd" 
            d="M3 2.25a.75.75 0 01.75.75v.54l1.838-.46a9.75 9.75 0 016.725.738l.108.054A8.25 8.25 0 0018 4.5V14.25a.75.75 0 01-.55.723 9.75 9.75 0 01-6.725-.738l-.108-.054A8.25 8.25 0 005.25 13.5v6.75a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75z" 
            clipRule="evenodd" 
          />
        </svg>
      </button>

      <ReportProblemModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        itemId={itemId}
        moduleId={moduleId}
        chapterId={chapterId}
        questionText={questionText}
        screenName={screenName}
      />
    </>
  );
}
