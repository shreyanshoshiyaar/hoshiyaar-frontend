import ProgressBar from '../../ui/ProgressBar.jsx';
import SimpleLoading from '../../ui/SimpleLoading.jsx';
import IncorrectAnswerModal from '../../modals/IncorrectAnswerModal.jsx';
import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import ConceptExitConfirm from '../../modals/ConceptExitConfirm.jsx';
import NoSkipsModal from '../../modals/NoSkipsModal.jsx';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useModuleItems } from '../../../hooks/useModuleItems';
import authService from '../../../services/authService.js';
import { useAuth } from '../../../context/AuthContext.jsx';
import { useReview } from '../../../context/ReviewContext.jsx';
import { useStars, StarCounter } from '../../../context/StarsContext.jsx';
import pointsService from '../../../services/pointsService.js';
import { progressKey } from '../../../utils/progressKey.js';
import correctSfx from '../../../assets/sounds/correct-choice-43861.mp3';
import errorSfx from '../../../assets/sounds/error-010-206498.mp3';
import { Haptics } from '@capacitor/haptics';

export default function DescriptivePage() {
  const navigate = useNavigate();
  const { moduleNumber, index: indexParam } = useParams();
  const index = Number(indexParam || 0);
  const { items, loading, error } = useModuleItems(moduleNumber);
  const [searchParams] = useSearchParams();
  const isReviewModeFromUrl = searchParams.get('review') === 'true';
  const isRevisionModeFromUrl = searchParams.get('revision') === 'true';
  const chapterIdParam = searchParams.get('chapterId');
  const unitIdParam = searchParams.get('unitId');
  const actualReviewMode = isReviewModeFromUrl || isRevisionModeFromUrl;
  const { user } = useAuth();
  const { awardCorrect, awardWrong, addToSession, clearSession } = useStars();
  const { add: addToReview, removeActive, requeueActive, undoActive, stageIncorrect, clearStagedForModule, active: activeReviewItem, queue, initialQueueCount } = useReview();

  const [userInput, setUserInput] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [foundKeywords, setFoundKeywords] = useState([]);
  const [missedKeywords, setMissedKeywords] = useState([]);
  const [showIncorrectModal, setShowIncorrectModal] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [showNoSkipsModal, setShowNoSkipsModal] = useState(false);
  const [hasAttempted, setHasAttempted] = useState(false);
  const [forceShowExpert, setForceShowExpert] = useState(false);
  const [skipsLeft, setSkipsLeft] = useState(() => {
    const stored = sessionStorage.getItem(`skips_${moduleNumber}`);
    return stored !== null ? parseInt(stored, 10) : 5;
  });

  const correctAudio = useRef(null);
  const errorAudio = useRef(null);

  const item = useMemo(() => items[index] || null, [items, index]);

  useEffect(() => {
    try {
      correctAudio.current = new Audio(correctSfx);
      errorAudio.current = new Audio(errorSfx);
    } catch (_) {}
  }, []);

  useEffect(() => {
    setUserInput('');
    setShowResult(false);
    setIsCorrect(false);
    setFoundKeywords([]);
    setMissedKeywords([]);
    setShowIncorrectModal(false);
    setHasAttempted(false);
    setForceShowExpert(false);
  }, [moduleNumber, index]);

  const normalize = (text) => {
    return String(text || '').toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  };

  const handleTextChange = (e) => {
    if (showResult) return;
    setUserInput(e.target.value);
  };

  const [scoreData, setScoreData] = useState(null);

  const handleSubmit = async () => {
    if (!userInput.trim() || showResult) return;

    // Safely extract and split keywords. 
    // Mongoose sometimes casts a comma string "A, B" into an array ["A, B"]. We must split strings.
    let keywordsSource = (item.keywords && item.keywords.length > 0) ? item.keywords : (item.answer || []);
    if (typeof keywordsSource === 'string') {
      // Split by common separators: comma, semicolon, pipe
      keywordsSource = keywordsSource.split(/[,;|]+/).map(s => s.trim()).filter(Boolean);
    }
    
    // Ensure we have a clean array of keywords
    const keywords = Array.isArray(keywordsSource) 
      ? keywordsSource.map(k => String(k || '').trim()).filter(Boolean)
      : [];
    
    const normalizedInput = normalize(userInput);
    
    const matched = [];
    const missed = [];

    const inputWords = normalizedInput.split(/\s+/).filter(Boolean);
    
    keywords.forEach(kw => {
      const nk = normalize(kw);
      if (!nk) return;
      
      // 1. Exact phrase match or phrase is a substring of the input
      let isMatch = normalizedInput.includes(nk);
      
      // 2. If no exact match, allow fuzzy word-level matching for single-word keywords
      if (!isMatch) {
        const nkWords = nk.split(/\s+/);
        if (nkWords.length === 1) {
          isMatch = inputWords.some(w => {
            if (w === nk) return true;
            // Allow substring match only if both words are reasonably long (>= 4 chars)
            // This prevents short inputs like "a" or "is" from matching longer keywords,
            // and prevents "i" from matching "kinetic" (nk.includes(w))
            if (nk.length >= 4 && w.length >= 4) {
              return w.includes(nk) || nk.includes(w);
            }
            return false;
          });
        }
      }
      
      if (isMatch) {
        matched.push(kw);
      } else {
        missed.push(kw);
      }
    });

    const scoreRatio = keywords.length > 0 ? matched.length / keywords.length : 1;
    const scorePercent = Math.round(scoreRatio * 100);

    let matchStatus = 'incorrect';
    let pts = -2;
    let starsEarned = 0;
    let dbResult = 'incorrect';
    let isCorrectStatus = false;

    if (scoreRatio === 1) {
      matchStatus = 'perfect';
      pts = 3;
      starsEarned = 3;
      dbResult = 'correct';
      isCorrectStatus = true;
    } else if (scoreRatio >= 0.65) {
      matchStatus = 'partial-high';
      pts = 3;
      starsEarned = 2;
      dbResult = 'correct';
      isCorrectStatus = true;
    } else if (scoreRatio > 0) {
      matchStatus = 'partial-low';
      pts = -3;
      starsEarned = 0;
      dbResult = 'incorrect';
      isCorrectStatus = false;
    } else {
      matchStatus = 'incorrect';
      pts = -3;
      starsEarned = 0;
      dbResult = 'incorrect';
      isCorrectStatus = false;
    }

    setFoundKeywords(matched);
    setMissedKeywords(missed);
    setIsCorrect(isCorrectStatus);
    setScoreData({ percent: scorePercent, stars: starsEarned, status: matchStatus });
    setShowResult(true);
    
    const isFirstAttempt = !hasAttempted;
    if (!hasAttempted) setHasAttempted(true);

    try {
      const src = isCorrectStatus ? correctAudio.current : errorAudio.current;
      if (src) {
        src.currentTime = 0;
        src.play().catch(() => {});
      }
      if (!isCorrectStatus) {
        Haptics.vibrate();
      }
    } catch (_) {}

    const qid = `${moduleNumber}_${index}_descriptive`;
    const type = isRevisionModeFromUrl ? 'revision' : 'curriculum';

    if (isFirstAttempt) {
      addToSession(qid);
      if (isCorrectStatus) {
        awardCorrect(String(moduleNumber), qid, pts, { type });
        try {
          if (user?._id) {
            await authService.updateProgress({ 
              userId: user._id, 
              moduleId: String(moduleNumber), 
              subject: user.subject || 'Science', 
              lessonTitle: item?.title || `Module ${moduleNumber}`, 
              isCorrect: true, 
              deltaScore: pts 
            });
          }
        } catch (_) {}
      } else {
        setShowIncorrectModal(true);
        if (!actualReviewMode) {
          awardWrong(String(moduleNumber), qid, pts, { isRetry: false, type });
          try {
            if (user?._id) {
              await authService.updateProgress({ 
                userId: user._id, 
                moduleId: String(moduleNumber), 
                subject: user.subject || 'Science', 
                lessonTitle: item?.title || `Module ${moduleNumber}`, 
                isCorrect: false, 
                deltaScore: pts 
              });
            }
          } catch (_) {}
        }
      }
    } else if (!isCorrectStatus) {
       setShowIncorrectModal(true);
    }

    if (!isCorrectStatus) {
      if (!actualReviewMode) {
        addToReview({ questionId: qid, moduleNumber, index, type: 'descriptive' });
      } else {
        requeueActive();
      }
    }
  };

  const handleNext = async () => {
    const nextIndex = index + 1;
    if (nextIndex >= items.length) {
      // 1. Mark as completed in database
      try {
        if (user?._id) {
          await authService.updateProgress({ 
            userId: user._id, 
            moduleId: String(moduleNumber), 
            subject: user.subject || 'Science', 
            conceptCompleted: true 
          });
        }
      } catch (_) {}

      // 2. Mark as completed in local storage for immediate dashboard update
      try {
        const subject = user?.subject || 'Science';
        const userScopedKey = (base) => `${base}__${user?._id || 'anon'}__${subject}`;
        
        // Mark using the NEW composite key format for dashboard compatibility
        if (chapterIdParam && moduleNumber) {
           const compositeKey = progressKey(chapterIdParam, unitIdParam || '', moduleNumber);
           const lk_v2 = userScopedKey('lesson_progress_v2');
           const raw = localStorage.getItem(lk_v2);
           const store = raw ? JSON.parse(raw) : {};
           const completedKeys = new Set(store.completedKeys || []);
           completedKeys.add(compositeKey);
           store.completedKeys = Array.from(completedKeys);
           localStorage.setItem(lk_v2, JSON.stringify(store));
           
           // Notify dashboard to refresh
           window.dispatchEvent(new CustomEvent('progressUpdated', { detail: { key: lk_v2 } }));
        }

        // Keep legacy markers for robustness
        const zeroIdx = Number(moduleNumber) - 1;
        const lk_v1 = userScopedKey('lesson_progress_v1');
        const rawV1 = localStorage.getItem(lk_v1);
        const storeV1 = rawV1 ? JSON.parse(rawV1) : {};
        const keyV1 = chapterIdParam ? `chapter_${chapterIdParam}` : 'default';
        const setV1 = new Set(storeV1[keyV1] || []);
        setV1.add(zeroIdx);
        storeV1[keyV1] = Array.from(setV1);
        localStorage.setItem(lk_v1, JSON.stringify(storeV1));

        const idsk = userScopedKey('lesson_completed_ids_v1');
        const idsRaw = localStorage.getItem(idsk);
        const idsArr = idsRaw ? JSON.parse(idsRaw) : [];
        const idsSet = new Set(idsArr);
        idsSet.add(String(moduleNumber));
        localStorage.setItem(idsk, JSON.stringify(Array.from(idsSet)));
      } catch (_) {}

      // 3. Navigate to lesson complete
      const completionParams = new URLSearchParams();
      completionParams.set('moduleId', String(moduleNumber));
      if (chapterIdParam) completionParams.set('chapterId', chapterIdParam);
      if (unitIdParam) completionParams.set('unitId', unitIdParam);
      clearSession();
      navigate(`/lesson-complete?${completionParams.toString()}`);
      return;
    }

    const nextItem = items[nextIndex];
    const params = new URLSearchParams(window.location.search);
    const suffix = params.toString() ? `?${params.toString()}` : '';

    navigate(`${routeForType(nextItem.type, nextIndex)}${suffix}`);
  };

  function routeForType(type, idx) {
    switch (type) {
      case 'comic':
      case 'concept':
      case 'statement':
      case 'video':
        return `/learn/module/${moduleNumber}/concept/${idx}`;
      case 'multiple-choice': return `/learn/module/${moduleNumber}/mcq/${idx}`;
      case 'fill-in-the-blank': return `/learn/module/${moduleNumber}/fillups/${idx}`;
      case 'rearrange': return `/learn/module/${moduleNumber}/rearrange/${idx}`;
      case 'descriptive': return `/learn/module/${moduleNumber}/descriptive/${idx}`;
      default: return `/learn`;
    }
  }

  const handleBack = useCallback(() => {
    // Double press detection for quit popup
    const lastPress = Number(sessionStorage.getItem('last_back_press_time') || 0);
    const now = Date.now();
    if (now - lastPress < 2000) { // 2 seconds threshold
      setShowExitConfirm(true);
      sessionStorage.removeItem('last_back_press_time'); // Clear to allow normal back if they stay
      return;
    }
    sessionStorage.setItem('last_back_press_time', String(now));

    if (actualReviewMode) {
      if (undoActive && undoActive()) {
        navigate('/review-round');
      } else {
        navigate('/learn?go=dashboard');
      }
      return;
    }

    if (index > 0) {
      const prevIndex = index - 1;
      const prevItem = items[prevIndex];
      if (!prevItem) return;
      const params = new URLSearchParams(window.location.search);
      const suffix = params.toString() ? `?${params.toString()}` : '';
      navigate(`${routeForType(prevItem.type, prevIndex)}${suffix}`);
    } else {
      const urlParams = new URLSearchParams(window.location.search);
      const chapterId = urlParams.get('chapterId');
      const unitId = urlParams.get('unitId');
      const params = new URLSearchParams();
      if (chapterId) params.set('chapterId', chapterId);
      if (unitId) params.set('unitId', unitId);

      const query = params.toString();
      navigate(`/learn${query ? '?' + query : ''}`);
    }
  }, [index, items, navigate, moduleNumber]);

  // Enter to continue when result is shown
  useEffect(() => {
    if (!showResult) return;
    const onKey = (e) => {
      if (e.key === 'Enter' || e.keyCode === 13) {
        e.preventDefault();
        if (isCorrect) {
          handleNext(true);
        } else {
          handleNext(true); // In DescriptivePage, both correct/incorrect use handleNext(true) for "Got it"/"Continue"
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showResult, isCorrect]);

  const handleMasterSkip = async () => {
    if (actualReviewMode) {
      removeActive();
      navigate('/review-round');
      return;
    }
    const qid = `${moduleNumber}_${index}_descriptive`;
    const type = isRevisionModeFromUrl ? 'revision' : 'curriculum';
    awardCorrect(String(moduleNumber), qid, 3, { type });
    addToSession(qid);
    try {
      if (user?._id) {
        await authService.updateProgress({ userId: user._id, moduleId: String(moduleNumber), subject: user.subject || 'Science', lessonTitle: item?.title || `Module ${moduleNumber}`, isCorrect: true, deltaScore: 3 });
      }
    } catch (_) {}
    handleNext(true);
  };

  const handlePlayerSkip = async () => {
    if (skipsLeft > 0) {
      const newSkips = skipsLeft - 1;
      setSkipsLeft(newSkips);
      sessionStorage.setItem(`skips_${moduleNumber}`, newSkips.toString());
      if (actualReviewMode) {
        removeActive();
        navigate('/review-round');
        return;
      }
      handleNext(true);
    } else {
      setShowNoSkipsModal(true);
    }
  };

  if (loading) return <SimpleLoading />;
  if (error) return <div className="p-6 text-red-600">{error}</div>;
  if (!item) {
    setTimeout(() => {
      localStorage.removeItem('hoshiyaar_last_path');
      localStorage.removeItem(`resume_lesson_${moduleNumber}`);
      navigate('/learn', { replace: true });
    }, 0);
    return <SimpleLoading text="Redirecting to dashboard..." />;
  }

  return (
    <div className="fixed inset-0 bg-white flex flex-col overflow-hidden">
      <div className="flex items-center justify-between p-2 sm:p-3 md:p-4 flex-shrink-0">
        <button
          onClick={handleBack}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-gray-600"
          title="Back"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
        </button>
        <div className="flex-1 mx-1 sm:mx-2 md:mx-4 flex flex-col items-center">
          <span className="text-[10px] sm:text-xs font-black text-blue-600/80 uppercase tracking-widest mb-0.5">
            {actualReviewMode ? 'REVISE PROGRESS' : 'LEARN PROGRESS'}: {actualReviewMode ? `${initialQueueCount - queue.length + 1} / ${initialQueueCount}` : `${index + 1} / ${items.length}`}
          </span>
          {actualReviewMode ? (
            <ProgressBar currentIndex={initialQueueCount - queue.length} total={Math.max(1, initialQueueCount)} />
          ) : (
            <ProgressBar currentIndex={index} total={items.length} />
          )}
        </div>
        <div className="flex items-center gap-1 sm:gap-2 md:gap-3">
          {(user?.role === 'admin' || user?.role === 'master' || user?.username === 'Host' || user?.username === 'hostcbse') ? (
            <button
              onClick={handleMasterSkip}
              className="px-3 py-1 bg-yellow-500 hover:bg-yellow-600 text-white text-xs font-black rounded-lg shadow-sm border-b-4 border-yellow-700 active:border-b-0 active:translate-y-1 transition-all mr-2 uppercase"
            >
              Skip ⚡️
            </button>
          ) : (
            <button
              onClick={handlePlayerSkip}
              className={`px-3 py-1 text-white text-xs font-black rounded-lg shadow-sm border-b-4 transition-all mr-2 uppercase ${skipsLeft > 0 ? 'bg-yellow-500 hover:bg-yellow-600 border-yellow-700 active:border-b-0 active:translate-y-1' : 'bg-gray-300 border-gray-400 opacity-80 cursor-not-allowed'}`}
            >
              Skip ({skipsLeft})
            </button>
          )}
          <StarCounter />
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center px-4 sm:px-6 md:px-8 overflow-y-auto pb-20">
        <div className="w-full max-w-3xl mt-6 sm:mt-10">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-gray-900 text-center mb-6">
            {item.question}
          </h2>
          {(() => {
            const imgs = (item.images || []).filter(Boolean);
            if (imgs.length === 0 && item.imageUrl) imgs.push(item.imageUrl);
            return imgs.length > 0 ? (
              <div className="w-full max-w-xl sm:max-w-2xl md:max-w-3xl mb-4 sm:mb-6 flex justify-center mx-auto">
                <div className="flex flex-wrap md:flex-nowrap items-center justify-center gap-1 sm:gap-3 md:gap-5">
                  {imgs.slice(0,5).map((src, i) => (
                    <div key={i} className="border border-blue-300 rounded-lg sm:rounded-2xl p-1 sm:p-3 bg-white shadow-sm">
                      <img src={src} alt={'desc-'+i} className="h-40 w-36 sm:h-32 sm:w-24 md:h-24 md:w-20 lg:h-32 lg:w-24 xl:h-40 xl:w-32 object-contain rounded-md sm:rounded-xl" />
                    </div>
                  ))}
                </div>
              </div>
            ) : null;
          })()}
          <div className="w-full space-y-4">
            <textarea
              value={userInput}
              onChange={handleTextChange}
              disabled={showResult}
              placeholder="Type your answer here..."
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="none"
              spellCheck="false"
              inputMode="text"
              data-gramm="false"
              data-form-type="other"
              data-lpignore="true"
              data-1p-ignore="true"
              name="descriptive-answer"
              className={`w-full h-40 p-4 border-2 rounded-xl text-lg font-medium focus:outline-none transition-colors ${
                showResult 
                  ? (isCorrect ? 'border-green-400 bg-green-50' : 'border-red-400 bg-red-50') 
                  : 'border-blue-200 focus:border-blue-500'
              }`}
            />

            {showResult && (
              <div className="space-y-6 animate-fade-in mt-6">
                <div className={`p-6 rounded-2xl border-2 shadow-sm ${
                  scoreData?.status === 'perfect' ? 'bg-green-50 border-green-300' :
                  scoreData?.status.startsWith('partial') ? 'bg-yellow-50 border-yellow-300' :
                  'bg-red-50 border-red-300'
                }`}>
                  <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
                    
                    {/* Score Circle */}
                    <div className="flex-shrink-0 flex flex-col items-center justify-center">
                      <div className={`w-24 h-24 rounded-full border-4 flex flex-col items-center justify-center bg-white shadow-inner ${
                        scoreData?.status === 'perfect' ? 'border-green-400 text-green-600' :
                        scoreData?.status.startsWith('partial') ? 'border-yellow-400 text-yellow-600' :
                        'border-red-400 text-red-600'
                      }`}>
                        <span className="text-3xl font-black">{scoreData?.percent}%</span>
                        <span className="text-[10px] font-bold opacity-80 uppercase tracking-wider">Match</span>
                      </div>
                      
                      {/* Stars */}
                      <div className="flex gap-1 mt-3">
                        {[...Array(3)].map((_, i) => (
                          <svg key={i} className={`w-6 h-6 ${i < scoreData?.stars ? 'text-yellow-400 fill-current drop-shadow-sm' : 'text-gray-300 fill-current'}`} viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                    </div>

                    {/* Details */}
                    <div className="flex-1 space-y-4 text-center md:text-left">
                      <div>
                        <h3 className={`text-2xl font-extrabold mb-1 ${
                          scoreData?.status === 'perfect' ? 'text-green-800' :
                          scoreData?.status.startsWith('partial') ? 'text-yellow-800' :
                          'text-red-800'
                        }`}>
                          {scoreData?.status === 'perfect' ? '🎉 Brilliant!' :
                           scoreData?.status.startsWith('partial') ? '⭐️ Good Attempt!' :
                           '💡 Needs a bit more detail'}
                        </h3>
                        <p className="text-sm font-medium text-gray-600 opacity-80">
                          {scoreData?.status === 'perfect' ? 'You matched all the key concepts perfectly.' :
                           scoreData?.status.startsWith('partial') ? 'You got some of it right, but missed a few key words.' :
                           'Try to include more of the required concepts next time.'}
                        </p>
                      </div>

                      {/* Keywords */}
                      {(foundKeywords.length > 0 || missedKeywords.length > 0) && (
                        <div className="pt-2">
                           <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Keyword Evaluation</p>
                           <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                             {foundKeywords.map((kw, i) => (
                               <span key={`f-${i}`} className="px-3 py-1.5 bg-green-100 border border-green-200 text-green-800 rounded-full text-xs font-bold flex items-center gap-1 shadow-sm"><span className="text-green-600">✓</span> {kw}</span>
                             ))}
                             {missedKeywords.map((kw, i) => (
                               <span key={`m-${i}`} className="px-3 py-1.5 bg-gray-100 border border-gray-200 text-gray-600 rounded-full text-xs font-medium flex items-center gap-1"><span className="text-red-400 font-bold">×</span> {kw}</span>
                             ))}
                           </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Expert Answer */}
                {(isCorrect || forceShowExpert) && ((item.modelAnswers && item.modelAnswers.length > 0) || item.text) && (
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-100 shadow-sm">
                    <h4 className="text-base font-bold text-indigo-900 mb-3 flex items-center gap-2">
                      <span className="text-xl">💡</span> Expert Answer
                    </h4>
                    <div className="bg-white/80 p-4 rounded-xl border border-white shadow-sm flex gap-3 items-start">
                       <p className="text-gray-800 font-medium leading-relaxed">
                         {(item.modelAnswers && item.modelAnswers.length > 0) ? item.modelAnswers[0] : item.text}
                       </p>
                    </div>
                  </div>
                )}

              </div>
            )}
          </div>
        </div>
        
        {/* Bottom padding - mobile only for fixed button */}
        <div className="h-24 sm:h-0"></div>
      </div>

      {/* Bottom Action Bar */}
      <div className="fixed sm:relative bottom-0 left-0 right-0 sm:bottom-auto sm:left-auto sm:right-auto bg-white/40 backdrop-blur-sm border-t-2 border-white/20 sm:border-t-0 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] sm:shadow-none px-4 sm:px-3 md:px-6 py-3 sm:py-3 z-50 sm:z-auto">
        {!showResult ? (
          <div className="w-full max-w-sm sm:max-w-md md:max-w-2xl lg:max-w-3xl mx-auto relative z-10">
            <button
              onClick={handleSubmit}
              disabled={!userInput.trim()}
              className={`w-full py-3.5 rounded-xl text-white font-extrabold text-xl shadow-lg transition-all uppercase tracking-wide ${
                userInput.trim() ? 'bg-blue-600 hover:bg-blue-700 active:scale-[0.98] cursor-pointer' : 'bg-gray-400 cursor-not-allowed opacity-80'
              }`}
            >
              Submit Answer
            </button>
          </div>
        ) : (
          <div className="w-full max-w-sm sm:max-w-md md:max-w-2xl lg:max-w-3xl mx-auto relative z-10">
            {isCorrect ? (
              <button
                onClick={handleNext}
                className="w-full py-3.5 rounded-xl text-white font-extrabold text-xl shadow-lg transition-all uppercase tracking-wide bg-[#58cc02] hover:bg-[#61e002] active:scale-[0.98] cursor-pointer"
              >
                Continue
              </button>
            ) : !showIncorrectModal ? (
              <button
                onClick={() => { setShowResult(false); setForceShowExpert(false); }}
                className="w-full py-3.5 rounded-xl text-white font-extrabold text-xl shadow-lg transition-all uppercase tracking-wide bg-[#ff4b4b] hover:bg-[#ff5f5f] active:scale-[0.98] cursor-pointer"
              >
                Try Again
              </button>
            ) : (
              <div className="h-[60px] sm:h-0"></div>
            )}
          </div>
        )}
      </div>

      {showIncorrectModal && (
        <IncorrectAnswerModal
          isOpen={showIncorrectModal}
          onClose={() => setShowIncorrectModal(false)}
          onTryAgain={() => { setShowIncorrectModal(false); setShowResult(false); setForceShowExpert(false); }}
          onViewExpertAnswer={() => { setShowIncorrectModal(false); setForceShowExpert(true); }}
          answer={`Suggested Keywords: ${item.keywords?.join(', ')}`}
          hideCorrectAnswer={true}
        />
      )}

      {showExitConfirm && (
        <div className="fixed inset-0 z-[9999]">
          <ConceptExitConfirm
            onQuit={() => {
              const urlParams = new URLSearchParams(window.location.search);
              const chapterId = urlParams.get('chapterId');
              const unitId = urlParams.get('unitId');
              const params = new URLSearchParams();
              if (chapterId) params.set('chapterId', chapterId);
              if (unitId) params.set('unitId', unitId);

              const query = params.toString();
              navigate(`/learn${query ? '?' + query : ''}`);
            }}
            onContinue={() => setShowExitConfirm(false)}
          />
        </div>
      )}
      <NoSkipsModal isOpen={showNoSkipsModal} onClose={() => setShowNoSkipsModal(false)} />
    </div>
  );
}
