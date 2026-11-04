import { isNewStyleStory } from '../../../utils/comicStyleHelper.js';
import { isMissionCompleteItem } from '../../../utils/missionCompleteHelper.js';
import ProgressBar from '../../ui/ProgressBar.jsx';
import SimpleLoading from '../../ui/SimpleLoading.jsx';
import IncorrectAnswerModal from '../../modals/IncorrectAnswerModal.jsx';
import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import QuizFeedbackCards from './QuizFeedbackCards.jsx';
import { trackLevelStart, trackFirstQuestionAnswered } from '../../../utils/analytics.js';
import { getLearningParams } from '../../../utils/analyticsHelpers.js';
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
import LessonHeader from '../LessonHeader.jsx';
import PlayfulBackground from './PlayfulBackground.jsx';
import { getStageInfoForIndex } from '../../../utils/moduleStages.js';
import ReportFlagButton from '../../common/ReportFlagButton.jsx';
import { vibrateLight, vibrateSuccess, vibrateError } from '../../../utils/vibrationService.js';
import { preloadAudio, playTtsAudio } from '../../../utils/audioPreloadService.js';

export const extractKeywords = (item) => {
  if (!item) return [];
  let rawSource = [];
  if (Array.isArray(item.keywords) && item.keywords.length > 0) {
    rawSource = item.keywords;
  } else if (item.audioKey && typeof item.audioKey === 'string' && item.audioKey.trim()) {
    rawSource = [item.audioKey];
  } else if (item.keyword && typeof item.keyword === 'string' && item.keyword.trim()) {
    rawSource = [item.keyword];
  } else if (typeof item.answer === 'string' && /key points?:/i.test(item.answer)) {
    const kp = item.answer.split(/key points?:/i)[1];
    rawSource = [kp];
  } else if (typeof item.answer === 'string') {
    const cleanAnswer = item.answer.replace(/^Model:\s*/i, '').trim();
    // Only treat answer as keyword if it's short and concise (< 80 chars),
    // never split a long model explanation paragraph into random comma fragments.
    if (cleanAnswer.length > 0 && cleanAnswer.length < 80) {
      rawSource = [cleanAnswer];
    }
  }

  // Flatten and split by commas, semicolons, or pipes
  const list = (Array.isArray(rawSource) ? rawSource : [rawSource])
    .flatMap(k => String(k || '').split(/[,;|]+/))
    .map(s => s.trim())
    .filter(Boolean);

  return Array.from(new Set(list));
};

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
  
  const stageInfo = useMemo(() => {
    if (!items || items.length === 0 || actualReviewMode) return null;
    return getStageInfoForIndex(items, index);
  }, [items, index, actualReviewMode]);

  // Audio preloading for 0-latency playback on question transitions
  useEffect(() => {
    if (items && items[index + 1]) {
      const nextItem = items[index + 1];
      if (nextItem.audioUrl) preloadAudio(nextItem.audioUrl);
    }
  }, [items, index]);
  
  useEffect(() => {
    const title = searchParams.get('title') || `Module ${moduleNumber}`;
    trackLevelStart(moduleNumber, title.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase() || `level_${moduleNumber}`);
  }, [moduleNumber]);

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
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);
  const baseTextRef = useRef('');
  const [skipsLeft, setSkipsLeft] = useState(() => {
    const stored = sessionStorage.getItem(`skips_${moduleNumber}`);
    return stored !== null ? parseInt(stored, 10) : 5;
  });

  const correctAudio = useRef(null);
  const errorAudio = useRef(null);

  const revisionItem = useMemo(() => {
    if (isRevisionModeFromUrl) {
      if (activeReviewItem && 
          String(activeReviewItem.moduleNumber) === String(moduleNumber) &&
          String(activeReviewItem.index) === String(index) &&
          activeReviewItem._revisionData) {
        return activeReviewItem._revisionData;
      }
      if (queue && queue.length > 0) {
        const matchingItem = queue.find(q => 
          String(q.moduleNumber) === String(moduleNumber) &&
          String(q.index) === String(index) &&
          q._revisionData
        );
        if (matchingItem && matchingItem._revisionData) {
          return matchingItem._revisionData;
        }
      }
    }
    return null;
  }, [isRevisionModeFromUrl, activeReviewItem, queue, moduleNumber, index]);

  const curriculumItem = useMemo(() => items[index] || null, [items, index]);

  const item = useMemo(() => {
    if (isRevisionModeFromUrl && revisionItem) {
      const revisionQuestion = revisionItem.question || revisionItem.text || '';
      return {
        ...(curriculumItem || {}),
        ...revisionItem,
        type: String(revisionItem.type || ''),
        question: revisionQuestion || curriculumItem?.question || '',
        text: revisionItem.text || revisionItem.question || curriculumItem?.text || '',
        answer: revisionItem.answer || curriculumItem?.answer || '',
        keywords: revisionItem.keywords || curriculumItem?.keywords || [],
        audioKey: revisionItem.audioKey || curriculumItem?.audioKey || '',
        images: Array.isArray(revisionItem.images) ? revisionItem.images : (curriculumItem?.images || []),
        explanation: revisionItem.explanation || curriculumItem?.explanation || '',
        onWrong: revisionItem.onWrong || curriculumItem?.onWrong || '',
        hint: revisionItem.hint || curriculumItem?.hint || ''
      };
    }
    return curriculumItem;
  }, [isRevisionModeFromUrl, revisionItem, curriculumItem]);

  const questionNumberDisplay = useMemo(() => {
    if (actualReviewMode) {
      const qTotal = initialQueueCount || queue.length || 1;
      const current = Math.max(1, qTotal - queue.length + 1);
      return `${current} / ${qTotal}`;
    }
    if (stageInfo && stageInfo.itemCountInStage) {
      const stageIdx = stageInfo.stageIndexInStage ?? (stageInfo.stageStartIndex !== undefined ? Math.max(0, index - stageInfo.stageStartIndex) : 0);
      const current = Math.min(stageIdx + 1, stageInfo.itemCountInStage);
      return `${current} / ${stageInfo.itemCountInStage}`;
    }
    const practiceList = (items || []).filter(it => ['multiple-choice', 'fill-in-the-blank', 'rearrange', 'descriptive'].includes(String(it?.type || '').toLowerCase()));
    if (practiceList.length > 0) {
      const pIdx = practiceList.findIndex(it => (it?.itemId && it?.itemId === item?.itemId) || it === items[index]);
      const currentQ = pIdx >= 0 ? pIdx + 1 : Math.min(index + 1, practiceList.length);
      return `${currentQ} / ${practiceList.length}`;
    }
    const totalCount = Math.max(1, items?.length || 1);
    const current = Math.min(index + 1, totalCount);
    return `${current} / ${totalCount}`;
  }, [actualReviewMode, initialQueueCount, queue, stageInfo, items, item, index]);

  const toggleSpeechRecognition = () => {
    if (isListening) {
      try {
        recognitionRef.current?.stop();
      } catch (_) {}
      setIsListening(false);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Please type your answer.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-IN';

      // Capture base text so incremental spoken words append without stuttering
      const currentText = userInput.trim();
      baseTextRef.current = currentText ? currentText + ' ' : '';

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => {
        setIsListening(false);
        recognitionRef.current = null;
      };
      recognition.onerror = (e) => {
        console.warn('Speech error:', e);
        setIsListening(false);
        recognitionRef.current = null;
      };

      recognition.onresult = (e) => {
        let finalChunk = '';
        let interimChunk = '';
        for (let i = 0; i < e.results.length; i++) {
          const res = e.results[i];
          if (res.isFinal) {
            finalChunk += (res[0]?.transcript || '') + ' ';
          } else {
            interimChunk += (res[0]?.transcript || '');
          }
        }
        const spoken = (finalChunk + interimChunk).trim();
        if (spoken) {
          setUserInput(baseTextRef.current + spoken);
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('Speech recognition failed to start:', err);
      setIsListening(false);
      recognitionRef.current = null;
    }
  };

  const playPromptAudio = () => {
    const textToSpeak = item?.question || item?.text || '';
    if (!textToSpeak) return;
    playTtsAudio(textToSpeak, item?.speaker || 'Arpit Sir');
  };

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
    setIsListening(false);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (_) {}
    }
  }, [moduleNumber, index]);

  // Reset server-side lesson score at entry
  useEffect(() => {
    (async () => {
      try {
        if (user?._id) {
          const params = new URLSearchParams(window.location.search);
          const title = params.get('title') || item?.title || `Module ${moduleNumber}`;
          authService.updateProgress({ userId: user._id, moduleId: String(moduleNumber), subject: user.subject || 'Science', lessonTitle: title, isCorrect: true, deltaScore: 0, resetLesson: index === 0 });
        }
      } catch (_) {}
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moduleNumber]);

  // GA4 Tracking: First Question Start
  useEffect(() => {
    if (!item || index !== 0) return;
    const firedKey = `first_question_started_${moduleNumber}`;
    if (!sessionStorage.getItem(firedKey)) {
      sessionStorage.setItem(firedKey, 'true');
      sessionStorage.setItem(`first_question_start_time_${moduleNumber}`, Date.now().toString());
      const searchParams = new URLSearchParams(window.location.search);
      const title = searchParams.get('title') || `Module ${moduleNumber}`;
      
      const learningParams = getLearningParams({
        user,
        module: { id: moduleNumber, levelName: title, moduleName: title, chapter: chapterIdParam, unit: unitIdParam },
        source: searchParams.get('source') || "question_page"
      });

      window.hyTrack?.("first_question_start", {
        ...learningParams,
        question_number: 1,
        question_type: item.type || "descriptive"
      });
    }
  }, [moduleNumber, index, item, user, chapterIdParam, unitIdParam]);

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

    // Safely extract and split keywords from keywords column / audioKey / key points
    const keywords = extractKeywords(item);
    
    const normalizedInput = normalize(userInput);
    
    const matched = [];
    const missed = [];

    const inputWords = normalizedInput.split(/\s+/).filter(Boolean);
    
    keywords.forEach(kw => {
      const nk = normalize(kw);
      if (!nk) return;
      
      // 1. Exact phrase match or phrase is a substring of the input
      let isMatch = normalizedInput.includes(nk);
      
      // 2. If no exact match, allow fuzzy word-level matching
      if (!isMatch) {
        const nkWords = nk.split(/\s+/).filter(Boolean);
        if (nkWords.length === 1) {
          isMatch = inputWords.some(w => {
            if (w === nk) return true;
            // Allow substring match only if both words are reasonably long (>= 4 chars)
            if (nk.length >= 4 && w.length >= 4) {
              return w.includes(nk) || nk.includes(w);
            }
            return false;
          });
        } else if (nkWords.length > 1) {
          // Multi-word phrase: match if at least 70% of significant words are found
          const significantWords = nkWords.filter(w => !['is', 'are', 'the', 'a', 'an', 'to', 'of', 'in', 'and', 'or', 'for', 'on', 'with'].includes(w));
          const targetWords = significantWords.length > 0 ? significantWords : nkWords;
          const matchedCount = targetWords.filter(w => inputWords.some(iw => iw === w || (w.length >= 4 && iw.includes(w)))).length;
          if (matchedCount / targetWords.length >= 0.7) {
            isMatch = true;
          }
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
      if (isCorrectStatus) {
        vibrateSuccess();
      } else {
        vibrateError();
      }
    } catch (_) {}

    // GA4 Tracking: First Question Answered
    const answeredKey = `first_question_answered_${moduleNumber}`;
    if (!sessionStorage.getItem(answeredKey)) {
      sessionStorage.setItem(answeredKey, 'true');
      const searchParams = new URLSearchParams(window.location.search);
      const title = searchParams.get('title') || `Module ${moduleNumber}`;
      
      const startTime = Number(sessionStorage.getItem(`first_question_start_time_${moduleNumber}`));
      const timeSpentSeconds = startTime ? Math.round((Date.now() - startTime) / 1000) : 0;
      
      const learningParams = getLearningParams({
        user,
        module: { id: moduleNumber, levelName: title, moduleName: title, chapter: chapterIdParam, unit: unitIdParam },
        source: searchParams.get('source') || "question_submit"
      });

      trackFirstQuestionAnswered(user?.classLevel || "unknown_class", moduleNumber, chapterIdParam, {
        ...learningParams,
        question_number: 1,
        question_type: item.type || "descriptive",
        answer_status: isCorrectStatus ? "correct" : "incorrect",
        score: scorePercent,
        time_spent_seconds: timeSpentSeconds
      });
    }

    const qid = `${moduleNumber}_${index}_descriptive`;
    const type = isRevisionModeFromUrl ? 'revision' : 'curriculum';

    if (isFirstAttempt) {
      addToSession(qid);
      if (isCorrectStatus) {
        awardCorrect(String(moduleNumber), qid, pts, { type });
        try {
          if (user?._id) {
            authService.updateProgress({ 
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
              authService.updateProgress({ 
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
    if (nextIndex >= items.length || isMissionCompleteItem(items[nextIndex])) {
      // 1. Mark as completed in database
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

    if (nextItem) {
      const q = String(nextItem.question || nextItem.text || '').toLowerCase();
      const ct = String(nextItem.cardTitle || nextItem.batchTitle || '').toLowerCase();
      const type = String(nextItem.type || '').toLowerCase();
      const isNextHotZone = q.includes('hot zone') || q.includes('hotzone') || ct.includes('hot zone') || type.includes('hotzone');
      const isNextExam = q.includes('exam moment') || q.includes('exam mode') || ct.includes('exam') || type === 'descriptive';

      const hotzoneKey = `hotzone_intro_shown_${moduleNumber}`;
      if (isNextHotZone && !sessionStorage.getItem(hotzoneKey) && !actualReviewMode) {
        sessionStorage.setItem(hotzoneKey, 'true');
        return navigate(`/learn/module/${moduleNumber}/hotzone-intro${suffix}`);
      }

      const examKey = `exam_intro_shown_${moduleNumber}`;
      if (isNextExam && !sessionStorage.getItem(examKey) && !actualReviewMode) {
        sessionStorage.setItem(examKey, 'true');
        return navigate(`/learn/module/${moduleNumber}/exam-intro${suffix}`);
      }
    }

    navigate(`${routeForType(nextItem?.type || 'concept', nextIndex)}${suffix}`);
  };

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

  const actualType = useMemo(() => {
    if (isRevisionModeFromUrl && revisionItem?.type) {
      return String(revisionItem.type || '').toLowerCase();
    }
    return String(item?.type || '').toLowerCase();
  }, [isRevisionModeFromUrl, revisionItem, item]);

  // Automatic redirect if the current question type does not match descriptive
  useEffect(() => {
    if (!loading && item && actualType && actualType !== 'descriptive') {
      const params = new URLSearchParams(window.location.search);
      const suffix = params.toString() ? `?${params.toString()}` : '';
      const targetRoute = routeForType(actualType, index);
      navigate(`${targetRoute}${suffix}`, { replace: true });
    }
  }, [loading, item, actualType, index, navigate]);

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
      navigate(`${routeForType(prevItem?.type || 'concept', prevIndex)}${suffix}`);
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
        authService.updateProgress({ userId: user._id, moduleId: String(moduleNumber), subject: user.subject || 'Science', lessonTitle: item?.title || `Module ${moduleNumber}`, isCorrect: true, deltaScore: 3 });
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

  // Only display if it's actually a descriptive type
  if (actualType !== 'descriptive') {
    return (
      <div className="fixed inset-0 select-none overflow-hidden">
        <PlayfulBackground cardIndex={index}>
          <LessonHeader
            onBack={handleBack}
            title={actualReviewMode ? 'REVISE PROGRESS' : 'PRACTICE'}
            currentIndex={actualReviewMode ? (initialQueueCount - queue.length) : index}
            total={actualReviewMode ? Math.max(1, initialQueueCount) : (items?.filter(it => !isMissionCompleteItem(it)).length || items.length)}
            stageInfo={stageInfo}
            theme="light"
            onSkip={handleMasterSkip}
          />
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <SimpleLoading text="Loading question..." />
            <div className="mt-4 flex gap-3">
              <button
                type="button"
                onClick={() => {
                  const targetRoute = routeForType(actualType, index);
                  const params = new URLSearchParams(window.location.search);
                  const suffix = params.toString() ? `?${params.toString()}` : '';
                  navigate(`${targetRoute}${suffix}`, { replace: true });
                }}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl shadow-md transition-all cursor-pointer"
              >
                Go to Question →
              </button>
              <button
                type="button"
                onClick={handleMasterSkip}
                className="px-6 py-2.5 bg-yellow-500 hover:bg-yellow-600 text-white font-black rounded-xl shadow-md transition-all cursor-pointer"
              >
                Skip ⚡️
              </button>
            </div>
          </div>
        </PlayfulBackground>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 select-none overflow-hidden">
      <PlayfulBackground cardIndex={index}>
      {/* Top Header (Unified Lesson Header) */}
      <LessonHeader
        onBack={handleBack}
        title="EXAM MOMENT"
        currentIndex={actualReviewMode ? (initialQueueCount - queue.length) : index}
        total={actualReviewMode ? Math.max(1, initialQueueCount) : (items?.filter(it => !isMissionCompleteItem(it)).length || items.length)}
        stageInfo={stageInfo}
        theme="light"
        showCount={false}
        onSkip={handleMasterSkip}
      />

      {/* Main Content Area - Top Aligned */}
      <div className={`flex-1 w-full max-w-md ${showResult ? 'lg:max-w-6xl' : 'lg:max-w-4xl'} px-4 lg:px-6 py-2 overflow-y-auto flex flex-col justify-start items-center`}>
        {/* White Exam Card */}
        <div className="w-full bg-white text-slate-900 rounded-[28px] sm:rounded-[32px] p-5 sm:p-6 lg:p-7 lgshort:p-5 border-2 border-[#D1FADF] shadow-[0_8px_30px_rgba(0,0,0,0.08)] mt-1 sm:mt-2 lg:mt-4 lgshort:mt-1 mb-3">
          {/* Card Top Row */}
          <div className="flex items-center justify-between mb-4">
            <span className="bg-[#101F33] text-white font-black text-xs px-3.5 py-1 rounded-full uppercase tracking-wider">
              {item?.badge && item.badge !== 'Exam moment' ? item.badge : 'Descriptive'}
            </span>
            <div className="flex items-center gap-2.5">
              <span className="text-slate-400 font-black text-sm">
                {questionNumberDisplay}
              </span>
              <ReportFlagButton
                itemId={item?.itemId || item?._id || `descriptive-${index}`}
                moduleId={moduleNumber}
                chapterId={chapterIdParam}
                questionText={item?.question}
                screenName={`Descriptive Q${index + 1}`}
              />
            </div>
          </div>

          {/* Question Title & TTS Speaker Button */}
          <div className="mb-4">
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-base sm:text-lg lg:text-2xl lgshort:text-lg font-black text-slate-900 leading-snug">
                {item.question}
              </h2>
              <button
                type="button"
                onClick={playPromptAudio}
                className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-300 flex items-center justify-center text-slate-700 transition-colors flex-shrink-0 cursor-pointer shadow-sm active:scale-95"
                title="Listen to question"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                  <path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.5A2.25 2.25 0 002.25 9.75v4.5A2.25 2.25 0 004.5 16.5h1.94l4.5 4.5c.944.945 2.56.276 2.56-1.06V4.06zM18.584 5.106a.75.75 0 011.06 0c3.808 3.807 3.808 9.98 0 13.788a.75.75 0 11-1.06-1.06 8.25 8.25 0 000-11.668.75.75 0 010-1.06z" />
                  <path d="M15.932 7.757a.75.75 0 011.061 0 6 6 0 010 8.486.75.75 0 01-1.06-1.061 4.5 4.5 0 000-6.364.75.75 0 010-1.06z" />
                </svg>
              </button>
            </div>
          </div>

          {/* Desktop: answer on the left and, once checked, feedback and score on the right.
              Below lg this wrapper is display:contents, so the phone layout is unchanged. */}
          <div className={showResult ? 'contents lg:grid lg:grid-cols-2 lg:gap-6 lg:items-start' : 'contents'}>
          {/* Textarea Input */}
          <div className="w-full mb-3">
            <label className="text-xs font-black text-slate-400 uppercase tracking-wider mb-1.5 block">
              Your answer
            </label>
            <textarea
              value={userInput}
              onChange={handleTextChange}
              disabled={showResult}
              placeholder="Write it in your own words..."
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="none"
              spellCheck="false"
              inputMode="text"
              className="w-full min-h-[120px] sm:min-h-[140px] lg:min-h-[150px] lgshort:min-h-[100px] p-3.5 lg:p-4 border-2 rounded-2xl text-base lg:text-lg font-semibold text-slate-800 bg-[#FBFBFA] focus:bg-white border-slate-200 focus:border-blue-500 focus:outline-none transition-colors resize-none"
            />

            {/* Speak Button */}
            {!showResult && (
              <button
                type="button"
                onClick={toggleSpeechRecognition}
                className={`mt-2.5 px-4 py-2 rounded-2xl font-black text-sm border-2 transition-all flex items-center gap-2 cursor-pointer shadow-sm active:scale-95 ${
                  isListening
                    ? 'bg-red-50 text-red-600 border-red-400 animate-pulse'
                    : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200'
                }`}
              >
                <span>{isListening ? '🔴' : '🎤'}</span>
                <span>{isListening ? 'Listening... (tap to stop)' : 'Speak'}</span>
              </button>
            )}
          </div>

          <div className="contents lg:block lg:-mt-2">
          {/* Universal Feedback Cards when incorrect */}
          <QuizFeedbackCards item={item} showResult={showResult} isCorrect={isCorrect} />

          {/* Keyword Feedback & Result Details */}
          {showResult && (
            <div className="mt-3 pt-3 lgshort:mt-2 lgshort:pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <span className={`text-sm font-black ${isCorrect ? 'text-green-600' : 'text-red-500'}`}>
                  {isCorrect ? '🎉 Great answer!' : '💡 Needs more details'}
                </span>
                <span className="text-xs font-bold text-slate-400">
                  {scoreData?.percent}% Match
                </span>
              </div>

              {/* Keywords */}
              {(foundKeywords.length > 0 || missedKeywords.length > 0) && (
                <div className="flex flex-wrap gap-1.5 mb-3 lgshort:mb-2">
                  {foundKeywords.map((kw, i) => (
                    <span key={`f-${i}`} className="px-2.5 py-1 bg-green-50 border border-green-200 text-green-700 rounded-xl text-xs font-bold flex items-center gap-1">
                      <span>✓</span> {kw}
                    </span>
                  ))}
                  {missedKeywords.map((kw, i) => (
                    <span key={`m-${i}`} className="px-2.5 py-1 bg-slate-100 border border-slate-200 text-slate-500 rounded-xl text-xs font-medium flex items-center gap-1">
                      <span>×</span> {kw}
                    </span>
                  ))}
                </div>
              )}

              {/* In-card Retry / Continue for incorrect result */}
              {!isCorrect && (
                <div className="flex items-center gap-2.5 mt-2">
                  <button
                    type="button"
                    onClick={() => { setShowResult(false); setForceShowExpert(false); }}
                    className="flex-1 py-3 rounded-2xl font-black text-sm bg-[#ff4b4b] hover:bg-[#ff5f5f] text-white shadow-md active:translate-y-[2px] transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    🔄 Try again
                  </button>
                  <button
                    type="button"
                    onClick={() => handleNext(true)}
                    className="flex-1 py-3 rounded-2xl font-black text-sm bg-slate-100 hover:bg-slate-200 border-2 border-slate-300 text-slate-700 shadow-sm active:translate-y-[2px] transition-all cursor-pointer flex items-center justify-center"
                  >
                    Continue
                  </button>
                </div>
              )}
            </div>
          )}
          </div>
          </div>
        </div>
      </div>

      {/* Bottom Actions Outside Card - Anchored to bottom */}
      {!showResult && (
        <div className="w-full max-w-md lg:max-w-4xl px-4 lg:px-6 py-3 lg:pb-6 flex-shrink-0 bg-transparent flex flex-col items-center">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!userInput.trim()}
            className={`w-full py-4 rounded-2xl font-black text-lg uppercase tracking-wider transition-all select-none shadow-lg ${
              userInput.trim()
                ? 'bg-[#1E74FD] hover:bg-blue-600 active:scale-[0.98] text-white shadow-blue-500/20 cursor-pointer'
                : 'bg-[#DCE5EF] text-[#8295AA] cursor-not-allowed shadow-none'
            }`}
          >
            Check
          </button>
          <button
            type="button"
            onClick={handlePlayerSkip}
            className="mt-2 text-slate-500 hover:text-slate-800 font-bold text-sm tracking-wide uppercase transition-colors cursor-pointer py-1"
          >
            Skip
          </button>
        </div>
      )}

      {/* Inline feedback bar (only on correct submission) */}
      {showResult && isCorrect && (
        <div className="fixed left-0 right-0 bottom-0 z-[100] pb-safe shadow-[0_-10px_40px_rgba(0,0,0,0.2)] bg-[#d7ffb8]">
          <div className="w-full max-w-sm sm:max-w-md mx-auto px-6 py-4 flex flex-col gap-3 relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full flex items-center justify-center shadow-inner bg-white text-[#58a700]">
                <span className="text-xl">✓</span>
              </div>
              <div className="flex flex-col">
                <p className="text-[18px] font-black tracking-tight leading-tight text-[#58a700]">
                  You are correct!
                </p>
              </div>
            </div>
            
            <button
              onClick={handleNext}
              className="w-full py-3.5 rounded-[16px] text-[16px] font-black tracking-widest shadow-[0_4px_0_rgba(0,0,0,0.2)] transform active:translate-y-1 active:shadow-none transition-all uppercase bg-[#58cc02] text-white hover:bg-[#61e002] cursor-pointer"
            >
              CONTINUE
            </button>
          </div>
        </div>
      )}

      {showIncorrectModal && (
        <IncorrectAnswerModal
          isOpen={showIncorrectModal}
          onClose={() => setShowIncorrectModal(false)}
          onTryAgain={() => { setShowIncorrectModal(false); setShowResult(false); setForceShowExpert(false); }}
          onViewExpertAnswer={() => { setShowIncorrectModal(false); setForceShowExpert(true); }}
          answer={`Suggested Keywords: ${extractKeywords(item).join(', ')}`}
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
      </PlayfulBackground>
    </div>
  );
}
