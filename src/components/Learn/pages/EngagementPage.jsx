import { isNewStyleStory } from '../../../utils/comicStyleHelper.js';
import React, { useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useModuleItems } from '../../../hooks/useModuleItems';
import { useAuth } from '../../../context/AuthContext.jsx';
import { StarCounter } from '../../../context/StarsContext.jsx';
import ProgressBar from '../../ui/ProgressBar.jsx';
import SimpleLoading from '../../ui/SimpleLoading.jsx';
import ConceptExitConfirm from '../../modals/ConceptExitConfirm.jsx';
import EngagementPopup from '../blackboard/EngagementPopup.jsx';
import InlineEngagementCard from '../blackboard/InlineEngagementCard.jsx';
import authService from '../../../services/authService.js';
import LessonHeader from '../LessonHeader.jsx';
import { getStageInfoForIndex } from '../../../utils/moduleStages.js';
import { isMissionCompleteItem } from '../../../utils/missionCompleteHelper.js';
import { getCharacterImage, useCharacterImages } from '../../../utils/characterImages.js';

// Speaker pictures come from the shared, admin-editable character list
const getAvatarForSpeaker = (speaker = '') => getCharacterImage(speaker, 'arpit_sir');

const isAudioSpeak = (eng) => {
  if (!eng) return false;
  const t = String(eng.type || '').toLowerCase().trim();
  return t === 'engagement-audio' || t === 'audio' || t.includes('pronunciation') || t.includes('speak');
};

