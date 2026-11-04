import { isNewStyleStory } from '../../../utils/comicStyleHelper.js';
import { isMissionCompleteItem } from '../../../utils/missionCompleteHelper.js';
import { Haptics } from '@capacitor/haptics';
import ProgressBar from '../../ui/ProgressBar.jsx';
import SimpleLoading from '../../ui/SimpleLoading.jsx';
import TryAgainModal from '../../modals/TryAgainModal.jsx';
import IncorrectAnswerModal from '../../modals/IncorrectAnswerModal.jsx';
import authService from '../../../services/authService.js';
import { useAuth } from '../../../context/AuthContext.jsx';
import { useReview } from '../../../context/ReviewContext.jsx';
import { useStars, StarCounter } from '../../../context/StarsContext.jsx';
import pointsService from '../../../services/pointsService.js';
import curriculumService from '../../../services/curriculumService.js';
// Inline feedback bar instead of modal
import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import QuizFeedbackCards from './QuizFeedbackCards.jsx';
import { useNavigate, useParams } from 'react-router-dom';
import { trackLevelStart } from '../../../utils/analytics.js';
import { getLearningParams } from '../../../utils/analyticsHelpers.js';
import { trackFirstQuestionAnswered } from '../../../utils/analytics.js';
import { useModuleItems } from '../../../hooks/useModuleItems';
import ConceptExitConfirm from '../../modals/ConceptExitConfirm.jsx';
import NoSkipsModal from '../../modals/NoSkipsModal.jsx';
import correctSfx from '../../../assets/sounds/correct-choice-43861.mp3';
import errorSfx from '../../../assets/sounds/error-010-206498.mp3';
import LessonHeader from '../LessonHeader.jsx';
import PlayfulBackground from './PlayfulBackground.jsx';
import { getStageInfoForIndex } from '../../../utils/moduleStages.js';
import ReportFlagButton from '../../common/ReportFlagButton.jsx';
import { vibrateLight, vibrateSuccess, vibrateError } from '../../../utils/vibrationService.js';
import { preloadAudio, playTtsAudio } from '../../../utils/audioPreloadService.js';

