import { isNewStyleStory } from '../../../utils/comicStyleHelper.js';
import { isMissionCompleteItem } from '../../../utils/missionCompleteHelper.js';
import { Haptics } from '@capacitor/haptics';
import ProgressBar from '../../ui/ProgressBar.jsx';
import SimpleLoading from '../../ui/SimpleLoading.jsx';
import TryAgainModal from '../../modals/TryAgainModal.jsx';
import IncorrectAnswerModal from '../../modals/IncorrectAnswerModal.jsx';
// Inline feedback bar instead of modal
import authService from '../../../services/authService.js';
import { useAuth } from '../../../context/AuthContext.jsx';
import { useReview } from '../../../context/ReviewContext.jsx';
import { useStars, StarCounter } from '../../../context/StarsContext.jsx';
import pointsService from '../../../services/pointsService.js';
import curriculumService from '../../../services/curriculumService.js';
import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { trackLevelStart } from '../../../utils/analytics.js';
import { getLearningParams } from '../../../utils/analyticsHelpers.js';
import { trackFirstQuestionAnswered } from '../../../utils/analytics.js';
import { useModuleItems } from '../../../hooks/useModuleItems';
import ConceptExitConfirm from '../../modals/ConceptExitConfirm.jsx';
import NoSkipsModal from '../../modals/NoSkipsModal.jsx';
// Audio imports
import correctSound from '../../../assets/sounds/correct-choice-43861.mp3';
import wrongSound from '../../../assets/sounds/error-010-206498.mp3';
import LessonHeader from '../LessonHeader.jsx';
import PlayfulBackground from './PlayfulBackground.jsx';
import { getStageInfoForIndex } from '../../../utils/moduleStages.js';
import ReportFlagButton from '../../common/ReportFlagButton.jsx';
import { vibrateLight, vibrateSuccess, vibrateError } from '../../../utils/vibrationService.js';
import { preloadAudio, playTtsAudio } from '../../../utils/audioPreloadService.js';