export default function EngagementPage() {
  useCharacterImages(); // redraw when admin-edited character pictures load
  const { moduleNumber, index } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const { items, loading, error } = useModuleItems(moduleNumber);
  const currentIndex = parseInt(index, 10) || 0;
  const currentItem = items?.[currentIndex];
  const prevItem = currentIndex > 0 ? items?.[currentIndex - 1] : null;

  const [showExitConfirm, setShowExitConfirm] = useState(false);

  function routeForType(type, idx) {
    const t = String(type || '').toLowerCase();
    if (t.startsWith('engagement')) return `/learn/module/${moduleNumber}/engagement/${idx}`;
    switch (t) {
      case 'multiple-choice': return `/learn/module/${moduleNumber}/mcq/${idx}`;
      case 'fill-in-the-blank': return `/learn/module/${moduleNumber}/fillups/${idx}`;
      case 'rearrange': return `/learn/module/${moduleNumber}/rearrange/${idx}`;
      case 'descriptive': return `/learn/module/${moduleNumber}/descriptive/${idx}`;
      case 'didyouknow':
      case 'did_you_know':
      case 'did-you-know':
      case 'remember':
        return `/learn/module/${moduleNumber}/didyouknow/${idx}`;
      case 'story':
        return `/learn/module/${moduleNumber}/story/${idx}`;
      case 'comic': {
        const nextIt = items?.[idx];
        const chId = typeof chapterIdParam !== 'undefined' ? chapterIdParam : (typeof chapterId !== 'undefined' ? chapterId : '');
        const isNew = isNewStyleStory({ item: nextIt, items, chapterId: chId });
        return isNew
          ? `/learn/module/${moduleNumber}/story/${idx}`
          : `/learn/module/${moduleNumber}/concept/${idx}`;
      }
      case 'blackboard':
      case 'blackboard-step':
      case 'board':
        return `/learn/module/${moduleNumber}/blackboard/${idx}`;
      case 'concept':
      case 'statement':
      case 'video':
      default:
        return `/learn/module/${moduleNumber}/concept/${idx}`;
    }
  }

  const handleBack = () => {
    if (currentIndex > 0 && items) {
      const prevIdx = currentIndex - 1;
      const prevIt = items[prevIdx];
      const params = new URLSearchParams(window.location.search);
      navigate(`${routeForType(prevIt?.type || 'concept', prevIdx)}${params.toString() ? '?' + params.toString() : ''}`);
    } else {
      setShowExitConfirm(true);
    }
  };

  const handleComplete = async () => {
    try {
      if (user?._id) {
        authService.updateProgress({
          userId: user._id,
          moduleId: String(moduleNumber),
          subject: user.subject || 'Science',
          conceptCompleted: false
        });
      }
    } catch (_) {}

    const nextIndex = currentIndex + 1;
    const params = new URLSearchParams(window.location.search);
    const persistent = new URLSearchParams();
    ['title', 'chapterId', 'unitId', 'review', 'revision'].forEach((key) => {
      const value = params.get(key);
      if (value !== null && value !== '') {
        persistent.set(key, value);
      }
    });
    const suffix = persistent.toString() ? `?${persistent.toString()}` : '';

    if (!items || nextIndex >= items.length || isMissionCompleteItem(items[nextIndex])) {
      try {
        if (user?._id) {
          authService.updateProgress({
            userId: user._id,
            moduleId: String(moduleNumber),
            subject: user.subject || 'Science',
            conceptCompleted: true
          });
        }
      } catch (_) {}

      const completionParams = new URLSearchParams();
      completionParams.set('moduleId', String(moduleNumber));
      completionParams.set('chapter', String(moduleNumber));
      if (params.get('chapterId')) completionParams.set('chapterId', params.get('chapterId'));
      if (params.get('unitId')) completionParams.set('unitId', params.get('unitId'));
      return navigate(`/lesson-complete?${completionParams.toString()}`);
    }

    const nextItem = items[nextIndex];
    navigate(`${routeForType(nextItem?.type || 'concept', nextIndex)}${suffix}`);
  };

  if (loading) {
    return <SimpleLoading text="Loading..." />;
  }

  if (error || !currentItem) {
    return (
      <div className="min-h-screen bg-[#0E1724] text-white flex flex-col items-center justify-center p-4">
        <p className="text-lg font-bold mb-4">Could not load question</p>
        <button 
          onClick={() => navigate('/learn')} 
          className="px-6 py-2.5 bg-[#1F6FE5] rounded-xl font-bold text-white shadow-md"
        >
          Back to Lessons
        </button>
      </div>
    );
  }

  const totalItems = items?.length || 1;
  const progressPercent = Math.min(100, Math.max(5, ((currentIndex + 1) / totalItems) * 100));

  const isAudioType = isAudioSpeak(currentItem);
  const stageInfo = getStageInfoForIndex(items, currentIndex);

  // ── NON-AUDIO ENGAGEMENTS: RENDER IN TEXT SERIES VIEW (NOT POPUP) ──
  if (!isAudioType) {
    const speakerName = currentItem.speaker || 'Arpit Sir';
    const speakerAvatar = getAvatarForSpeaker(speakerName);

    return (
      <div className="relative min-h-screen max-h-[100dvh] w-full bg-[#0E1724] text-white flex flex-col justify-between overflow-hidden font-sans select-none">
        {/* Top Header Bar */}
        <LessonHeader
          onBack={handleBack}
          title="CHALLENGE"
          currentIndex={currentIndex}
          total={totalItems}
          stageInfo={stageInfo}
          theme="blackboard"
        />

        {/* Central Text Series Card View */}
        <div className="flex-1 w-full max-w-2xl sm:max-w-3xl md:max-w-4xl mx-auto px-3.5 sm:px-6 py-6 flex flex-col justify-center overflow-y-auto no-scrollbar">
          <div className="w-full p-4 sm:p-5 rounded-[22px] bg-[#0A111A]/90 border border-[#1F6FE5] shadow-[0_0_24px_rgba(31,111,229,0.32)] ring-1 ring-[#1F6FE5]/60 flex items-start gap-3.5">
            {/* Avatar thumbnail */}
            <div className="w-14 h-14 min-w-[56px] min-h-[56px] max-w-[56px] max-h-[56px] rounded-full overflow-hidden bg-[#182332] flex-shrink-0 border-2 border-[#1F6FE5] shadow-[0_0_12px_rgba(31,111,229,0.5)]">
              <img 
                src={speakerAvatar} 
                alt={speakerName} 
                className="w-full h-full object-cover rounded-full"
              />
            </div>

            {/* Content area */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span 
                  style={{ fontFamily: "'Nunito', sans-serif" }}
                  className="block text-xs sm:text-sm font-black uppercase tracking-wider text-[#1F6FE5]"
                >
                  QUICK QUESTION
                </span>
              </div>

              {/* Context or narration statement if provided */}
              {(currentItem.statement || (currentItem.text && currentItem.text !== currentItem.question)) && (
                <p 
                  style={{ 
                    fontFamily: "'Fredoka', Trebuchet MS, sans-serif",
                    lineHeight: "1.35"
                  }}
                  className="text-[17px] sm:text-[19px] md:text-[21px] font-medium leading-[1.35] text-white select-text mb-2"
                >
                  {currentItem.statement || currentItem.text}
                </p>
              )}

              {/* Inline Engagement Options */}
              <InlineEngagementCard
                item={currentItem}
                onComplete={handleComplete}
                onSkip={handleComplete}
              />
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div 
          style={{ fontFamily: "'Nunito', sans-serif" }}
          className="w-full max-w-2xl sm:max-w-3xl md:max-w-4xl mx-auto px-3 sm:px-6 pt-3 pb-8 sm:pb-10 flex items-center justify-between gap-2 sm:gap-3 flex-shrink-0 z-20"
        >
          <button
            onClick={handleBack}
            className="flex-1 h-[52px] rounded-[16px] sm:rounded-[18px] bg-[#0D1623] text-slate-200 hover:text-white hover:bg-[#121E30] border border-white/10 flex items-center justify-center gap-1 sm:gap-2 font-black text-xs sm:text-base transition-all shadow-md active:scale-95 cursor-pointer"
          >
            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            <span>Prev</span>
          </button>

          <button
            onClick={handleComplete}
            className="flex-1 h-[52px] rounded-[16px] sm:rounded-[18px] bg-[#1F6FE5] hover:bg-[#185BC5] active:bg-[#1550B0] text-white font-black text-xs sm:text-base flex items-center justify-center gap-1 sm:gap-2 transition-all shadow-[0_4px_20px_rgba(31,111,229,0.45)] border border-[#7CD3FF]/30 active:scale-95 cursor-pointer"
          >
            <span>Next</span>
            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Exit Modal */}
        {showExitConfirm && (
          <ConceptExitConfirm 
            onQuit={() => navigate('/learn')} 
            onContinue={() => setShowExitConfirm(false)} 
          />
        )}
      </div>
    );
  }

  // ── AUDIO SPEAK ENGAGEMENTS: RENDER MODAL POPUP BOTTOM-SHEET ──
  return (
    <div className="relative min-h-screen max-h-[100dvh] w-full bg-[#0E1724] text-white flex flex-col overflow-hidden font-sans select-none">
      
      {/* ── BACKGROUND LESSON UI (PAUSED, BLURRED, DIMMED, NON-INTERACTIVE) ── */}
      <div 
        className="flex-1 flex flex-col overflow-hidden filter blur-[4px] opacity-25 brightness-50 pointer-events-none select-none transition-all duration-300"
        aria-hidden="true"
      >
        {/* Top Header Bar (Unified Lesson Header) */}
        <LessonHeader
          onBack={() => {}}
          title="CHALLENGE"
          currentIndex={currentIndex}
          total={totalItems}
          stageInfo={stageInfo}
          theme="blackboard"
        />

        {/* Backdrop Content (Preview of previous card or lesson context) */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-lg mx-auto">
          <div className="w-20 h-20 rounded-full bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-3xl mb-4">
            💡
          </div>
          <h2 className="text-2xl font-black text-white mb-2">
            {prevItem?.cardTitle || prevItem?.question || currentItem?.cardTitle || 'Lesson in progress'}
          </h2>
          <p className="text-base text-slate-300">
            {prevItem?.text || prevItem?.statement || 'Reviewing concepts and key terms.'}
          </p>
        </div>
      </div>

      {/* ── INTERACTIVE ENGAGEMENT POPUP OVERLAY (AUDIO SPEAK ONLY) ── */}
      <EngagementPopup 
        item={currentItem} 
        onComplete={handleComplete} 
      />

      {/* ── EXIT CONFIRMATION MODAL ── */}
      {showExitConfirm && (
        <ConceptExitConfirm 
          onQuit={() => navigate('/learn')} 
          onContinue={() => setShowExitConfirm(false)} 
        />
      )}
    </div>
  );
}