export default function FillupsPage({ onQuestionComplete, isReviewMode = false }) {
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
        options: Array.isArray(revisionItem.options) ? revisionItem.options : (curriculumItem?.options || []),
        answer: revisionItem.answer || curriculumItem?.answer || '',
        images: Array.isArray(revisionItem.images) ? revisionItem.images : (curriculumItem?.images || []),
        explanation: revisionItem.explanation || curriculumItem?.explanation || '',
        onWrong: revisionItem.onWrong || curriculumItem?.onWrong || '',
        hint: revisionItem.hint || curriculumItem?.hint || ''
      };
    }
    return curriculumItem;
  }, [isRevisionModeFromUrl, revisionItem, curriculumItem]);

  const isHotZone = useMemo(() => {
    const q = String(item?.question || item?.text || '').toLowerCase();
    const ct = String(item?.cardTitle || item?.batchTitle || '').toLowerCase();
    const type = String(item?.type || '').toLowerCase();
    return q.includes('hot zone') || q.includes('hotzone') || ct.includes('hot zone') || type.includes('hotzone');
  }, [item]);

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

  const [eliminatedOptions, setEliminatedOptions] = useState([]);
  const [showTextHint, setShowTextHint] = useState(false);
  const [hintUsed, setHintUsed] = useState(false);

  useEffect(() => {
    setEliminatedOptions([]);
    setShowTextHint(false);
    setHintUsed(false);
  }, [index, moduleNumber]);

  const handleUseHint = () => {
    if (hintUsed || showResult) return;
    setHintUsed(true);

    if (Array.isArray(item?.options) && item.options.length > 2) {
      // Strike off one incorrect option
      const correctAnswer = Array.isArray(item.answer) ? item.answer[0] : item.answer;
      const incorrectIndices = item.options
        .map((opt, idx) => ({ opt, idx }))
        .filter(({ opt }) => String(opt).trim().toLowerCase() !== String(correctAnswer || '').trim().toLowerCase())
        .map(({ idx }) => idx);

      if (incorrectIndices.length > 0) {
        const randomIncorrectIdx = incorrectIndices[Math.floor(Math.random() * incorrectIndices.length)];
        setEliminatedOptions(prev => [...prev, randomIncorrectIdx]);
      }
    } else {
      setShowTextHint(true);
    }
  };

    const playPromptAudio = () => {
    const textToSpeak = item?.targetWord || item?.question || item?.text || '';
    if (!textToSpeak) return;
    playTtsAudio(textToSpeak, item?.speaker || 'Arpit Sir');
  };

  // The question is read aloud only when the student taps the speaker button (no auto-play)

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

  const [feedback, setFeedback] = useState({ open: false, correct: false, expected: '' });
  const [userAnswer, setUserAnswer] = useState('');
  const [isInputFocused, setIsInputFocused] = useState(false);

  // Generate a stable random name for the input to prevent keyboard suggestions
  const inputName = useMemo(() => `field_${Math.random().toString(36).substring(7)}`, [item]);

  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [showTryAgainModal, setShowTryAgainModal] = useState(false);
  const [showIncorrectModal, setShowIncorrectModal] = useState(false);
  const [hasAnsweredCorrectly, setHasAnsweredCorrectly] = useState(false);
  const [showTryAgainOption, setShowTryAgainOption] = useState(false);
  const [isFlagged] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [showNoSkipsModal, setShowNoSkipsModal] = useState(false);
  // Track first attempt per question instance; re-attempts award 0
  const [hasAttempted, setHasAttempted] = useState(false);
  const [videoAcknowledged, setVideoAcknowledged] = useState(false);
  const [showEndVideo, setShowEndVideo] = useState(false);
  const [viewportHeight, setViewportHeight] = useState('100dvh');
  const [skipsLeft, setSkipsLeft] = useState(() => {
    const stored = sessionStorage.getItem(`skips_${moduleNumber}`);
    return stored !== null ? parseInt(stored, 10) : 5;
  });

  useEffect(() => {
    // Lock viewport height to prevent keyboard resize jumps
    const handleResize = () => {
      // Only lock if we are on a mobile-like screen
      if (window.innerWidth < 768) {
        setViewportHeight(`${window.innerHeight}px`);
      } else {
        setViewportHeight('100%');
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);

  return () => window.removeEventListener('resize', handleResize);
  }, []);

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
        question_type: item.type || "fillups"
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

  const correctAudio = useRef(null);
  const errorAudio = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (chapterIdParam && unitIdParam) {
      try {
        const map = JSON.parse(localStorage.getItem('last_unit_by_chapter') || '{}');
        map[chapterIdParam] = unitIdParam;
        localStorage.setItem('last_unit_by_chapter', JSON.stringify(map));
      } catch (_) {}
    }
  }, [chapterIdParam, unitIdParam]);

  useEffect(() => {
    try {
      correctAudio.current = new Audio(correctSfx);
      errorAudio.current = new Audio(errorSfx);
      if (correctAudio.current) correctAudio.current.volume = 1.0; // louder correct
      if (errorAudio.current) errorAudio.current.volume = 0.4; // softer wrong
      correctAudio.current?.load?.();
      errorAudio.current?.load?.();
    } catch (_) {}
  }, []);

  // Reset state when item changes
  useEffect(() => {
    setUserAnswer('');
    setShowResult(false);
    setIsCorrect(false);
    setFeedback({ open: false, correct: false, expected: '' });
    setShowTryAgainModal(false);
    setShowIncorrectModal(false);
    setHasAnsweredCorrectly(false);
    setShowTryAgainOption(false);
    setHasAttempted(false);
    // Focus input on new question
    const id = setTimeout(() => {
      try { if (inputRef.current) inputRef.current.focus(); } catch (_) {}
    }, 0);
    return () => clearTimeout(id);
  }, [item, moduleNumber, index]);

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

  // Reset server-side lesson score at entry so lastScore starts at 0 per run
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

  // Enter to submit/continue
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'Enter' && e.keyCode !== 13) return;
      console.log('[FILLUPS] Enter pressed', { showResult, userAnswer });
      if (!item) return;
      if (!showResult) {
        console.log('[FILLUPS] Submitting via Enter');
        handleSubmit();
      } else {
        console.log('[FILLUPS] Continuing via Enter');
        handleNext();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [item, showResult, userAnswer]);

  // Keep caret in input when result is hidden
  useEffect(() => {
    if (!showResult) {
      try { if (inputRef.current) inputRef.current.focus(); } catch (_) {}
    }
  }, [showResult]);

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

  // Automatic redirect if the current question type does not match fill-in-the-blank
  useEffect(() => {
    if (!loading && item && actualType && actualType !== 'fill-in-the-blank') {
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


  const normalizeAnswer = (value) => String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ') // drop punctuation/special chars
    .replace(/\s+/g, ' ')
    .trim();

  const handleSubmit = async () => {
    if (showResult || !item || !item.answer) return;
    
    // Explicitly blur input to handle mobile keyboard transition smoothly
    if (inputRef.current) inputRef.current.blur();
    
    const answer = normalizeAnswer(userAnswer);
    let correct = false;
    
    const checkPluralS = (a, b) => {
      if (a === b) return true;
      if (a + 's' === b) return true;
      if (b + 's' === a) return true;
      return false;
    };
    
    if (Array.isArray(item.answer)) {
      correct = item.answer.some(ans => checkPluralS(normalizeAnswer(ans), answer));
    } else {
      correct = checkPluralS(normalizeAnswer(item.answer), answer);
    }
    
    setIsCorrect(correct);
    setShowResult(true);
    const isFirstAttempt = !hasAttempted;
    if (!hasAttempted) setHasAttempted(true);

    try { 
      (correct ? correctAudio : errorAudio)?.current?.play?.(); 
      if (correct) {
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
        question_type: item.type || "fillups",
        answer_status: correct ? "correct" : "incorrect",
        score: correct ? 1 : 0,
        time_spent_seconds: timeSpentSeconds
      });
    }

    if (correct) {
      setHasAnsweredCorrectly(true);
      setShowTryAgainOption(false); // Hide try again when correct
      if (isFirstAttempt) {
        const qid = `${moduleNumber}_${index}_fillups`;
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

      // Immediate feedback and enqueue for review
      setShowTryAgainOption(false);
      if (isFirstAttempt && !actualReviewMode) {
        const qid = `${moduleNumber}_${index}_fillups`;
        const type = isRevisionModeFromUrl ? 'revision' : 'curriculum';
        awardWrong(String(moduleNumber), qid, -3, { isRetry: false, type });
        addToSession(qid);
        try {
          if (user?._id) {
            authService.updateProgress({ userId: user._id, moduleId: String(moduleNumber), subject: user?.subject || 'Science', lessonTitle: item?.title || `Module ${moduleNumber}`, isCorrect: false, deltaScore: -3 });
          }
        } catch (_) {}
      }
      const questionId = `${moduleNumber}_${index}_fill-in-the-blank`;
      if (!actualReviewMode) {
        addToReview({ questionId, moduleNumber, index, type: 'fill-in-the-blank' });
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
      expected: Array.isArray(item.answer) ? item.answer[0] : item.answer
    });
  };

  async function handleNext(force = false) {
    console.log('[FILLUPS] handleNext called', { force, hasAnsweredCorrectly, isCorrect });
    // Allow forced advance from incorrect modal
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
      
      // Count progress only when module completes
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
          console.warn('[Fillups] Could not fetch chapterId:', e);
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

  // Backward-compat alias in case any stale listeners call goNext
  const goNext = (force = false) => handleNext(force);

  const handleMasterSkip = async () => {
    if (actualReviewMode) {
      removeActive();
      navigate('/review-round');
      return;
    }
    // Skip to next item in sequence without awarding points or stars
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
    // Local-only reset for demo try-again; no backend or review queue changes
    setShowResult(false);
    setIsCorrect(false);
    setHasAnsweredCorrectly(false);
    setUserAnswer('');
  };

  const handleTryAgainClose = () => {
    setShowTryAgainModal(false);
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
  // Only display if it's actually a fill-in-the-blank type
  if (actualType !== 'fill-in-the-blank') {
    return (
      <div className="fixed inset-0 select-none overflow-hidden">
        <PlayfulBackground isHotZone={false} cardIndex={index}>
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

  // Gate lesson content behind intro video acknowledgement when present
  const hasStartVideo = index === 0 && forcedIntroByModule[String(moduleNumber)] && introVideoUrl;
  const hasEndVideo = showEndVideo && introVideoUrl;
  const hasMidLessonVideo = midLessonVideos[midLessonKey] && introVideoUrl;
  const shouldShowVideo = (hasStartVideo || hasEndVideo || hasMidLessonVideo) && !videoAcknowledged;
  
  if (shouldShowVideo) {
    return (
      <div className="h-screen bg-white flex flex-col overflow-hidden">
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
      <PlayfulBackground isHotZone={isHotZone} cardIndex={index}>
      {/* Unified Lesson Header */}
      <LessonHeader
        onBack={handleBack}
        title={isHotZone ? 'HOT ZONE' : (actualReviewMode ? 'REVISE PROGRESS' : 'PRACTICE')}
        currentIndex={actualReviewMode ? (initialQueueCount - queue.length) : index}
        total={actualReviewMode ? Math.max(1, initialQueueCount) : (items?.filter(it => !isMissionCompleteItem(it)).length || items.length)}
        stageInfo={stageInfo}
        theme={isHotZone ? 'hotzone' : 'light'}
        onSkip={handleMasterSkip}
      />

      {/* Main Content - optimized for mobile with reduced spacing */}
      <div className="flex-1 flex flex-col items-center px-2 sm:px-3 md:px-6 overflow-y-auto md:overflow-y-auto md:justify-start pb-40 sm:pb-32 md:pb-0 mt-2 md:mt-4 lg:mt-10 lgshort:mt-3">
        {/* Type Badge & Counter */}
        <div className="w-full max-w-sm sm:max-w-md md:max-w-xl lg:max-w-3xl flex items-center justify-between px-2 mb-1">
          <span className={`px-3.5 py-1 rounded-full font-black text-xs sm:text-sm tracking-wide ${
            isHotZone 
              ? 'bg-[#FF6B00] text-white shadow-xs' 
              : 'bg-[#E6F8F0] text-[#027A48]'
          }`}>
            {isHotZone ? "Hot zone" : (item?.badge || "Fill Ups")}
          </span>
          <div className="flex items-center gap-2.5">
            <span className="text-slate-500 font-black text-sm sm:text-base">
              {questionNumberDisplay}
            </span>
            <ReportFlagButton
              itemId={item?.itemId || item?._id || `fillups-${index}`}
              moduleId={moduleNumber}
              chapterId={chapterIdParam}
              questionText={item?.question}
              screenName={`Fillups Q${index + 1}`}
            />
          </div>
        </div>

        <div className="w-full max-w-2xl lg:max-w-3xl px-2 mt-2 sm:mt-4 mb-4 sm:mb-6 lg:mb-8 lgshort:mb-4 flex items-center justify-center gap-2 lg:gap-3">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-gray-900 text-center leading-tight">
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

        {/* Image block */}
        {(() => {
          const imgs = (Array.isArray(item.images) ? item.images : (item.images ? [item.images] : [])).filter(Boolean);
          const primary = item.imageUrl ? [item.imageUrl] : [];
          const list = imgs.length > 0 ? imgs : primary;
          if (list.length === 0) {
            return (
              <div className="w-full max-w-xl sm:max-w-2xl md:max-w-3xl h-32 sm:h-40 md:h-60 rounded-2xl sm:rounded-3xl border-2 border-gray-200 bg-gray-50 flex lg:hidden items-center justify-center mb-1 sm:mb-3 md:mb-4">
                <span className="text-gray-400 text-sm sm:text-base">Image</span>
              </div>
            );
          }
          return (
            <div className="w-full max-w-xl sm:max-w-2xl md:max-w-3xl mb-1 sm:mb-3 flex justify-center">
              <div className="flex flex-wrap justify-center gap-1 sm:gap-3 md:gap-5">
                {list.slice(0, 5).map((src, i) => (
                  <div key={i} className="border border-blue-300 rounded-xl sm:rounded-2xl p-1 sm:p-3 bg-white shadow-sm">
                    <img src={src} alt={`fillup-${i}`} className="h-28 w-24 sm:h-32 sm:w-24 md:h-24 md:w-16 lg:h-28 lg:w-24 object-contain rounded-lg sm:rounded-xl shadow-sm" />
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        {/* Text Input for fill-in-the-blank - mobile optimized */}
        <div className="w-full max-w-sm sm:max-w-md md:max-w-2xl lg:max-w-3xl mb-1 sm:mb-3">
          <div
            className={`w-full p-3 sm:p-3.5 md:p-4 text-base sm:text-base md:text-lg lg:text-xl border-2 rounded-xl sm:rounded-2xl font-bold relative min-h-[56px] sm:min-h-[64px] flex items-center ${
              showResult
                ? isCorrect
                  ? 'bg-green-100 border-green-500 text-green-800'
                  : 'bg-red-100 border-red-500 text-red-800'
                    : 'bg-white border-gray-300 text-gray-700 focus-within:border-blue-400'
            }`}
            onClick={() => !showResult && inputRef.current?.focus()}
          >
            <div className="flex items-center overflow-hidden">
              <span className={!userAnswer && !isInputFocused ? 'text-gray-400 font-normal' : ''}>
                {userAnswer || (!isInputFocused ? "Type the full word here..." : "")}
              </span>
              {!showResult && isInputFocused && (
                <span className="w-0.5 h-6 bg-blue-500 ml-0.5 animate-pulse"></span>
              )}
            </div>

            <input
              type="password"
              name={inputName}
              autoComplete="one-time-code"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
              ref={inputRef}
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  if (userAnswer.trim() && !showResult) {
                    handleSubmit();
                  }
                }
              }}
              onFocus={() => setIsInputFocused(true)}
              onBlur={() => setIsInputFocused(false)}
              disabled={showResult}
              autoFocus
              className="absolute inset-0 opacity-0 w-full h-full cursor-default"
              style={{ fontSize: '16px' }}
              data-1p-ignore
              data-lpignore="true"
              data-form-no-save="true"
            />
          </div>
        </div>

        {/* Options list if available (e.g. choice-based fillup) */}
        {Array.isArray(item.options) && item.options.length > 0 && (
          <div className="w-full max-w-sm sm:max-w-md md:max-w-2xl lg:max-w-3xl flex flex-wrap gap-2 lg:gap-3 mb-3 lg:mt-2">
            {item.options.map((opt, oIdx) => {
              const isEliminated = eliminatedOptions.includes(oIdx);
              const isSelected = userAnswer === opt;
              return (
                <button
                  key={oIdx}
                  type="button"
                  disabled={isEliminated || showResult}
                  onClick={() => setUserAnswer(opt)}
                  className={`flex-1 min-w-[120px] py-2.5 lg:py-3.5 px-3 rounded-xl font-bold text-sm sm:text-base lg:text-lg border-2 transition-all cursor-pointer ${
                    isEliminated
                      ? 'line-through opacity-45 pointer-events-none bg-stone-200 text-stone-400 border-stone-300'
                      : isSelected
                        ? 'bg-blue-500 text-white border-blue-600 shadow-md'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-blue-300 shadow-sm'
                  }`}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        )}

        {/* Text-based Hint Box if triggered */}
        {showTextHint && (item.hint || item.onWrong) && (
          <div className="w-full max-w-sm sm:max-w-md lg:max-w-3xl bg-amber-50 border border-amber-300 rounded-2xl p-3 text-amber-900 text-sm font-semibold flex items-center gap-2 mb-3 animate-fadeIn">
            <span className="text-lg">💡</span>
            <span>{item.hint || item.onWrong}</span>
          </div>
        )}

        {/* Hot Zone Use a Hint Button */}
        {isHotZone && !showResult && (
          <div className="w-full max-w-sm sm:max-w-md lg:max-w-3xl mb-3">
            <button
              type="button"
              onClick={handleUseHint}
              disabled={hintUsed}
              className={`w-full py-3 rounded-2xl font-black text-sm tracking-wider uppercase transition-all ${
                hintUsed
                  ? 'bg-stone-700/60 text-stone-400 cursor-not-allowed'
                  : 'bg-[#2A170F] text-amber-100 hover:bg-[#3D2216] border border-[#FF6B00]/40 shadow-md active:scale-95 cursor-pointer'
              }`}
            >
              {hintUsed ? 'Hint Used' : 'Use a hint'}
            </button>
          </div>
        )}

        {/* Universal Feedback Cards (Card 1 & Card 2) when incorrect */}
        <div className="w-full max-w-sm sm:max-w-md lg:max-w-3xl">
          <QuizFeedbackCards item={item} showResult={showResult} isCorrect={isCorrect} />
        </div>

        {/* Bottom in-card Try Again / Continue for incorrect result */}
        {showResult && !isCorrect && (
          <div className="w-full max-w-sm sm:max-w-md lg:max-w-3xl flex items-center gap-3 pt-2 pb-6">
            <button
              type="button"
              onClick={handleTryAgain}
              className="flex-1 h-13 sm:h-14 rounded-2xl font-black text-base bg-[#ff4b4b] hover:bg-[#ff5f5f] text-white shadow-md active:translate-y-[2px] transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              🔄 Try again
            </button>
            <button
              type="button"
              onClick={() => handleNext(true)}
              className="flex-1 h-13 sm:h-14 rounded-2xl font-black text-base bg-slate-100 hover:bg-slate-200 border-2 border-slate-300 text-slate-700 shadow-sm active:translate-y-[2px] transition-all cursor-pointer flex items-center justify-center"
            >
              Continue
            </button>
          </div>
        )}

        {/* Bottom padding - mobile only for fixed button */}
      </div>

      {/* Bottom Action Bar - Unified for stability */}
      {!showResult && (
        <div className="fixed sm:relative bottom-0 left-0 right-0 sm:bottom-auto sm:left-auto sm:right-auto bg-white/80 lg:bg-transparent backdrop-blur-sm lg:backdrop-blur-none border-t border-slate-200 sm:border-t-0 shadow-lg sm:shadow-none px-4 py-3 lg:pb-8 z-50 sm:z-auto lg:w-full">
          <div className="w-full max-w-sm sm:max-w-md lg:max-w-3xl mx-auto relative z-10 flex gap-2">
            <button
              onClick={() => {
                inputRef.current?.blur();
                handleSubmit();
              }}
              className="flex-1 h-14 sm:h-16 rounded-[22px] bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xl transition-all shadow-md active:scale-[0.99] cursor-pointer"
            >
              Check
            </button>
          </div>
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

      {/* Modal disabled per user request */}

      {/* Exit confirmation overlay */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center">
          <div className="w-full max-w-md">
            <ConceptExitConfirm
              progress={Math.round(((index+1)/Math.max(1, items.length))*100)}
              onQuit={() => {
                // Preserve chapterId from URL when navigating back
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