export default function RearrangePage({ onQuestionComplete, isReviewMode = false }) {
  const navigate = useNavigate();
  const { moduleNumber, index: indexParam } = useParams();
  const index = Number(indexParam || 0);
  const { items, loading, error } = useModuleItems(moduleNumber);
  // Check if we're in review or revision mode from URL params
  const urlParams = new URLSearchParams(window.location.search);
  const isReviewModeFromUrl = urlParams.get('review') === 'true';
  const isRevisionModeFromUrl = urlParams.get('revision') === 'true';
  const chapterIdParam = urlParams.get('chapterId');
  const unitIdParam = urlParams.get('unitId');
  const actualReviewMode = isReviewMode || isReviewModeFromUrl || isRevisionModeFromUrl;
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
    const title = urlParams.get('title') || `Module ${moduleNumber}`;
    trackLevelStart(moduleNumber, title.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase() || `level_${moduleNumber}`);
  }, [moduleNumber]);

  const { add: addToReview, removeActive, requeueActive, undoActive, stageIncorrect, clearStagedForModule, active: activeReviewItem, queue, initialQueueCount } = useReview();
  // Use revision data if in revision mode and available, otherwise use curriculum item
  // IMPORTANT: Only use activeReviewItem if it matches the current URL params
  const revisionItem = useMemo(() => {
    if (isRevisionModeFromUrl) {
      // First check if activeReviewItem matches current URL params
      if (activeReviewItem && 
          String(activeReviewItem.moduleNumber) === String(moduleNumber) &&
          String(activeReviewItem.index) === String(index) &&
          activeReviewItem._revisionData) {
        return activeReviewItem._revisionData;
      }
      // If not, search queue for matching item
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
  // Prefer revision data over curriculum item when in revision mode
  // Merge revision data with curriculum item structure to ensure all fields are available
  const item = useMemo(() => {
    if (isRevisionModeFromUrl && revisionItem) {
      // Use revision data but merge with curriculum item for missing fields (like images)
      // Revision questions might have 'question' or 'text' field - prioritize 'question'
      // IMPORTANT: Preserve revisionItem.type exactly (don't override with curriculum type)
      const revisionQuestion = revisionItem.question || revisionItem.text || '';
      return {
        ...(curriculumItem || {}),
        ...revisionItem,
        type: String(revisionItem.type || ''), // Preserve revision type exactly
        question: revisionQuestion || curriculumItem?.question || '',
        text: revisionItem.text || revisionItem.question || curriculumItem?.text || '',
        words: Array.isArray(revisionItem.words) && revisionItem.words.length > 0 ? revisionItem.words : (curriculumItem?.words || []),
        options: Array.isArray(revisionItem.options) && revisionItem.options.length > 0 ? revisionItem.options : (curriculumItem?.options || []),
        answer: revisionItem.answer || curriculumItem?.answer || '',
        images: Array.isArray(revisionItem.images) ? revisionItem.images : (curriculumItem?.images || []),
        explanation: revisionItem.explanation || curriculumItem?.explanation || '',
        onWrong: revisionItem.onWrong || curriculumItem?.onWrong || '',
        hint: revisionItem.hint || curriculumItem?.hint || ''
      };
    }
    return curriculumItem;
  }, [isRevisionModeFromUrl, revisionItem, curriculumItem]);
  // Local cache writers so dashboard star updates immediately on completion
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
  const { stars: totalStars, awardCorrect, awardWrong, addToSession, clearSession } = useStars();






  const [arrangedWords, setArrangedWords] = useState([]);
  const [availableWords, setAvailableWords] = useState([]);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [draggedItem, setDraggedItem] = useState(null);
  const [feedback, setFeedback] = useState({ open: false, correct: false, expected: '' });
  const [isResetting, setIsResetting] = useState(false);
  const [showTryAgainModal, setShowTryAgainModal] = useState(false);
  const [showIncorrectModal, setShowIncorrectModal] = useState(false);
  const [hasAnsweredCorrectly, setHasAnsweredCorrectly] = useState(false);
  const [isFlagged] = useState(false);
  const [showTryAgainOption, setShowTryAgainOption] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [showNoSkipsModal, setShowNoSkipsModal] = useState(false);
  // First-attempt guard per question instance
  const [hasAttempted, setHasAttempted] = useState(false);
  const [videoAcknowledged, setVideoAcknowledged] = useState(false);
  const [showEndVideo, setShowEndVideo] = useState(false);
  const [isTypeMode, setIsTypeMode] = useState(false);
  const [typedText, setTypedText] = useState('');
  const [skipsLeft, setSkipsLeft] = useState(() => {
    const stored = sessionStorage.getItem(`skips_${moduleNumber}`);
    return stored !== null ? parseInt(stored, 10) : 5;
  });

  const rawExplanation = String(
    item?.explanation || 
    item?.Explanation || 
    item?.solution || 
    item?.Solution || 
    item?.why || 
    item?.reason || 
    ''
  ).trim();

  const correctAnswerStr = Array.isArray(item?.answer) ? item.answer.join(', ') : String(item?.answer || '');

  const explanationContent = rawExplanation
    ? (rawExplanation.toLowerCase().startsWith('the answer is')
        ? rawExplanation
        : (correctAnswerStr ? `The answer is “${correctAnswerStr}”. ${rawExplanation}` : rawExplanation))
    : '';

  const onWrongContent = String(
    item?.onWrong || 
    item?.OnWrong || 
    item?.on_wrong || 
    item?.hint || 
    item?.Hint || 
    item?.thinkOfIt || 
    item?.think_of_it || 
    item?.mnemonic || 
    item?.trick || 
    ''
  ).trim();

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
        question_type: item.type || "rearrange"
      });
    }
  }, [moduleNumber, index, item, user, chapterIdParam, unitIdParam]);

  // Start-of-lesson videos (index 0)
  const forcedIntroByModule = useMemo(() => ({
    '68e276236d69ef07c1a2e133': 'https://youtu.be/33bEGe44vyE',
    '68e276b26d69ef07c1a2e167': 'https://youtu.be/mo-oW33Dqu0',
    '68e2771a6d69ef07c1a2e1ab': 'https://youtu.be/ytSYjCqQUj0',
    '68e277716d69ef07c1a2e1d1': 'https://youtu.be/26THnY_3mtY',
    '68e277b86d69ef07c1a2e20f': 'https://youtu.be/CIqRRxP4r7g',
    '68e7cfa9d96c390ca2489fbb': 'https://youtu.be/OYQNzRLDjCo',
    '68e7d53dd96c390ca248a099': 'https://youtu.be/T4-LR0PCGB4',
    '68e7de6bd96c390ca248a0f2': 'https://youtu.be/DbGZ0KSS0ZU',
    '68e7df9bd96c390ca248a12d': 'https://youtu.be/SymhcoFMNaw',
    '68eba905996044d1e5cbefd6': 'https://youtu.be/i59cR7MPD5M',
    '68ebaa6c996044d1e5cbf031': 'https://youtu.be/OoLh_Ck1PTA',
    '68ebb957fc8995cc925650d8': 'https://youtu.be/8kjtyxEIgbg',
    '68ebbaddfc8995cc925650fe': 'https://youtu.be/t41q21zK-iM',
    '68ebbb5ffc8995cc92565152': 'https://youtu.be/fIrQIhIAB4s',
    '68ebbc67fc8995cc925651dd': 'https://youtu.be/9YcQzKUG0vo',
    '68ebc01cfc8995cc92565205': 'https://youtu.be/yh_18cJbBww',
    '68ebc134fc8995cc92565279': 'https://youtu.be/snE3QBO1cDo',
    '691726f9bcaad0116413deb8': 'https://youtu.be/uxX4tcZ5vVY', // Before card 1
    '69172e1dbcaad0116413e604': 'https://youtu.be/gbCBsR9d75E', // Before card 1
    '69172ebdbcaad0116413e70c': 'https://youtu.be/7wq7V8z-Rkc', // Before card 1
    '69173004bcaad0116413e8a7': 'https://youtu.be/UfH2T532NJk', // Before card 1
    '6917310abcaad0116413e9df': 'https://youtu.be/VyfltE9RuX8', // Before card 1
    '69173227bcaad0116413eb53': 'https://youtu.be/3kSLLVlWGYE', // Before card 1
    '691733dbbcaad0116413ed5c': 'https://youtu.be/qzT3C5T1fpo', // Before card 1
    '69173549bcaad0116413ef25': 'https://youtu.be/fl-2yuASqfw', // Before card 1
  }), []);

  // Mid-lesson videos: { 'moduleId:cardIndex': videoUrl }
  // End-of-lesson videos (after last item, before lesson complete)
  const midLessonVideos = useMemo(() => ({
    '68e276236d69ef07c1a2e133:12': 'https://youtu.be/2H3FWuKsahg', // Before card 13
    '68e276b26d69ef07c1a2e167:19': 'https://youtu.be/8uplR1ztb64', // Before card 20
    '68e276b26d69ef07c1a2e167:26': 'https://youtu.be/8uplR1ztb64', // Before card 27 (MCQ)
    '68e2771a6d69ef07c1a2e1ab:5': 'https://youtu.be/kcNefeA1RS8', // Before card 6
    '68e277716d69ef07c1a2e1d1:13': 'https://youtu.be/xDsXRV0MklE', // Before card 14
    '68e7cfa9d96c390ca2489fbb:5': 'https://youtu.be/IZx6UiwF7VE', // Before card 6
    '68e7d53dd96c390ca248a099:10': 'https://youtu.be/X2TVQFJZhqk', // Before card 11
    '68e7df9bd96c390ca248a12d:22': 'https://youtu.be/uu94oylVRzA', // Before card 23
    '68eba905996044d1e5cbefd6:15': 'https://youtu.be/m2_hLp0mLkM', // Before card 16
    '68ebb957fc8995cc925650d8:9': 'https://youtu.be/-nbylv4qSbA', // Before card 10
    '68ebbaddfc8995cc925650fe:17': 'https://youtu.be/OzoJVHp0SVQ', // Before card 18
  }), []);

  const isYouTubeUrl = useCallback((rawUrl) => {
    if (!rawUrl) return '';
    try {
      const url = new URL(rawUrl);
      const host = url.hostname.replace(/^www\./, '');
      if (host === 'youtu.be') return url.pathname.replace('/', '') || '';
      if (host === 'youtube.com' || host === 'm.youtube.com') {
        const vid = url.searchParams.get('v');
        if (vid) return vid;
        const parts = url.pathname.split('/');
        const embedIdx = parts.indexOf('embed');
        if (embedIdx !== -1 && parts[embedIdx + 1]) {
          return parts[embedIdx + 1];
        }
      }
    } catch (_) {}
    return '';
  }, []);

  const normalizeVideoUrl = useCallback((rawUrl) => {
    if (!rawUrl) return '';
    const ytId = isYouTubeUrl(rawUrl);
    if (ytId) {
      return `https://www.youtube.com/embed/${ytId}?modestbranding=1&rel=0&controls=1`;
    }
    return rawUrl;
  }, [isYouTubeUrl]);

  const midLessonKey = `${moduleNumber}:${index}`;
  
  // Check for end-of-lesson video (after completing last item)
  const introVideoUrl = useMemo(() => {
    if (showEndVideo) {
      const endVideoKey = `${moduleNumber}:${index}`;
      const endVideo = midLessonVideos[endVideoKey] || '';
      if (endVideo) return normalizeVideoUrl(endVideo);
    }
    // Check for mid-lesson video (specific card/index)
    const midLessonVideo = midLessonVideos[midLessonKey] || '';
    // Check for start-of-lesson video (index 0)
    const startVideo = index === 0 ? (forcedIntroByModule[String(moduleNumber)] || '') : '';
    const src = midLessonVideo || startVideo || '';
    return src ? normalizeVideoUrl(src) : '';
  }, [showEndVideo, moduleNumber, index, midLessonVideos, midLessonKey, forcedIntroByModule, normalizeVideoUrl]);

  // Reset gate when reaching a card with mid-lesson video or start video (index 0)
  useEffect(() => {
    if (index === 0 || midLessonVideos[midLessonKey]) {
      setVideoAcknowledged(false);
    }
  }, [moduleNumber, index, midLessonVideos, midLessonKey]);

  // Reset showEndVideo when module changes
  useEffect(() => {
    setShowEndVideo(false);
  }, [moduleNumber]);
  
  // Audio refs
  const correctAudioRef = useRef(null);
  const wrongAudioRef = useRef(null);

  // Initialize audio on component mount
  useEffect(() => {
    correctAudioRef.current = new Audio(correctSound);
    wrongAudioRef.current = new Audio(wrongSound);
    
    // Set volume levels: louder correct, softer wrong
    correctAudioRef.current.volume = 1.0;
    wrongAudioRef.current.volume = 0.35;
    
    // Cleanup on unmount
    const questionNumberDisplay = useMemo(() => {
    if (actualReviewMode) {
      return `${initialQueueCount - queue.length + 1} / ${initialQueueCount}`;
    }
    if (stageInfo && stageInfo.itemCountInStage) {
      return `${stageInfo.stageIndexInStage + 1} / ${stageInfo.itemCountInStage}`;
    }
    const practiceList = (items || []).filter(it => ['multiple-choice', 'fill-in-the-blank', 'rearrange', 'descriptive'].includes(String(it?.type || '').toLowerCase()));
    if (practiceList.length > 0) {
      const pIdx = practiceList.findIndex(it => (it?.itemId && it?.itemId === item?.itemId) || it === items[index]);
      const currentQ = pIdx >= 0 ? pIdx + 1 : 1;
      return `${currentQ} / ${practiceList.length}`;
    }
    return `${index + 1} / ${items.length}`;
  }, [actualReviewMode, initialQueueCount, queue, stageInfo, items, item, index]);

  return () => {
      if (correctAudioRef.current) {
        correctAudioRef.current.pause();
        correctAudioRef.current = null;
      }
      if (wrongAudioRef.current) {
        wrongAudioRef.current.pause();
        wrongAudioRef.current = null;
      }
    };
  }, []);

  // Audio play functions
  const playCorrectSound = () => {
    if (correctAudioRef.current) {
      correctAudioRef.current.currentTime = 0; // Reset to beginning
      correctAudioRef.current.play().catch(error => {
        console.log('Could not play correct sound:', error);
      });
    }
  };

  const playWrongSound = () => {
    if (wrongAudioRef.current) {
      wrongAudioRef.current.currentTime = 0; // Reset to beginning
      wrongAudioRef.current.play().catch(error => {
        console.log('Could not play wrong sound:', error);
      });
    }
  };

  useEffect(() => {
    if (chapterIdParam && unitIdParam) {
      try {
        const map = JSON.parse(localStorage.getItem('last_unit_by_chapter') || '{}');
        map[chapterIdParam] = unitIdParam;
        localStorage.setItem('last_unit_by_chapter', JSON.stringify(map));
      } catch (_) {}
    }
  }, [chapterIdParam, unitIdParam]);

  // Reset state when item changes; populate words robustly
  useEffect(() => {
    setArrangedWords([]);
    setIsTypeMode(false);
    setTypedText('');
    setShowResult(false);
    setIsCorrect(false);
    setDraggedItem(null);
    setFeedback({ open: false, correct: false, expected: '' });
    setShowTryAgainModal(false);
    setShowIncorrectModal(false);
    setHasAnsweredCorrectly(false);
    setShowTryAgainOption(false);
    setHasAttempted(false);

    if (!item) return;

    // Helper: detect if a token is just an arrow or arrow-like separator
    const isArrowToken = (w) => {
      if (!w || typeof w !== 'string') return true;
      const clean = w.trim();
      if (!clean) return true;
      if (/^[\s\->←↑↓↔↕➔➜➡➤⇒⇨><=]+$/.test(clean)) return true;
      if (/^[\u2190-\u21FF\u27F0-\u27FF\u2900-\u297F\u2B00-\u2BFF\s\-><=]+$/.test(clean)) return true;
      return false;
    };

    // Helper: strip arrows from word boundaries (e.g. "Mouth→" -> "Mouth")
    const cleanWord = (w) => {
      if (typeof w !== 'string') return '';
      return w
        .replace(/[\u2190-\u21FF\u27F0-\u27FF\u2900-\u297F\u2B00-\u2BFF]/g, '')
        .replace(/->|-->|=>|==>/g, '')
        .trim();
    };

    let words = [];

    // 1. Prefer explicit words array if populated with non-arrow items
    if (Array.isArray(item.words) && item.words.length > 0) {
      words = item.words.map(cleanWord).filter(w => w && !isArrowToken(w));
    }

    // 2. Fallback to options array (e.g. ['Stomach', 'Mouth', 'Anus', 'Large intestine', ...])
    if ((!words || words.length === 0) && Array.isArray(item.options) && item.options.length > 0) {
      words = item.options.map(cleanWord).filter(w => w && !isArrowToken(w));
    }

    // 3. Fallback to options string if comma-separated
    if ((!words || words.length === 0) && typeof item.options === 'string' && item.options.trim()) {
      words = item.options
        .split(',')
        .map(s => cleanWord(s.trim()))
        .filter(w => w && !isArrowToken(w));
    }

    // 4. Derive from answer if neither words nor options were available
    if (!words || words.length === 0) {
      const correctAnswer = Array.isArray(item?.answer) ? String(item.answer[0] || '') : String(item?.answer || '');
      // If answer has arrow separators (e.g. "Mouth → Food pipe → Stomach ..."), split by arrows!
      const hasArrowSeparators = /[\u2190-\u21FF\u27F0-\u27FF\u2900-\u297F\u2B00-\u2BFF]|->|-->|=>/.test(correctAnswer);
      if (hasArrowSeparators) {
        words = correctAnswer
          .split(/\s*(?:[\u2190-\u21FF\u27F0-\u27FF\u2900-\u297F\u2B00-\u2BFF]|->|-->|=>|==>)\s*/)
          .map(cleanWord)
          .filter(w => w && !isArrowToken(w));
      } else {
        const derived = correctAnswer.split(/\s+/).map(cleanWord).filter(w => w && !isArrowToken(w));
        // Add neutral extras only if derived sentence is very short (<= 4 words)
        if (derived.length <= 4) {
          const extrasPool = ['the','a','is','are','not','and','in','on','with','of'];
          const extras = extrasPool.filter(x => !derived.includes(x)).slice(0, 2);
          words = [...derived, ...extras];
        } else {
          words = derived;
        }
      }
    }

    // Final safety filter: NO arrows can ever enter available words
    words = words.map(cleanWord).filter(w => w && !isArrowToken(w));

    // Shuffle
    const shuffled = [...words].sort(() => Math.random() - 0.5);
    setAvailableWords(shuffled);
  }, [item, moduleNumber, index]);

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

  // Show exit confirmation on browser back button in revision/review mode
  useEffect(() => {
    if (!actualReviewMode) return;

    const handlePop = () => {
      // Show confirmation dialog
      setShowExitConfirm(true);
      // Prevent navigation by pushing current state back
      try {
        window.history.pushState(null, '', window.location.href);
      } catch (_) {}
    };

    const handleKey = (e) => {
      // Show confirmation on Alt+Left (common back navigation shortcut)
      if (e.altKey && e.key === 'ArrowLeft') {
        e.preventDefault();
        setShowExitConfirm(true);
      }
    };

    // Push current state to track back navigation
    try {
      window.history.pushState(null, '', window.location.href);
    } catch (_) {}

    window.addEventListener('popstate', handlePop);
    window.addEventListener('keydown', handleKey);

    return () => {
      window.removeEventListener('popstate', handlePop);
      window.removeEventListener('keydown', handleKey);
    };
  }, [actualReviewMode]);

  // Enter to submit/continue
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'Enter' && e.keyCode !== 13) return;
      console.log('[REARRANGE] Enter pressed', { showResult, arrangedWordsLen: arrangedWords.length });
      if (!item) return;
      if (!showResult) {
        console.log('[REARRANGE] Submitting via Enter');
        handleSubmit();
      } else {
        console.log('[REARRANGE] Continuing via Enter');
        handleNext();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [item, showResult, arrangedWords]);

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

  const handleDragStart = (e, word, source, index) => {
    setDraggedItem({ word, source, index });
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, target) => {
    e.preventDefault();
    if (!draggedItem) return;

    const { word, source, index: draggedIndex } = draggedItem;

    if (source === 'available' && target === 'arranged') {
      // Move from available to arranged - remove only the specific instance
      setAvailableWords(prev => {
        const newWords = [...prev];
        newWords.splice(draggedIndex, 1);
        return newWords;
      });
      setArrangedWords(prev => [...prev, word]);
    } else if (source === 'arranged' && target === 'available') {
      // Move from arranged to available - remove only the specific instance
      setArrangedWords(prev => {
        const newWords = [...prev];
        newWords.splice(draggedIndex, 1);
        return newWords;
      });
      setAvailableWords(prev => [...prev, word]);
    } else if (source === 'arranged' && target === 'arranged') {
      // Reorder within arranged
      const newArranged = [...arrangedWords];
      const fromIndex = newArranged.indexOf(word);
      const toIndex = parseInt(e.target.dataset.index) || newArranged.length;
      
      if (fromIndex !== toIndex) {
        newArranged.splice(fromIndex, 1);
        newArranged.splice(toIndex, 0, word);
        setArrangedWords(newArranged);
      }
    }

    setDraggedItem(null);
  };

  const handleWordClick = (word, source, index) => {
    if (showResult && isCorrect) return;
    if (showResult && !isCorrect) {
      setShowResult(false);
      setIsCorrect(false);
    }

    if (source === 'available') {
      setAvailableWords(prev => {
        const newWords = [...prev];
        newWords.splice(index, 1);
        return newWords;
      });
      setArrangedWords(prev => [...prev, word]);
    } else {
      setArrangedWords(prev => {
        const newWords = [...prev];
        newWords.splice(index, 1);
        return newWords;
      });
      setAvailableWords(prev => [...prev, word]);
    }
  };

  const handleMoveWord = (idx, direction) => {
    if (showResult && isCorrect) return;
    if (showResult && !isCorrect) {
      setShowResult(false);
      setIsCorrect(false);
    }
    const targetIdx = idx + direction;
    if (targetIdx < 0 || targetIdx >= arrangedWords.length) return;
    setArrangedWords(prev => {
      const next = [...prev];
      const temp = next[idx];
      next[idx] = next[targetIdx];
      next[targetIdx] = temp;
      return next;
    });
  };

  const handleClearAll = () => {
    if (arrangedWords.length === 0) return;
    if (showResult && isCorrect) return;
    if (showResult && !isCorrect) {
      setShowResult(false);
      setIsCorrect(false);
    }
    setAvailableWords(prev => [...prev, ...arrangedWords]);
    setArrangedWords([]);
  };

  const handleResetWords = () => {
    if (arrangedWords.length === 0) return;
    setIsResetting(true);
    // brief animation period
    setTimeout(() => {
      setAvailableWords(prev => [...prev, ...arrangedWords]);
      setArrangedWords([]);
      setIsResetting(false);
    }, 200);
  };

  const playPromptAudio = () => {
    const textToSpeak = item?.targetWord || item?.answer || item?.question || item?.text || '';
    if (!textToSpeak) return;
    playTtsAudio(textToSpeak, item?.speaker || 'Arpit Sir');
  };

  const handleSubmit = async () => {
    if (showResult) return;
    // Normalize answers to avoid punctuation/extra-space mismatches
    const normalize = (s) => String(s || '')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .trim();
    const userVal = normalize(isTypeMode ? typedText : arrangedWords.join(''));
    const correctAnswer = Array.isArray(item.answer) ? item.answer[0] : item.answer;
    const correctVal = normalize(correctAnswer);
    const targetVal = normalize(item.targetWord || correctAnswer);
    const correct = userVal === correctVal || userVal === targetVal;
    
    setIsCorrect(correct);
    setShowResult(true);
    if (correct) {
      playCorrectSound();
      vibrateSuccess();
    } else {
      playWrongSound();
      vibrateError();
    }
    const isFirstAttempt = !hasAttempted;
    if (!hasAttempted) setHasAttempted(true);

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
        question_type: item.type || "rearrange",
        answer_status: correct ? "correct" : "incorrect",
        score: correct ? 1 : 0,
        time_spent_seconds: timeSpentSeconds
      });
    }

    // Play appropriate audio feedback
    if (correct) {
      playCorrectSound();
      setHasAnsweredCorrectly(true);
      setShowTryAgainOption(false); // Hide try again when correct
      if (isFirstAttempt) {
        const qid = `${moduleNumber}_${index}_rearrange`;
        const pts = 3;
        const type = isRevisionModeFromUrl ? 'revision' : 'curriculum';
        if (pts !== 0) awardCorrect(String(moduleNumber), qid, pts, { type });
        addToSession(qid);
        try {
          if (user?._id) {
            authService.updateProgress({ userId: user._id, moduleId: String(moduleNumber), subject: user?.subject || 'Science', lessonTitle: item?.title || `Module ${moduleNumber}`, isCorrect: true, deltaScore: pts });
          }
        } catch (_) {}
      }
      
      if (actualReviewMode) {
        removeActive();
        navigate('/review-round');
      }
    } else {
      // Haptic feedback for incorrect answer
      try {
        Haptics.vibrate();
      } catch (_) {}

      playWrongSound();
      // Immediate feedback and enqueue for review
      setShowTryAgainOption(false);
      // setShowIncorrectModal(true); // Modal disabled per user request
      if (isFirstAttempt && !actualReviewMode) {
        const qid = `${moduleNumber}_${index}_rearrange`;
        const type = isRevisionModeFromUrl ? 'revision' : 'curriculum';
        awardWrong(String(moduleNumber), qid, -3, { isRetry: false, type });
        addToSession(qid);
        try {
          if (user?._id) {
            authService.updateProgress({ userId: user._id, moduleId: String(moduleNumber), subject: user?.subject || 'Science', lessonTitle: item?.title || `Module ${moduleNumber}`, isCorrect: false, deltaScore: -3 });
          }
        } catch (_) {}
      }
      const questionId = `${moduleNumber}_${index}_rearrange`;
      if (!actualReviewMode) {
        addToReview({ questionId, moduleNumber, index, type: 'rearrange' });
      } else {
        requeueActive();
      }
      try {
        if (user?._id) {
          const reviewSvc = (await import('../../../services/reviewService.js')).default;
          reviewSvc.saveIncorrect({ userId: user._id, questionId, moduleId: String(moduleNumber) });
        }
      } catch (_) {}
    }

    // Show feedback modal
    setFeedback({
      open: true,
      correct: correct,
      expected: String(correctAnswer || '')
    });
  };

  async function handleNext(force = false) {
    console.log('[REARRANGE] handleNext called', { force, hasAnsweredCorrectly, isCorrect });
    if (!force && !hasAnsweredCorrectly && !isCorrect) {
      return;
    }

    if (actualReviewMode) {
      if (force) {
        // After requeueActive(), cursor is already at 0, so get the next item
        // Wait a tick for context to update, then navigate directly to next question
        setTimeout(() => {
          // Get the next active item after requeue
          const nextItem = queue && queue.length > 0 ? queue[0] : null;
          if (nextItem && nextItem.moduleNumber && nextItem.index != null) {
            const { moduleNumber: mod, index: idx, type, _source } = nextItem;
            const modeParam = _source === 'default' ? 'revision=true' : 'review=true';
            const modStr = String(mod);
            const idxStr = String(idx);
            let url = '';
            switch (type) {
              case 'multiple-choice': url = `/learn/module/${modStr}/mcq/${idxStr}?${modeParam}`; break;
              case 'fill-in-the-blank': url = `/learn/module/${modStr}/fillups/${idxStr}?${modeParam}`; break;
              case 'rearrange': url = `/learn/module/${modStr}/rearrange/${idxStr}?${modeParam}`; break;
              case 'statement':
              case 'concept': url = `/learn/module/${modStr}/concept/${idxStr}?${modeParam}`; break;
              default: url = '/review-round'; break;
            }
            if (url) navigate(url);
          } else {
            navigate('/review-round');
          }
        }, 0);
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
    const persistent = new URLSearchParams();
    ['title', 'chapterId', 'unitId', 'review', 'revision'].forEach((key) => {
      const value = params.get(key);
      if (value !== null && value !== '') {
        persistent.set(key, value);
      }
    });
    const suffix = persistent.toString() ? `?${persistent.toString()}` : '';
    
    if (nextIndex >= items.length || isMissionCompleteItem(items[nextIndex])) {
      // Declare variables outside try block so they're accessible throughout the function
      let chapterIdForStorage = chapterIdParam || null;
      let unitIdForStorage = unitIdParam || null;
      
      // Count only when module completes
      try { 
        if (user?._id) authService.updateProgress({ userId: user._id, moduleId: String(moduleNumber), subject: user.subject || 'Science', conceptCompleted: true }); 
      } catch (_) {}
      // Update local caches so dashboard updates without refresh
      try {
        // Get chapterId from module to make completion chapter-specific
        try {
          const urlParams = new URLSearchParams(window.location.search);
          chapterIdForStorage = chapterIdForStorage || urlParams.get('chapterId');
          unitIdForStorage = unitIdForStorage || urlParams.get('unitId');
          
          if (!chapterIdForStorage || !unitIdForStorage) {
            const chapters = await curriculumService.listChapters(user?.board || 'CBSE', user?.subject || 'Science');
            for (const ch of (chapters?.data || [])) {
              const modules = await curriculumService.listModules(ch._id);
              const found = (modules?.data || []).find(m => m._id === moduleNumber);
              if (found) {
                chapterIdForStorage = ch._id;
                unitIdForStorage = unitIdForStorage || found.unitId || null;
                break;
              }
            }
          }
        } catch (e) {
          console.warn('[Rearrange] Could not fetch chapterId:', e);
        }
        
        const zeroIdx = Number(moduleNumber) - 1;
        markCompletedLocal(zeroIdx);
        recordCompletedId(moduleNumber);
        
        // Store in chapter-specific keys for dashboard compatibility
        try {
          const subject = user?.subject || 'Science';
          const userScopedKey = (base) => `${base}__${user?._id || 'anon'}__${subject}`;
          const chapterScopedKey = (base, chId) => chId ? `${base}__${user?._id || 'anon'}__${subject}__${chId}` : userScopedKey(base);
          
          if (chapterIdForStorage) {
            const chapterLS_KEY = chapterScopedKey('lesson_progress_v1', chapterIdForStorage);
            const userRaw = localStorage.getItem(chapterLS_KEY);
            const userStore = userRaw ? JSON.parse(userRaw) : {};
            const chapterKey = `chapter_${chapterIdForStorage}`;
            const userSet = new Set(userStore[chapterKey] || []);
            userSet.add(zeroIdx);
            userStore[chapterKey] = Array.from(userSet);
            localStorage.setItem(chapterLS_KEY, JSON.stringify(userStore));
          }
          
          const userLS_KEY = userScopedKey('lesson_progress_v1');
          const userRaw = localStorage.getItem(userLS_KEY);
          const userStore = userRaw ? JSON.parse(userRaw) : {};
          const userSet = new Set(userStore['default'] || []);
          userSet.add(zeroIdx);
          userStore['default'] = Array.from(userSet);
          localStorage.setItem(userLS_KEY, JSON.stringify(userStore));
          
          const userIDS_KEY = userScopedKey('lesson_completed_ids_v1');
          const userIdsRaw = localStorage.getItem(userIDS_KEY);
          const userIdsArr = userIdsRaw ? JSON.parse(userIdsRaw) : [];
          const userIdsSet = new Set(userIdsArr);
          userIdsSet.add(String(moduleNumber));
          localStorage.setItem(userIDS_KEY, JSON.stringify(Array.from(userIdsSet)));
        } catch (_) {}
      } catch (_) {}
      if (chapterIdForStorage && unitIdForStorage) {
        try {
          const map = JSON.parse(localStorage.getItem('last_unit_by_chapter') || '{}');
          map[chapterIdForStorage] = unitIdForStorage;
          localStorage.setItem('last_unit_by_chapter', JSON.stringify(map));
        } catch (_) {}
      }
      const completionParams = new URLSearchParams();
      completionParams.set('moduleId', String(moduleNumber));
      completionParams.set('chapter', String(moduleNumber));
      if (chapterIdForStorage) completionParams.set('chapterId', chapterIdForStorage);
      if (unitIdForStorage) completionParams.set('unitId', unitIdForStorage);
      clearSession();
      return navigate(`/lesson-complete?${completionParams.toString()}`);
    }

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
  }

  const handleMasterSkip = async () => {
    if (actualReviewMode) {
      removeActive();
      navigate('/review-round');
      return;
    }
    const qid = `${moduleNumber}_${index}_rearrange`;
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

  const handleFeedbackClose = () => {
    setFeedback({ open: false, correct: false, expected: '' });
  };

  const handleFeedbackNext = () => {
    setFeedback({ open: false, correct: false, expected: '' });
    handleNext();
  };

  const handleTryAgain = () => {
    setShowResult(false);
    setIsCorrect(false);
    setHasAnsweredCorrectly(false);
    // Keep arrangedWords in the answer field so user can adjust them
  };

  const handleTryAgainClose = () => {
    setShowTryAgainModal(false);
    setShowIncorrectModal(false);
  };

  const handleModalTryAgain = () => {
    setShowIncorrectModal(false);
    setShowResult(false);
    setIsCorrect(false);
    setHasAnsweredCorrectly(false);
    // Return arranged words to available and reshuffle
    setAvailableWords(prev => [...prev, ...arrangedWords].sort(() => Math.random() - 0.5));
    setArrangedWords([]);
  };

  // Flagging removed with revision context

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
  // Check type: In revision mode, use revisionItem.type; in normal mode, use item.type
  let actualType = String(item?.type || '');
  if (isRevisionModeFromUrl && revisionItem?.type) {
    // In revision mode, use revision data type (preserved exactly)
    actualType = String(revisionItem.type || '');
  }
  
  // Only display if it's actually a rearrange type
  if (actualType !== 'rearrange') {
    return <div className="p-6">No rearrange at this step.</div>;
  }

  // Gate lesson content behind intro video acknowledgement when present
  const hasStartVideo = index === 0 && forcedIntroByModule[String(moduleNumber)] && introVideoUrl;
  const hasEndVideo = showEndVideo && introVideoUrl;
  const hasMidLessonVideo = midLessonVideos[midLessonKey] && introVideoUrl;
  const shouldShowVideo = (hasStartVideo || hasEndVideo || hasMidLessonVideo) && !videoAcknowledged;
  
  if (shouldShowVideo) {
    return (
        <div 
          style={{ 
            backgroundImage: 'url("https://res.cloudinary.com/imq5966f/image/upload/v1791543814/img-to-link/lapihposkebjatdeljev.webp")',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}
          className="h-screen flex flex-col overflow-hidden"
        >
        <div className="flex items-center justify-between p-2 sm:p-3 md:p-4 flex-shrink-0">
          {!actualReviewMode && (
            <button
              onClick={() => setShowExitConfirm(true)}
              className="w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-sm sm:text-base"
            >
              ✕
            </button>
          )}
          {actualReviewMode && <div className="w-6 h-6 sm:w-8 sm:h-8"></div>}
          <div className="flex-1 mx-1 sm:mx-2 md:mx-4">
            {actualReviewMode ? (
              <ProgressBar currentIndex={initialQueueCount - queue.length} total={Math.max(1, initialQueueCount)} />
            ) : (
              <ProgressBar currentIndex={index} total={items?.filter(it => !isMissionCompleteItem(it)).length || items.length} />
            )}
          </div>
          <StarCounter />
        </div>

        <div className="flex-1 flex flex-col items-center px-2 sm:px-4 md:px-6 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 80px)' }}>
          <div className="w-full max-w-3xl sm:max-w-4xl mt-4 sm:mt-6 md:mt-8">
            <div className="flex flex-col items-center justify-center w-full">
              <div 
                className="relative overflow-hidden border-2 border-blue-50 shadow-md bg-black rounded-xl sm:rounded-2xl w-full aspect-video"
                style={{ maxWidth: 'max(320px, calc((100vh - 250px) * 16 / 9))', width: '100%' }}
              >
                <iframe
                  src={introVideoUrl}
                  title="Lesson intro video"
                  className="absolute inset-0 w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen={false}
                />
              </div>
            </div>
            <div className="mt-4 sm:mt-5 md:mt-6 flex flex-col items-center gap-2">
              <button
                onClick={() => setVideoAcknowledged(true)}
                className="px-5 py-3 sm:px-6 sm:py-3.5 rounded-lg sm:rounded-xl text-white font-semibold text-base sm:text-lg shadow-md transition-colors bg-blue-600 hover:bg-blue-700"
              >
                Start lesson
              </button>
            </div>
          </div>
        </div>

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
      </div>
    );
  }

  return (
    <div className="fixed inset-0 select-none overflow-hidden">
      <PlayfulBackground isHotZone={false} cardIndex={index}>
      {/* Unified Lesson Header */}
      <LessonHeader
        onBack={handleBack}
        title={actualReviewMode ? 'REVISE PROGRESS' : 'PRACTICE'}
        currentIndex={actualReviewMode ? (initialQueueCount - queue.length) : index}
        total={actualReviewMode ? Math.max(1, initialQueueCount) : (items?.filter(it => !isMissionCompleteItem(it)).length || items.length)}
        stageInfo={stageInfo}
        theme="light"
        onSkip={handleMasterSkip}
      />

      {/* Main Content Area - Top Aligned */}
      <div className={`flex-1 flex flex-col items-center justify-start px-3 sm:px-4 md:px-6 w-full max-w-lg ${(showResult && !isCorrect && (explanationContent || onWrongContent)) ? 'lg:max-w-6xl' : 'lg:max-w-4xl lgshort:max-w-6xl'} mx-auto overflow-y-auto pb-4`}>
        {/* ── CARD CONTAINER ── */}
        <div className="w-full bg-white rounded-[28px] sm:rounded-[32px] border-2 border-[#D1FADF] shadow-[0_8px_30px_rgba(0,0,0,0.08)] p-5 sm:p-7 lg:p-7 lgshort:p-5 flex flex-col mt-1 sm:mt-2 lg:mt-4 lgshort:mt-1 animate-fade-in relative">
          
          {/* Top Bar: Warm up badge + Counter (NO CARD ICON, NO SKIP/EDIT CARD) */}
          <div className="flex items-center justify-between mb-4">
            <div className="px-3.5 py-1.5 rounded-full bg-[#E6F9F0] text-[#027A48] font-black text-xs sm:text-sm tracking-wide shadow-xs">
              {item.badge && item.badge !== 'Warm up' ? item.badge : 'Rearrange'}
            </div>
            <div className="flex items-center gap-2.5">
              <div className="text-slate-500 font-extrabold text-sm sm:text-base">
                {questionNumberDisplay}
              </div>
              <ReportFlagButton
                itemId={item?.itemId || item?._id || `rearrange-${index}`}
                moduleId={moduleNumber}
                chapterId={chapterIdParam}
                questionText={item?.question || item?.text}
                screenName={`Rearrange Q${index + 1}`}
              />
            </div>
          </div>

          {/* Question Header & Speaker Icon */}
          {(() => {
            const rawSentence = item?.text || item?.question || 'Food is broken down in a long tube called the ________ canal.';
            const hasBlank = rawSentence.includes('____') || rawSentence.includes('[blank]');
            const questionTitle = item.label || item.questionTitle || (hasBlank ? 'Fill in the missing word:' : (item.question || 'Put in the correct order:'));

            return (
              <div className="flex items-center justify-between mb-2">
                <h3 
                  style={{ fontFamily: "var(--f-display, 'Fredoka', sans-serif)" }}
                  className="font-extrabold text-[#101F33] text-base sm:text-xl lg:text-[26px] lgshort:text-[22px] tracking-tight leading-snug"
                >
                  {questionTitle}
                </h3>

                <button
                  type="button"
                  onClick={playPromptAudio}
                  aria-label="Listen"
                  className="p-1.5 text-[#1E293B] hover:text-[#1E74FD] active:scale-90 transition-transform -mr-1 cursor-pointer focus:outline-hidden"
                >
                  <svg className="w-7 h-7 sm:w-8 sm:h-8 fill-current" viewBox="0 0 24 24">
                    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                  </svg>
                </button>
              </div>
            );
          })()}

          {/* Desktop: answer and tiles on the left and, after a wrong answer, feedback on the right.
              Below lg these wrappers are display:contents, so the phone layout is unchanged. */}
          <div className={(showResult && !isCorrect && (explanationContent || onWrongContent)) ? 'contents lg:grid lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:gap-6 lg:items-start' : 'contents'}>
          <div className="contents lg:block">
          {/* Sentence with Blank & Answer Field */}
          {(() => {
            const rawSentence = item?.text || item?.question || 'Food is broken down in a long tube called the ________ canal.';
            const hasBlank = rawSentence.includes('____') || rawSentence.includes('[blank]');
            const assembledWord = isTypeMode 
              ? typedText 
              : arrangedWords.join(availableWords.some(w => w.length > 5) ? ' ' : '');

            if (!hasBlank) {
              return (
                <div className="my-1">
                  {/* Answer Field Drop Zone */}
                  {!isTypeMode && (
                    <div className="w-full my-2">
                      <div className="flex items-center justify-between mb-1.5 px-0.5">
                        <span className="text-xs font-bold text-[#64748B] tracking-wide uppercase">
                          Your Answer Field ({arrangedWords.length}/{arrangedWords.length + availableWords.length})
                        </span>
                        {arrangedWords.length > 0 && !isCorrect && (
                          <button
                            type="button"
                            onClick={handleClearAll}
                            className="text-xs font-black text-[#1E74FD] hover:text-[#0B57D0] cursor-pointer active:scale-95 transition-transform"
                          >
                            Clear all
                          </button>
                        )}
                      </div>

                      <div 
                        className={`w-full min-h-[76px] sm:min-h-[86px] lg:min-h-[84px] lgshort:min-h-[64px] p-3 lg:p-3.5 lgshort:p-2.5 rounded-[22px] border-2 transition-all flex flex-wrap items-center gap-2 sm:gap-2.5 lg:gap-3 ${
                          showResult && !isCorrect
                            ? 'border-red-400 bg-red-50/50 shadow-inner ring-2 ring-red-200 animate-shake'
                            : showResult && isCorrect
                            ? 'border-emerald-400 bg-emerald-50/50 shadow-inner ring-2 ring-emerald-200'
                            : arrangedWords.length > 0
                            ? 'border-[#1E74FD]/40 bg-[#F4F8FF]'
                            : 'border-dashed border-[#CBDCEE] bg-[#F8FAFC]'
                        }`}
                      >
                        {arrangedWords.length === 0 ? (
                          <div className="w-full flex items-center justify-center py-3 text-slate-400 font-bold text-sm sm:text-base select-none">
                            <span>Tap the boxes below in order</span>
                          </div>
                        ) : (
                          arrangedWords.map((word, idx) => (
                            <div
                              key={`arranged-${word}-${idx}`}
                              className="group relative inline-flex items-center rounded-[16px] bg-white border-2 border-[#1E74FD] shadow-xs hover:shadow-md transition-all select-none"
                            >
                              {/* Left nudge button (only if not first) */}
                              {idx > 0 && !isCorrect && (
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); handleMoveWord(idx, -1); }}
                                  title="Move left"
                                  className="px-1.5 py-2 text-slate-400 hover:text-[#1E74FD] hover:bg-blue-50 rounded-l-[14px] text-xs font-black transition-colors"
                                >
                                  ‹
                                </button>
                              )}

                              {/* Word content with tap to remove */}
                              <button
                                type="button"
                                onClick={() => handleWordClick(word, 'arranged', idx)}
                                title="Tap to remove and return below"
                                className="px-3 py-2 sm:px-3.5 sm:py-2.5 lgshort:py-1.5 flex items-center gap-1.5 cursor-pointer"
                              >
                                <span className="font-black text-[#101F33] text-base sm:text-lg lgshort:text-base">
                                  {word}
                                </span>
                                <span className="w-4 h-4 rounded-full bg-slate-100 group-hover:bg-red-500 text-slate-400 group-hover:text-white flex items-center justify-center text-[10px] font-black transition-colors">
                                  ✕
                                </span>
                              </button>

                              {/* Right nudge button (only if not last) */}
                              {idx < arrangedWords.length - 1 && !isCorrect && (
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); handleMoveWord(idx, 1); }}
                                  title="Move right"
                                  className="px-1.5 py-2 text-slate-400 hover:text-[#1E74FD] hover:bg-blue-50 rounded-r-[14px] text-xs font-black transition-colors"
                                >
                                  ›
                                </button>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            }

            const parts = rawSentence.split(/_{3,}|\[blank\]/);
            return (
              <div 
                style={{ fontFamily: "var(--f-display, 'Fredoka', sans-serif)" }}
                className="text-lg sm:text-xl md:text-2xl lg:text-[26px] font-black text-[#101F33] my-3 lg:my-4 leading-relaxed tracking-tight"
              >
                <span>{parts[0]}</span>
                <button
                  type="button"
                  onClick={() => {
                    if (arrangedWords.length > 0) {
                      const lastIdx = arrangedWords.length - 1;
                      handleWordClick(arrangedWords[lastIdx], 'arranged', lastIdx);
                    }
                  }}
                  title={assembledWord ? "Tap to remove last piece" : ""}
                  className={`inline-flex items-center justify-center min-w-[90px] sm:min-w-[120px] px-2.5 py-0.5 mx-1.5 border-b-4 border-[#1E74FD] text-center align-middle transition-all ${
                    assembledWord 
                      ? 'text-[#1E74FD] font-black cursor-pointer bg-blue-50/50 rounded-t-lg' 
                      : 'text-transparent select-none'
                  }`}
                >
                  {assembledWord || '________'}
                </button>
                <span>{parts[1] || ''}</span>
              </div>
            );
          })()}

          {/* Tiles or Type It Input (desktop: hidden once checked; Try again brings them back) */}
          <div className={`w-full my-3 flex flex-col items-center ${showResult ? 'lg:hidden' : ''}`}>
            {isTypeMode ? (
              <div className="w-full max-w-sm flex flex-col items-center gap-2 mb-3 animate-fade-in">
                <input
                  type="text"
                  autoFocus
                  value={typedText}
                  onChange={(e) => setTypedText(e.target.value)}
                  placeholder="Type the missing word..."
                  className="w-full px-4 py-3 rounded-2xl border-2 border-[#1E74FD] text-lg sm:text-xl font-black text-center text-[#101F33] bg-[#F8FAFC] focus:outline-hidden focus:ring-4 focus:ring-blue-100 shadow-inner transition-all"
                />
              </div>
            ) : (
              <div className="w-full flex flex-wrap justify-center gap-2 sm:gap-2.5 lg:gap-3 mb-3 lg:mb-4 lg:mt-2 min-h-[50px]">
                {availableWords.map((word, idx) => (
                  <button
                    key={`available-${word}-${idx}`}
                    type="button"
                    onClick={() => handleWordClick(word, 'available', idx)}
                    className="px-4 py-2.5 sm:px-5 sm:py-3 lg:px-5 lg:py-2.5 lgshort:py-2 rounded-[16px] bg-white border-2 border-[#CBDCEE] hover:border-[#1E74FD] hover:bg-[#F0F7FF] text-[#101F33] font-black text-lg sm:text-xl lg:text-lg lgshort:text-base shadow-xs active:scale-95 transition-all cursor-pointer select-none"
                  >
                    {word}
                  </button>
                ))}
              </div>
            )}

            {/* Type it Toggle Button */}
            <button
              type="button"
              onClick={() => setIsTypeMode(prev => !prev)}
              className="px-5 py-2.5 rounded-[16px] border-2 border-[#CBDCEE] bg-white hover:bg-slate-50 text-[#101F33] font-bold text-sm sm:text-base flex items-center justify-center gap-2 active:scale-95 shadow-xs transition-all mx-auto cursor-pointer"
            >
              <svg className="w-5 h-5 fill-current text-slate-700" viewBox="0 0 24 24">
                <path d="M20 5H4c-1.1 0-1.99.9-1.99 2L2 17c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm-9 3h2v2h-2V8zm0 3h2v2h-2v-2zM8 8h2v2H8V8zm0 3h2v2H8v-2zm-1 2H5v-2h2v2zm0-3H5V8h2v2zm9 7H8v-2h8v2zm0-4h-2v-2h2v2zm0-3h-2V8h2v2zm3 3h-2v-2h2v2zm0-3h-2V8h2v2z"/>
              </svg>
              <span>{isTypeMode ? "🧩 Tap pieces" : "Type it"}</span>
            </button>
          </div>

          </div>

          {/* Explanation cards on incorrect submission (only when present in curriculum/excel data) */}
          {showResult && !isCorrect && (
            <div className="w-full flex flex-col gap-2.5 my-2 lg:mt-0 animate-fade-in">
              {explanationContent && (
                <div className="w-full bg-[#FEECEB] rounded-[22px] sm:rounded-[24px] p-4 sm:p-5 text-left border border-red-200/70 shadow-xs">
                  <div className="flex items-start gap-3">
                    <div className="text-[#8A2C2A] font-black text-2xl leading-none mt-0.5 select-none">✕</div>
                    <div className="flex-1">
                      <h4 
                        style={{ fontFamily: "var(--f-display, 'Fredoka', sans-serif)" }} 
                        className="font-black text-[#8A2C2A] text-lg sm:text-xl leading-tight"
                      >
                        Not quite – here is the right one.
                      </h4>
                      <p className="text-sm sm:text-base font-bold text-[#8A2C2A] leading-relaxed mt-1.5 opacity-90">
                        {explanationContent}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {onWrongContent && (
                <div className="w-full bg-[#EBF5FF] rounded-[22px] sm:rounded-[24px] p-4 sm:p-5 text-left border border-blue-200/70 shadow-xs">
                  <div className="flex items-start gap-3">
                    <div className="text-[#133E68] font-black text-2xl leading-none mt-0.5 select-none">›</div>
                    <div className="flex-1">
                      <h4 
                        style={{ fontFamily: "var(--f-display, 'Fredoka', sans-serif)" }} 
                        className="font-black text-[#133E68] text-lg sm:text-xl leading-tight"
                      >
                        Think of it this way
                      </h4>
                      <p className="text-sm sm:text-base font-bold text-[#1D4A77] leading-relaxed mt-1.5 opacity-90">
                        {onWrongContent}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          </div>

        </div>
      </div>

      {/* Bottom Action Bar: Check button anchored to bottom of screen */}
      {!showResult ? (
        <div className={`w-full max-w-md ${(showResult && !isCorrect && (explanationContent || onWrongContent)) ? 'lg:max-w-6xl' : 'lg:max-w-4xl lgshort:max-w-6xl'} px-4 lg:px-6 py-3 lg:pb-8 flex-shrink-0 bg-transparent flex flex-col gap-2`}>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isTypeMode ? typedText.trim().length === 0 : arrangedWords.length === 0}
            style={{ fontFamily: "var(--f-display, 'Fredoka', sans-serif)" }}
            className={`w-full h-14 sm:h-16 rounded-[22px] font-black text-xl flex items-center justify-center transition-all select-none shadow-lg cursor-pointer ${
              (isTypeMode ? typedText.trim().length === 0 : arrangedWords.length === 0)
                ? 'bg-[#DCE5EF] text-[#8295AA] cursor-not-allowed shadow-none'
                : 'bg-[#FACC15] hover:bg-[#EAB308] border-b-4 border-[#CA8A04] text-slate-950 active:translate-y-[2px] active:scale-[0.99]'
            }`}
          >
            Check
          </button>
        </div>
      ) : !isCorrect ? (
        <div className={`w-full max-w-md ${(showResult && !isCorrect && (explanationContent || onWrongContent)) ? 'lg:max-w-6xl' : 'lg:max-w-4xl lgshort:max-w-6xl'} px-4 lg:px-6 py-3 lg:pb-8 flex-shrink-0 bg-transparent flex items-center gap-2.5 sm:gap-3`}>
          <button
            type="button"
            onClick={handleTryAgain}
            style={{ fontFamily: "var(--f-display, 'Fredoka', sans-serif)" }}
            className="flex-1 h-14 sm:h-15 rounded-[22px] font-black text-lg bg-[#FACC15] hover:bg-[#EAB308] border-b-4 border-[#CA8A04] text-slate-950 shadow-md active:translate-y-[2px] transition-all cursor-pointer flex items-center justify-center gap-1.5"
          >
            <span>🔄</span>
            <span>Try again</span>
          </button>
          <button
            type="button"
            onClick={() => handleNext(true)}
            style={{ fontFamily: "var(--f-display, 'Fredoka', sans-serif)" }}
            className="flex-1 h-14 sm:h-15 rounded-[22px] font-black text-lg bg-slate-100 hover:bg-slate-200 border-2 border-slate-300 text-slate-700 shadow-sm active:translate-y-[2px] transition-all cursor-pointer flex items-center justify-center"
          >
            Continue
          </button>
        </div>
      ) : null}

      {/* Inline feedback bar (only on correct submission, no character images) */}
      {showResult && isCorrect && (
        <div className="fixed left-0 right-0 bottom-0 z-[100] animate-in slide-in-from-bottom duration-300 pb-safe shadow-[0_-10px_40px_rgba(0,0,0,0.2)] bg-[#d7ffb8]">
          <div className="w-full max-w-sm sm:max-w-md md:max-w-2xl mx-auto px-6 py-4 flex flex-col gap-3 relative z-10">
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

      {/* Exit confirmation overlay */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center">
          <div className="w-full max-w-md">
            <ConceptExitConfirm
              progress={Math.round(((index+1)/Math.max(1, items.length))*100)}
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
              onClose={() => setShowExitConfirm(false)}
            />
          </div>
        </div>
      )}
      <NoSkipsModal isOpen={showNoSkipsModal} onClose={() => setShowNoSkipsModal(false)} />
      </PlayfulBackground>
    </div>
  );
}
