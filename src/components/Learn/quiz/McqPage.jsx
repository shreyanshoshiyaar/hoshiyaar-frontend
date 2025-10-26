import ProgressBar from '../../ui/ProgressBar.jsx';
import SimpleLoading from '../../ui/SimpleLoading.jsx';
import TryAgainModal from '../../modals/TryAgainModal.jsx';
import IncorrectAnswerModal from '../../modals/IncorrectAnswerModal.jsx';
import React, { useMemo, useState, useEffect, useRef } from 'react';
import ConceptExitConfirm from '../../modals/ConceptExitConfirm.jsx';
import correctSfx from '../../../assets/sounds/correct-choice-43861.mp3';
import errorSfx from '../../../assets/sounds/error-010-206498.mp3';
import { useNavigate, useParams } from 'react-router-dom';
import { useModuleItems } from '../../../hooks/useModuleItems';
import authService from '../../../services/authService.js';
import { useAuth } from '../../../context/AuthContext.jsx';
import { useReview } from '../../../context/ReviewContext.jsx';
import { useStars, StarCounter } from '../../../context/StarsContext.jsx';
// Inline feedback bar instead of modal

export default function McqPage({ onQuestionComplete, isReviewMode = false }) {
  // Local storage helpers for dashboard progress sync
  const LS_KEY = 'lesson_progress_v1';
  const markCompletedLocal = (chapterZeroIdx) => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      const store = raw ? JSON.parse(raw) : {};
      const key = 'default';
      const set = new Set(store[key] || []);
      if (Number.isInteger(chapterZeroIdx) && chapterZeroIdx >= 0) set.add(chapterZeroIdx);
      store[key] = Array.from(set);
      localStorage.setItem(LS_KEY, JSON.stringify(store));
    } catch (_) {}
  };
  const IDS_KEY = 'lesson_completed_ids_v1';
  const recordCompletedId = (moduleId) => {
    try {
      const raw = localStorage.getItem(IDS_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      const set = new Set(arr);
      if (moduleId) set.add(String(moduleId));
      localStorage.setItem(IDS_KEY, JSON.stringify(Array.from(set)));
    } catch (_) {}
  };
  const navigate = useNavigate();
  const { moduleNumber, index: indexParam } = useParams();
  const index = Number(indexParam || 0);
  const { items, loading, error } = useModuleItems(moduleNumber);
  const item = useMemo(() => items[index] || null, [items, index]);
  
  // Check if we're in review mode from URL params
  const urlParams = new URLSearchParams(window.location.search);
  const isReviewModeFromUrl = urlParams.get('review') === 'true';
  const actualReviewMode = isReviewMode || isReviewModeFromUrl;
  const { user } = useAuth();
  const { add: addToReview, removeActive, requeueActive } = useReview();
  const { awardCorrect, awardWrong } = useStars();
  const [feedback, setFeedback] = useState({ open: false, correct: false, expected: '' });
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [showTryAgainModal, setShowTryAgainModal] = useState(false);
  const [showIncorrectModal, setShowIncorrectModal] = useState(false);
  const [hasAnsweredCorrectly, setHasAnsweredCorrectly] = useState(false);
  const [isFlagged] = useState(false);
  const [showTryAgainOption, setShowTryAgainOption] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  // Track first attempt per question instance; re-attempts score 0
  const [hasAttempted, setHasAttempted] = useState(false);

  // Sound effects
  const correctAudio = useRef(null);
  const errorAudio = useRef(null);

  useEffect(() => {
    try {
      correctAudio.current = new Audio(correctSfx);
      errorAudio.current = new Audio(errorSfx);
      if (correctAudio.current) {
        correctAudio.current.volume = 1.0; // louder for correct
        correctAudio.current.preload = 'auto';
        correctAudio.current.load();
      }
      if (errorAudio.current) {
        errorAudio.current.volume = 0.4; // softer for wrong
        errorAudio.current.preload = 'auto';
        errorAudio.current.load();
      }
    } catch (_) {}
  }, []);


  // Reset state when item changes
  useEffect(() => {
    setSelectedIndex(null);
    setShowResult(false);
    setIsCorrect(false);
    setFeedback({ open: false, correct: false, expected: '' });
    setShowTryAgainModal(false);
    setShowIncorrectModal(false);
    setHasAnsweredCorrectly(false);
    setShowTryAgainOption(false);
    setHasAttempted(false);
  }, [item, moduleNumber, index]);

  // Allow native browser back (no intercept)
  useEffect(() => {}, []);

  // Reset server-side lesson score at entry
  useEffect(() => {
    (async () => {
      try {
        if (user?._id) {
          const params = new URLSearchParams(window.location.search);
          const title = params.get('title') || item?.title || `Module ${moduleNumber}`;
          await authService.updateProgress({ userId: user._id, chapter: Number(moduleNumber), subject: user.subject || 'Science', lessonTitle: title, isCorrect: true, deltaScore: 0, resetLesson: true });
        }
      } catch (_) {}
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moduleNumber]);

  // Enter handling on MCQ pages
  // 1) Before an answer is shown (showResult === false), block Enter so it doesn't select anything accidentally
  // 2) After result is shown:
  //    - For incorrect: allow propagation so the incorrect modal can handle Enter (Try Again)
  //    - For correct: map Enter to Continue
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'Enter') return;
      if (!showResult) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    window.addEventListener('keydown', onKey, { capture: true });
    return () => window.removeEventListener('keydown', onKey, { capture: true });
  }, [showResult]);

  // When the answer is correct and result is visible, pressing Enter should continue
  useEffect(() => {
    if (!(showResult && isCorrect)) return;
    const onKey = (e) => {
      if (e.key !== 'Enter') return;
      e.preventDefault();
      handleNext();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showResult, isCorrect]);

  function routeForType(type, idx) {
    switch (type) {
      case 'concept':
      case 'statement':
        return `/learn/module/${moduleNumber}/concept/${idx}`;
      case 'multiple-choice': return `/learn/module/${moduleNumber}/mcq/${idx}`;
      case 'fill-in-the-blank': return `/learn/module/${moduleNumber}/fillups/${idx}`;
      case 'rearrange': return `/learn/module/${moduleNumber}/rearrange/${idx}`;
      default: return `/learn`;
    }
  }

  async function handleOptionClick(optionIndex) {
    if (showResult) return;
    
    setSelectedIndex(optionIndex);
    const selectedOption = item.options[optionIndex];
    const correct = String(selectedOption).trim().toLowerCase() === item.answer.trim().toLowerCase();
    setIsCorrect(correct);
    setShowResult(true);
    const isFirstAttempt = !hasAttempted;
    if (!hasAttempted) setHasAttempted(true);

    // Play feedback sound (user gesture triggered)
    try {
      const src = correct ? correctAudio.current : errorAudio.current;
      if (src) {
        src.currentTime = 0;
        const p = src.play();
        if (p && typeof p.catch === 'function') p.catch(() => {});
      }
    } catch (_) {}

    if (correct) {
      setHasAnsweredCorrectly(true);
      setShowTryAgainOption(false); // Hide try again when correct
      // Award only on first attempt
      if (isFirstAttempt) {
        const qid = `${moduleNumber}_${index}_mcq`;
        const pts = 5; // both standard and revision award +5 on first correct
        if (pts !== 0) awardCorrect(String(moduleNumber), qid, pts);
        try { if (user?._id) await authService.updateProgress({ userId: user._id, chapter: Number(moduleNumber), subject: user.subject || 'Science', lessonTitle: item?.title || `Module ${moduleNumber}`, isCorrect: true, deltaScore: pts }); } catch (_) {}
      }
      
      // If in review mode, notify and go back to module
      if (actualReviewMode) {
        removeActive();
        navigate('/review-round');
      }
    } else {
      // Immediate feedback and enqueue for review
      setShowTryAgainOption(false);
      setShowIncorrectModal(true);
      // scoring penalty (first attempt only; none in review/revision)
      if (isFirstAttempt && !actualReviewMode) {
        const qid = `${moduleNumber}_${index}_mcq`;
        awardWrong(String(moduleNumber), qid, -2, { isRetry: false });
        try { if (user?._id) await authService.updateProgress({ userId: user._id, chapter: Number(moduleNumber), subject: user.subject || 'Science', lessonTitle: item?.title || `Module ${moduleNumber}`, isCorrect: false, deltaScore: -2 }); } catch (_) {}
      }
      const questionId = `${moduleNumber}_${index}_multiple-choice`;
      if (!actualReviewMode) {
        addToReview({ questionId, moduleNumber, index, type: 'multiple-choice' });
      } else {
        // In review mode, keep it in rotation by moving to end
        requeueActive();
      }
      try {
        if (user?._id) {
          const reviewSvc = (await import('../../../services/reviewService.js')).default;
          await reviewSvc.saveIncorrect({ userId: user._id, questionId, moduleId: String(moduleNumber) });
        }
      } catch (_) {}
    }

    // Show feedback modal
    setFeedback({
      open: true,
      correct: correct,
      expected: item.answer
    });
  }

  async function handleNext(force = false) {
    console.log('[MCQ] handleNext called', { force, hasAnsweredCorrectly, isCorrect });
    // Allow forced advance (from incorrect modal). Otherwise require correct.
    if (!force && !hasAnsweredCorrectly && !isCorrect) {
      return;
    }

    // In review mode, on forced advance dispatch completion and return to module
    if (actualReviewMode) {
      if (force) {
        // Incorrect path: keep item (already requeued), just advance
        navigate('/review-round');
        return;
      }
      if (isCorrect) {
        removeActive();
        navigate('/review-round');
        return;
      }
      return;
    }

    const nextIndex = index + 1;
    const nextItem = items[nextIndex];
    const params = new URLSearchParams(window.location.search);
    const title = params.get('title');
    const suffix = title ? `?title=${encodeURIComponent(title)}` : '';
    
    if (nextIndex >= items.length) {
      // Finished module: now count progress - Database is primary source
      try {
        if (user?._id) {
          console.log('[MCQ] Saving module completion to database:', moduleNumber);
          const response = await authService.updateProgress({ 
            userId: user._id, 
            chapter: Number(moduleNumber), 
            subject: user.subject || 'Science', // CRITICAL FIX: Include subject
            conceptCompleted: true 
          });
          console.log('[MCQ] Database save response:', response?.data);
        }
      } catch (error) {
        console.error('[MCQ] Failed to save to database:', error);
        // Still continue with local storage as fallback
      }
      
      // Also persist locally so dashboard immediately reflects completion
      try {
        const zeroIdx = Number(moduleNumber) - 1;
        markCompletedLocal(zeroIdx);
        // Store by module id
        recordCompletedId(moduleNumber);
        // Also store in user-scoped keys for dashboard compatibility
        try {
          const userScopedKey = (base) => `${base}__${user?._id || 'anon'}`;
          const userLS_KEY = userScopedKey('lesson_progress_v1');
          const userIDS_KEY = userScopedKey('lesson_completed_ids_v1');
          
          // Update user-scoped progress
          const userRaw = localStorage.getItem(userLS_KEY);
          const userStore = userRaw ? JSON.parse(userRaw) : {};
          const userSet = new Set(userStore['default'] || []);
          userSet.add(zeroIdx);
          userStore['default'] = Array.from(userSet);
          localStorage.setItem(userLS_KEY, JSON.stringify(userStore));
          
          // Update user-scoped completed IDs
          const userIdsRaw = localStorage.getItem(userIDS_KEY);
          const userIdsArr = userIdsRaw ? JSON.parse(userIdsRaw) : [];
          const userIdsSet = new Set(userIdsArr);
          userIdsSet.add(String(moduleNumber));
          localStorage.setItem(userIDS_KEY, JSON.stringify(Array.from(userIdsSet)));
        } catch (_) {}
      } catch (_) {}
      return navigate(`/lesson-complete?chapter=${encodeURIComponent(moduleNumber)}`);
    }
    navigate(`${routeForType(nextItem.type, nextIndex)}${suffix}`);
  }

  const handleFeedbackClose = () => {
    setFeedback({ open: false, correct: false, expected: '' });
  };

  const handleFeedbackNext = () => {
    setFeedback({ open: false, correct: false, expected: '' });
    handleNext();
  };

  const handleTryAgain = () => {
    // Local-only reset for demo try-again; no backend or review queue changes
    setShowIncorrectModal(false);
    setShowResult(false);
    setIsCorrect(false);
    setHasAnsweredCorrectly(false);
    setSelectedIndex(null);
  };

  const handleTryAgainClose = () => {
    setShowTryAgainModal(false);
    setShowIncorrectModal(false);
  };

  // Flagging removed with revision context

  if (loading) return <SimpleLoading />;
  if (error) return <div className="p-6 text-red-600">{error}</div>;
  if (!item) return <SimpleLoading />;
  if (item.type !== 'multiple-choice') return <div className="p-6">No MCQ at this step.</div>;

  return (
    <div className="h-screen bg-white flex flex-col overflow-hidden">
      {/* Header - reduced padding for mobile */}
      <div className="flex items-center justify-between p-2 sm:p-3 md:p-4 flex-shrink-0">
        {!actualReviewMode && (
          <button 
            onClick={() => setShowExitConfirm(true)}
            className="w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-sm sm:text-base"
          >
            ✕
          </button>
        )}
        <div className="flex-1 mx-1 sm:mx-2 md:mx-4">
      <ProgressBar currentIndex={index} total={items.length} />
        </div>
        <div className="flex items-center gap-1 sm:gap-2 md:gap-3">
          
          {/* Show flagged status */}
          {isFlagged && (
            <div className="flex items-center gap-1 sm:gap-2 px-2 py-1 sm:px-3 sm:py-2 rounded-lg bg-green-50 border border-green-200 text-green-700">
              <span className="text-sm sm:text-lg">✅</span>
              <span className="text-xs sm:text-sm font-medium">Marked for Review</span>
            </div>
          )}
          
          <StarCounter />
        </div>
      </div>

      {/* Main Content - mobile optimized, desktop unchanged */}
      <div className="flex-1 flex flex-col items-center px-2 sm:px-4 md:px-6 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 80px)' }}>
        <h2 className="text-xl sm:text-lg md:text-xl lg:text-2xl xl:text-3xl font-extrabold text-gray-900 text-center mt-2 sm:mt-6 md:mt-8 mb-2 sm:mb-3 md:mb-4 text-overflow-fix px-1 sm:px-2">
          {item.question}
        </h2>

        {(() => { 
          // Check if options are image URLs - if so, don't show question images
          const hasImageOptions = item.options?.some(opt => typeof opt === 'string' && (opt.startsWith('http') || opt.startsWith('https')));
          if (hasImageOptions) return null;
          
          const imgs = (item.images || []).filter(Boolean); 
          if (imgs.length === 0 && item.imageUrl) imgs.push(item.imageUrl); 
          return imgs.length > 0 ? (
            <div className="w-full max-w-xl sm:max-w-2xl md:max-w-3xl mb-1 sm:mb-3 flex justify-center">
              <div className="flex flex-wrap justify-center gap-1 sm:gap-3 md:gap-5">
                {((item.images && item.images.filter(Boolean)) || (item.imageUrl ? [item.imageUrl] : [])).slice(0,5).map((src, i) => (
                  <div key={i} className="border border-blue-300 rounded-lg sm:rounded-2xl p-1 sm:p-3 bg-white shadow-sm">
                    <img src={src} alt={'mcq-'+i} className="h-40 w-36 sm:h-32 sm:w-24 md:h-48 md:w-36 lg:h-60 lg:w-44 xl:h-80 xl:w-60 object-contain rounded-md sm:rounded-xl" />
                  </div>
                ))}
              </div>
            </div>
          ) : null 
        })()}

        {!showResult && (
          <div className="w-full max-w-2xl sm:max-w-3xl md:max-w-4xl mb-2 sm:mb-4">
            {(() => {
              // Check if any options are image URLs
              const hasImageOptions = item.options?.some(opt => typeof opt === 'string' && (opt.startsWith('http') || opt.startsWith('https')));
              
              // Use horizontal layout for image options, horizontal for text options
              const containerClass = hasImageOptions 
                ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-4 md:gap-6" 
                : "flex flex-col sm:flex-row gap-2 sm:gap-4 w-full";
              
              return (
                <div className={containerClass}>
                  {item.options?.map((opt, idx) => {
                    const isSelected = selectedIndex === idx;
                    const isCorrectOption = String(opt).trim().toLowerCase() === item.answer.trim().toLowerCase();
                    const isImageUrl = typeof opt === 'string' && (opt.startsWith('http') || opt.startsWith('https'));
                    
                    let buttonClass = hasImageOptions 
                      ? "p-2 sm:p-3 md:p-4 rounded-xl sm:rounded-2xl border-2 text-center transition-all duration-200 hover:scale-[1.02] " 
                      : "p-2 sm:p-3 md:p-4 rounded-xl sm:rounded-2xl border-2 text-center transition-all duration-200 hover:scale-[1.01] flex-1 ";
              
              if (showResult) {
                if (isSelected) {
                  buttonClass += isCorrect ? "bg-green-200 border-green-400" : "bg-red-200 border-red-400";
                } else if (isCorrectOption) {
                  buttonClass += "bg-green-200 border-green-400";
                } else {
                  buttonClass += "bg-gray-100 border-gray-300";
                }
              } else {
                buttonClass += "bg-white border-gray-300 hover:border-blue-400";
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleOptionClick(idx)}
                  className={buttonClass}
                  disabled={showResult}
                  tabIndex={-1}
                  onKeyDown={(e) => { e.preventDefault(); }}
                >
                  {isImageUrl ? (
                    <div className="flex flex-col items-center">
                      <img 
                        src={opt} 
                        alt={`Option ${idx + 1}`}
                        className="w-full h-20 sm:h-20 md:h-24 lg:h-28 object-contain rounded-lg mb-1 sm:mb-2"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'block';
                        }}
                      />
                      <div className="text-xs sm:text-xs text-gray-600 font-medium" style={{display: 'none'}}>
                        Option {idx + 1}
                      </div>
                      <div className="text-xs sm:text-xs md:text-sm font-semibold text-gray-700">
                        Option {idx + 1}
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs sm:text-xs md:text-sm lg:text-base font-bold text-gray-700 text-overflow-fix">{opt}</div>
                  )}
                </button>
                  );
                })}
                </div>
              );
            })()}
          </div>
        )}

        {/* Show results when answered */}
        {showResult && (
          <div className="w-full max-w-4xl mb-4">
            {(() => {
              // Check if any options are image URLs
              const hasImageOptions = item.options?.some(opt => typeof opt === 'string' && (opt.startsWith('http') || opt.startsWith('https')));
              
              // Use horizontal layout for image options, horizontal for text options
              const containerClass = hasImageOptions 
                ? "grid grid-cols-1 md:grid-cols-3 gap-6" 
                : "flex flex-col sm:flex-row gap-4 w-full";
              
              return (
                <div className={containerClass}>
                  {item.options?.map((opt, idx) => {
                    const isSelected = selectedIndex === idx;
                    const isCorrectOption = String(opt).trim().toLowerCase() === item.answer.trim().toLowerCase();
                    const isImageUrl = typeof opt === 'string' && (opt.startsWith('http') || opt.startsWith('https'));
                    
                    let buttonClass = hasImageOptions 
                      ? "p-4 rounded-2xl border-2 text-center transition-all duration-200 " 
                      : "p-4 rounded-2xl border-2 text-center transition-all duration-200 flex-1 ";
              
              if (isSelected) {
                buttonClass += isCorrect ? "bg-green-200 border-green-400" : "bg-red-200 border-red-400";
              } else if (isCorrectOption) {
                buttonClass += "bg-green-200 border-green-400";
              } else {
                buttonClass += "bg-gray-100 border-gray-300";
              }

              return (
                <div
                  key={idx}
                  className={buttonClass}
                >
                  {isImageUrl ? (
                    <div className="flex flex-col items-center">
                      <img 
                        src={opt} 
                        alt={`Option ${idx + 1}`}
                        className="w-full h-48 object-contain rounded-lg mb-2"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'block';
                        }}
                      />
                      <div className="text-sm text-gray-600 font-medium" style={{display: 'none'}}>
                        Option {idx + 1}
                      </div>
                      <div className="text-lg font-semibold text-gray-700 mb-2">
                        Option {idx + 1}
                      </div>
                      {/* Show checkmark or X for selected/correct options */}
                      <div>
                        {isSelected && (
                          <span className={`text-2xl ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                            {isCorrect ? '✓' : '✗'}
                          </span>
                        )}
                        {!isSelected && isCorrectOption && (
                          <span className="text-2xl text-green-600">✓</span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="text-xl font-bold text-gray-700">{opt}</div>
                      {/* Show checkmark or X for selected/correct options */}
                      <div>
                        {isSelected && (
                          <span className={`text-2xl ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                            {isCorrect ? '✓' : '✗'}
                          </span>
                        )}
                        {!isSelected && isCorrectOption && (
                          <span className="text-2xl text-green-600">✓</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                  );
                })}
                </div>
              );
            })()}
          </div>
        )}
        
        {/* Bottom padding - mobile only for fixed button */}
        <div className="h-4 sm:h-0 md:h-0"></div>
      </div>

      {/* Inline feedback bar - show only for correct answers; incorrect uses modal */}
      {showResult && !actualReviewMode && isCorrect && (
        <div className={`fixed left-0 right-0 bottom-0 z-50 border-t-4 shadow-2xl ${
          isCorrect ? 'bg-green-50 border-green-400' : 'bg-red-50 border-red-400'
        }`}>
          <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className={`text-xl font-extrabold ${
              isCorrect ? 'text-green-700' : 'text-red-700'
            }`}>
              {isCorrect ? 'Great job!' : 'Not quite right.'}
            </div>
            <div className="flex gap-3">
              {/* Show Continue button ONLY for correct answers */}
              {isCorrect && (
                <button
                  onClick={handleNext}
                  className="px-8 py-3 rounded-2xl text-white font-extrabold text-xl bg-green-600 hover:bg-green-700 transition-colors"
                >
                  Continue
                </button>
              )}
            </div>
          </div>
        </div>
      )}


      {/* Review mode success message */}
      {showResult && isCorrect && actualReviewMode && (
        <div className="fixed left-0 right-0 bottom-0 z-50 border-t-4 shadow-2xl bg-green-50 border-green-400">
          <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-center">
            <div className="text-xl font-extrabold text-green-700">
              Great job! Moving to next question...
            </div>
          </div>
        </div>
      )}

      {/* Incorrect Answer Modal (Try Again only) */}
      <IncorrectAnswerModal 
        isOpen={showIncorrectModal}
        onClose={() => {}}
        onTryAgain={handleTryAgain}
        incorrectText={selectedIndex != null ? String(item.options[selectedIndex]) : ''}
        correctAnswer={item?.answer}
      />

      {/* Exit confirmation overlay */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center">
          <div className="w-full max-w-md">
            <ConceptExitConfirm
              progress={Math.round(((index+1)/Math.max(1, items.length))*100)}
              onQuit={() => navigate('/learn')}
              onContinue={() => setShowExitConfirm(false)}
              onClose={() => setShowExitConfirm(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}


