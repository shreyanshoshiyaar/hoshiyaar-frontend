import { isNewStyleStory } from '../../../utils/comicStyleHelper.js';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useModuleItems } from '../../../hooks/useModuleItems';
import { useAuth } from '../../../context/AuthContext.jsx';
import ProgressBar from '../../ui/ProgressBar.jsx';
import SimpleLoading from '../../ui/SimpleLoading.jsx';
import ConceptExitConfirm from '../../modals/ConceptExitConfirm.jsx';
import { isUserAdmin } from '../../../utils/adminCheck.js';
import LessonHeader from '../LessonHeader.jsx';
import { getStageInfoForIndex } from '../../../utils/moduleStages.js';
import { playTtsAudio } from '../../../utils/audioPreloadService.js';

export default function DidYouKnowPage() {
  const { moduleNumber, index } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const { items, loading, error } = useModuleItems(moduleNumber);
  const currentIndex = parseInt(index, 10) || 0;
  const currentItem = items?.[currentIndex];

  const [isFlipped, setIsFlipped] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [showReportToast, setShowReportToast] = useState(false);

  const searchSuffix = location.search || '';

  // Clean navigation helper for item types
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

  // Back navigation
  const handleBack = useCallback(() => {
    if (currentIndex > 0 && items) {
      const prevIdx = currentIndex - 1;
      const prevItem = items[prevIdx];
      navigate(`${routeForType(prevItem?.type || 'concept', prevIdx)}${searchSuffix}`);
    } else {
      setShowExitConfirm(true);
    }
  }, [currentIndex, items, moduleNumber, navigate, searchSuffix]);

  // Advance to next item or finish module
  const handleContinue = useCallback(() => {
    if (!items) return;
    const nextIdx = currentIndex + 1;
    if (nextIdx < items.length) {
      const nextItem = items[nextIdx];
      navigate(`${routeForType(nextItem?.type || 'concept', nextIdx)}${searchSuffix}`);
    } else {
      // Last item: proceed to lesson complete
      const searchParams = new URLSearchParams(location.search);
      const completionParams = new URLSearchParams();
      completionParams.set('moduleId', String(moduleNumber));
      completionParams.set('chapter', String(moduleNumber));
      const chapId = searchParams.get('chapterId');
      const unitId = searchParams.get('unitId');
      const title = searchParams.get('title');
      if (chapId) completionParams.set('chapterId', chapId);
      if (unitId) completionParams.set('unitId', unitId);
      if (title) completionParams.set('title', title);
      navigate(`/lesson-complete?${completionParams.toString()}`);
    }
  }, [currentIndex, items, moduleNumber, navigate, location.search, searchSuffix]);

  // Keyboard shortcut: Space or Enter to flip or continue
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Enter') {
        if (!isFlipped) {
          setIsFlipped(true);
        } else {
          handleContinue();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFlipped, handleContinue]);

  // TTS Read Aloud for back of card
  const playFactAudio = (e) => {
    e.stopPropagation();
    if (isPlayingAudio) {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setIsPlayingAudio(false);
      return;
    }

    const textToSpeak = currentItem?.text || currentItem?.question || currentItem?.statement || '';
    if (!textToSpeak) return;

    setIsPlayingAudio(true);
    playTtsAudio(textToSpeak, currentItem?.speaker || 'Arpit Sir', () => setIsPlayingAudio(false));
  };

  const handleReport = () => {
    setShowReportToast(true);
    setTimeout(() => setShowReportToast(false), 2500);
  };

  const handleEditCard = () => {
    navigate(`/admin/content?moduleId=${moduleNumber}&itemIndex=${currentIndex}`);
  };

  if (loading) return <SimpleLoading text="Loading knowledge card..." />;
  if (error || !currentItem) {
    return (
      <div className="min-h-screen bg-[#F4FBF6] flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-xl font-black text-slate-800 mb-2">Item Not Found</h2>
        <p className="text-slate-500 mb-6">{error || "Could not load this card."}</p>
        <button
          onClick={() => navigate('/learn')}
          className="px-6 py-3 rounded-2xl bg-[#1F9D63] text-white font-bold"
        >
          Back to map
        </button>
      </div>
    );
  }

  // Resolve card content & image
  const factText = currentItem.text || currentItem.question || currentItem.statement || '';
  const frontTitle = currentItem.cardTitle || "Did you know?";
  const cardImage = 
    currentItem.imageUrl || 
    (Array.isArray(currentItem.images) && currentItem.images[0]) || 
    (typeof currentItem.images === 'string' && currentItem.images) || 
    null;

  return (
    <div className="min-h-screen w-full bg-[#F4FBF6] flex flex-col justify-between items-center select-none overflow-x-hidden">
      {/* ── TOP HEADER (Unified Lesson Header) ── */}
      {(() => {
        const stageInfo = getStageInfoForIndex(items, currentIndex);
        return (
          <LessonHeader
            onBack={handleBack}
            title="REMEMBER"
            currentIndex={currentIndex}
            total={items.length}
            stageInfo={stageInfo}
            theme="light"
            onSkip={handleContinue}
          />
        );
      })()}

      {/* Report Toast */}
      {showReportToast && (
        <div className="fixed top-16 z-50 bg-[#101F33] text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg animate-fade-in">
          ✓ Feedback reported. Thank you!
        </div>
      )}

      {/* ── MAIN CONTENT AREA (3D FLIP CARD) ── */}
      <div className="flex-1 w-full max-w-sm sm:max-w-md px-4 py-2 flex flex-col justify-center items-center relative">
        {/* Floating Action Pills (Top Right) */}
        <div className="w-full flex justify-end items-center gap-2 mb-2 z-20">
          <button
            type="button"
            onClick={handleContinue}
            className="px-3.5 py-1.5 rounded-full bg-[#1E1E24] hover:bg-black text-white font-black text-xs sm:text-sm flex items-center gap-1 shadow-md active:scale-95 transition-all cursor-pointer"
          >
            <span>Skip</span>
            <span className="text-xs">›</span>
          </button>

          {(isUserAdmin(user) || user?.role === 'admin' || user?.role === 'master') && (
            <button
              type="button"
              onClick={handleEditCard}
              className="px-3.5 py-1.5 rounded-full bg-[#1E1E24] hover:bg-black text-[#FDE047] font-black text-xs sm:text-sm flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                <path d="M2.695 14.763l-1.262 3.154a.5.5 0 00.65.65l3.155-1.262a4 4 0 001.343-.885L17.5 5.5a2.121 2.121 0 00-3-3L3.58 13.42a4 4 0 00-.885 1.343z" />
              </svg>
              <span>Edit card</span>
            </button>
          )}
        </div>

        {/* 3D Flip Card Container */}
        <div
          onClick={() => setIsFlipped(prev => !prev)}
          className="w-full aspect-[4/5] sm:h-[480px] cursor-pointer [perspective:1000px] select-none"
        >
          <div
            className={`relative w-full h-full duration-600 transition-transform [transform-style:preserve-3d] ${
              isFlipped ? '[transform:rotateY(180deg)]' : ''
            }`}
          >
            {/* ── FRONT FACE (Screenshot 1) ── */}
            <div className="absolute inset-0 w-full h-full bg-[#3B66F5] rounded-[32px] sm:rounded-[36px] shadow-[0_12px_40px_rgba(59,102,245,0.28)] flex flex-col items-center justify-center p-6 sm:p-8 text-center [backface-visibility:hidden] -webkit-[backface-visibility:hidden]">
              {/* Star Icon */}
              <div className="text-5xl sm:text-6xl text-[#FFD233] drop-shadow-md mb-4 transform hover:scale-110 transition-transform">
                ⭐
              </div>

              {/* Did you know? Title */}
              <h2
                style={{ fontFamily: "var(--f-display, 'Fredoka', sans-serif)" }}
                className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight mb-2 leading-tight"
              >
                {frontTitle}
              </h2>

              {/* Subtitle */}
              <p className="text-white/90 font-medium text-base sm:text-lg">
                Tap to flip
              </p>

              {/* Pulsing indicator at bottom of front card */}
              <div className="mt-8 flex items-center gap-1.5 text-white/70 text-xs font-bold uppercase tracking-widest">
                <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
                <span>Tap card</span>
              </div>
            </div>

            {/* ── BACK FACE (Screenshot 2) ── */}
            <div className="absolute inset-0 w-full h-full bg-white rounded-[32px] sm:rounded-[36px] border-4 sm:border-[5px] border-[#5E5CE6] shadow-[0_12px_40px_rgba(94,92,230,0.22)] p-5 sm:p-6 flex flex-col items-center justify-start overflow-y-auto [transform:rotateY(180deg)] [backface-visibility:hidden] -webkit-[backface-visibility:hidden]">
              {/* Top Image */}
              {cardImage ? (
                <div className="w-full h-44 sm:h-52 rounded-2xl overflow-hidden shadow-sm mb-4 flex-shrink-0 bg-slate-100">
                  <img
                    src={cardImage}
                    alt="Fact illustration"
                    className="w-full h-full object-cover rounded-2xl pointer-events-none"
                  />
                </div>
              ) : (
                <div className="w-full h-36 sm:h-44 rounded-2xl bg-gradient-to-br from-indigo-50 to-blue-100 border border-indigo-200/60 flex items-center justify-center text-4xl shadow-xs mb-4 flex-shrink-0">
                  💡
                </div>
              )}

              {/* Fact Content Text */}
              <div className="w-full flex-1 flex flex-col justify-between">
                <p
                  style={{ fontFamily: "var(--f-display, 'Fredoka', sans-serif)" }}
                  className="text-[#101F33] font-bold text-base sm:text-lg leading-relaxed text-left"
                >
                  {factText || "Facts and knowledge about this topic."}
                </p>

                {/* Audio Listen Button & Flip Hint */}
                <div className="w-full flex items-center justify-between pt-3 mt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={playFactAudio}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-[#101F33] text-xs font-black transition-colors"
                    title="Listen to fact"
                  >
                    <span>{isPlayingAudio ? '🔊 Playing...' : '🔈 Listen'}</span>
                  </button>

                  <span className="text-[11px] font-bold text-slate-400">
                    Tap to flip back
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── BOTTOM ACTION BUTTON (Screenshot 1 & 2: Continue) ── */}
      <div className="w-full max-w-sm sm:max-w-md px-4 py-3 flex-shrink-0">
        <button
          type="button"
          onClick={handleContinue}
          className="w-full py-4 rounded-2xl sm:rounded-[22px] bg-[#1F9D63] hover:bg-[#198754] text-white font-black text-xl tracking-wide shadow-[0_5px_0_0_#16804F] active:shadow-none active:translate-y-1 transition-all flex items-center justify-center cursor-pointer"
        >
          Continue
        </button>
      </div>

      {/* Exit Confirmation Modal */}
      {showExitConfirm && (
        <ConceptExitConfirm
          isOpen={showExitConfirm}
          onClose={() => setShowExitConfirm(false)}
          onConfirm={() => navigate('/learn')}
        />
      )}
    </div>
  );
}
