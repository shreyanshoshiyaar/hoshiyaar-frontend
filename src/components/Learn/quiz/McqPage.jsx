import { isNewStyleStory } from '../../../utils/comicStyleHelper.js';
import { isMissionCompleteItem } from '../../../utils/missionCompleteHelper.js';
import { Haptics } from '@capacitor/haptics';
import ProgressBar from '../../ui/ProgressBar.jsx';
import SimpleLoading from '../../ui/SimpleLoading.jsx';
import TryAgainModal from '../../modals/TryAgainModal.jsx';
import IncorrectAnswerModal from '../../modals/IncorrectAnswerModal.jsx';
import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import QuizFeedbackCards, { hasQuizFeedback } from './QuizFeedbackCards.jsx';
import networkHelper from '../../../utils/apiBase.js';
import NetworkError from '../../ui/NetworkError.jsx';
import { trackLevelStart } from '../../../utils/analytics.js';
import { getLearningParams } from '../../../utils/analyticsHelpers.js';
import { trackFirstQuestionAnswered } from '../../../utils/analytics.js';
import ConceptExitConfirm from '../../modals/ConceptExitConfirm.jsx';
import NoSkipsModal from '../../modals/NoSkipsModal.jsx';
import correctSfx from '../../../assets/sounds/correct-choice-43861.mp3';
import errorSfx from '../../../assets/sounds/error-010-206498.mp3';
import { useNavigate, useParams } from 'react-router-dom';
import { useModuleItems } from '../../../hooks/useModuleItems';
import authService from '../../../services/authService.js';
import { useAuth } from '../../../context/AuthContext.jsx';
import { useReview } from '../../../context/ReviewContext.jsx';
import { useStars, StarCounter } from '../../../context/StarsContext.jsx';
import pointsService from '../../../services/pointsService.js';
import curriculumService from '../../../services/curriculumService.js';
import { progressKey } from '../../../utils/progressKey.js';
import Lottie from 'lottie-react';
import LessonHeader from '../LessonHeader.jsx';
import PlayfulBackground from './PlayfulBackground.jsx';
import { getStageInfoForIndex } from '../../../utils/moduleStages.js';
import ReportFlagButton from '../../common/ReportFlagButton.jsx';
import { vibrateLight, vibrateSuccess, vibrateError } from '../../../utils/vibrationService.js';
import { preloadAudio, playTtsAudio } from '../../../utils/audioPreloadService.js';

export default function McqPage({ onQuestionComplete, isReviewMode = false }) {
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
  
  // Local storage helpers for dashboard progress sync - NOW USING COMPOSITE KEYS
  // Moved after useAuth() to ensure user is available
  const LS_KEY_BASE = 'lesson_progress_v2'; // v2 for composite key support

  useEffect(() => {
    const title = urlParams.get('title') || `Module ${moduleNumber}`;
    trackLevelStart(moduleNumber, title.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase() || `level_${moduleNumber}`);
  }, [moduleNumber]);
  
  // Helper function to get user-scoped key (recalculate each time to ensure user is available)
  const getUserScopedKey = (base) => `${base}__${user?._id || 'anon'}__${user?.subject || 'Science'}`;
  
  // Mark lesson as completed using composite key (chapterId:unitId:lessonId)
  const markCompletedLocal = (chapterId, unitId, lessonId) => {
    try {
      const key = progressKey(chapterId, unitId, lessonId);
      const LS_KEY = getUserScopedKey(LS_KEY_BASE);
      const raw = localStorage.getItem(LS_KEY);
      const store = raw ? JSON.parse(raw) : {};
      const completedSet = new Set(store.completedKeys || []);
      completedSet.add(key);
      store.completedKeys = Array.from(completedSet);
      localStorage.setItem(LS_KEY, JSON.stringify(store));
      console.log('[MCQ] Marked completed with composite key:', key, 'stored in', LS_KEY);
      // Dispatch custom event to notify dashboard of progress update
      try {
        window.dispatchEvent(new CustomEvent('progressUpdated', { detail: { key: LS_KEY } }));
      } catch (_) {}
    } catch (error) {
      console.error('[MCQ] Failed to mark completed locally:', error);
    }
  };
  
  const IDS_KEY_BASE = 'lesson_completed_ids_v1';
  const recordCompletedId = (moduleId) => {
    try {
      const IDS_KEY = getUserScopedKey(IDS_KEY_BASE);
      const raw = localStorage.getItem(IDS_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      const set = new Set(arr);
      if (moduleId) set.add(String(moduleId));
      localStorage.setItem(IDS_KEY, JSON.stringify(Array.from(set)));
    } catch (_) {}
  };
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
  const { stars: totalStars, awardCorrect, awardWrong, addToSession, clearSession } = useStars();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [hoshiAnim, setHoshiAnim] = useState(null);
  const [popAnim, setPopAnim] = useState(null);
  const [bgAnim, setBgAnim] = useState(null);

  useEffect(() => {
    fetch('/lottie/Hoshi2.json').then(res => res.json()).then(data => setHoshiAnim(data)).catch(console.error);
    fetch('/lottie/pop.json').then(res => res.json()).then(data => setPopAnim(data)).catch(console.error);
    fetch('/lottie/Myra-Background.json').then(res => res.json()).then(data => setBgAnim(data)).catch(console.error);
  }, []);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
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
        question_type: item.type || "mcq"
      });
    }
  }, [moduleNumber, index, item, user, chapterIdParam, unitIdParam]);

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
  const [videoAcknowledged, setVideoAcknowledged] = useState(false);
  const [showEndVideo, setShowEndVideo] = useState(false);
  const [showNoSkipsModal, setShowNoSkipsModal] = useState(false);
  const [skipsLeft, setSkipsLeft] = useState(() => {
    const stored = sessionStorage.getItem(`skips_${moduleNumber}`);
    return stored !== null ? parseInt(stored, 10) : 5;
  });

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

  // Auto-navigate to lesson complete after acknowledging end video
  useEffect(() => {
    if (showEndVideo && videoAcknowledged) {
      // Small delay to ensure state is updated, then navigate to lesson complete
      const timer = setTimeout(async () => {
        let chapterIdForStorage = chapterIdParam || null;
        let unitIdForStorage = unitIdParam || null;
        
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
        
        // Get chapterId and unitId if not available
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
                unitIdForStorage = found.unitId || null;
                break;
              }
              if (!found) {
                const units = await curriculumService.listUnits(ch._id);
                for (const unit of (units?.data || [])) {
                  const unitModules = await curriculumService.listModulesByUnit(unit._id);
                  const foundInUnit = (unitModules?.data || []).find(m => m._id === moduleNumber);
                  if (foundInUnit) {
                    chapterIdForStorage = ch._id;
                    unitIdForStorage = unit._id;
                    break;
                  }
                }
                if (chapterIdForStorage && unitIdForStorage) break;
              }
            }
          }
        } catch (e) {
          console.warn('[MCQ] Could not fetch chapterId/unitId:', e);
        }
        
        // Mark completed locally
        if (chapterIdForStorage && moduleNumber) {
          markCompletedLocal(chapterIdForStorage, unitIdForStorage || '', moduleNumber);
        }
        recordCompletedId(moduleNumber);
        
        // Clear session tracking when lesson is completed
        clearSession();
        
        const completionParams = new URLSearchParams();
        completionParams.set('moduleId', String(moduleNumber));
        completionParams.set('chapter', String(moduleNumber));
        if (chapterIdForStorage) completionParams.set('chapterId', chapterIdForStorage);
        if (unitIdForStorage) completionParams.set('unitId', unitIdForStorage);
        navigate(`/lesson-complete?${completionParams.toString()}`);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [showEndVideo, videoAcknowledged, user, moduleNumber, navigate, chapterIdParam, unitIdParam]);

  // Sound effects
  const correctAudio = useRef(null);
  const errorAudio = useRef(null);

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

  // Enter handling on MCQ pages
  // 1) Before an answer is shown (showResult === false), block Enter so it doesn't select anything accidentally
  // 2) After result is shown:
  //    - For incorrect: allow propagation so the incorrect modal can handle Enter (Try Again)
  //    - For correct: map Enter to Continue
  // Enter handling on MCQ pages
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'Enter' && e.keyCode !== 13) return;
      e.preventDefault();
      e.stopPropagation();
      
      if (!showResult) {
        if (selectedIndex !== null) {
          handleSubmit(selectedIndex);
        }
      } else {
        if (isCorrect) {
          handleNext();
        } else {
          handleTryAgain();
        }
      }
    };
    window.addEventListener('keydown', onKey, { capture: true });
    return () => window.removeEventListener('keydown', onKey, { capture: true });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showResult, selectedIndex, isCorrect]);

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

  function handleOptionClick(optionIndex) {
    if (showResult) return;
    vibrateLight();
    setSelectedIndex(optionIndex);
    // Instant validation on option click
    handleSubmit(optionIndex);
  }

  async function handleSubmit(chosenIdx = selectedIndex) {
    if (chosenIdx === null || chosenIdx === undefined || showResult) return;
    setSelectedIndex(chosenIdx);
    
    const isImagesOnlyMCQ = (!item.options || item.options.length === 0) && (Array.isArray(item.images) && item.images.length > 0);
    const selectedOption = isImagesOnlyMCQ ? item.images[chosenIdx] : item?.options?.[chosenIdx];
    const correct = String(selectedOption || '').trim().toLowerCase() === String(item?.answer || '').trim().toLowerCase();
    setIsCorrect(correct);
    setShowResult(true);
    const isFirstAttempt = !hasAttempted;
    if (!hasAttempted) setHasAttempted(true);

    // Play feedback sound & haptic vibration
    try {
      const src = correct ? correctAudio.current : errorAudio.current;
      if (src) {
        src.currentTime = 0;
        const p = src.play();
        if (p && typeof p.catch === 'function') p.catch(() => {});
      }
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
        question_type: item.type || "mcq",
        answer_status: correct ? "correct" : "incorrect",
        score: correct ? 1 : 0,
        time_spent_seconds: timeSpentSeconds
      });
    }

    if (correct) {
      setHasAnsweredCorrectly(true);
      setShowTryAgainOption(false);
      if (isFirstAttempt) {
        const qid = `${moduleNumber}_${index}_mcq`;
        const pts = 3;
        const type = isRevisionModeFromUrl ? 'revision' : 'curriculum';
        awardCorrect(String(moduleNumber), qid, pts, { type });
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
      setShowTryAgainOption(false);
      // Haptic feedback for incorrect answer
      try {
        Haptics.vibrate();
      } catch (_) {}

      if (isFirstAttempt && !actualReviewMode) {
        const qid = `${moduleNumber}_${index}_mcq`;
        const type = isRevisionModeFromUrl ? 'revision' : 'curriculum';
        awardWrong(String(moduleNumber), qid, -3, { isRetry: false, type });
        addToSession(qid);
        try {
          if (user?._id) {
            authService.updateProgress({ userId: user._id, moduleId: String(moduleNumber), subject: user?.subject || 'Science', lessonTitle: item?.title || `Module ${moduleNumber}`, isCorrect: false, deltaScore: -3 });
          }
        } catch (_) {}
      }
      const questionId = `${moduleNumber}_${index}_multiple-choice`;
      if (!actualReviewMode) {
        addToReview({ questionId, moduleNumber, index, type: 'multiple-choice' });
      } else {
        requeueActive();
      }
    }

    setFeedback({
      open: true,
      correct: correct,
      expected: item.answer
    });
  }
  const handleTryAgain = () => {
    setShowResult(false);
    setSelectedIndex(null);
    setIsCorrect(false);
    setHasAnsweredCorrectly(false);
  };
  async function handleNext(force = false) {
    console.log('[MCQ] handleNext called', { force, hasAnsweredCorrectly, isCorrect });
    // Allow forced advance (from incorrect modal). Otherwise require correct.
    if (!force && !hasAnsweredCorrectly && !isCorrect) {
      return;
    }

    // In review mode, on forced advance dispatch completion and return to module
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
      // Check if there's an end-of-lesson video for this module (card 22 case)
      const endVideoKey = `${moduleNumber}:${index}`;
      const endVideo = midLessonVideos[endVideoKey];
      
      console.log('[MCQ] End of lesson check:', {
        moduleNumber,
        index,
        nextIndex,
        itemsLength: items.length,
        endVideoKey,
        endVideo,
        showEndVideo,
        midLessonVideos
      });
      
      if (endVideo && !showEndVideo) {
        // Show video after completing last item, before lesson complete
        console.log('[MCQ] Setting showEndVideo to true');
        // Close any open feedback/modals
        setFeedback({ open: false, correct: false, expected: '' });
        setShowEndVideo(true);
        setVideoAcknowledged(false);
        return;
      }
      
    let chapterIdForStorage = chapterIdParam || null;
    let unitIdForStorage = unitIdParam || null;
      // Finished module: now count progress - Database is primary source
      try {
        if (user?._id) {
          console.log('[MCQ] Saving module completion to database:', moduleNumber);
          const response = authService.updateProgress({ 
            userId: user._id, 
            moduleId: String(moduleNumber), 
            subject: user.subject || 'Science', 
            conceptCompleted: true 
          });
          console.log('[MCQ] Database save response:', response?.data);
        }
      } catch (error) {
        console.error('[MCQ] Failed to save to database:', error);
      }
      
      // Also persist locally so dashboard immediately reflects completion
      try {
        chapterIdForStorage = chapterIdForStorage || chapterIdParam || null;
        unitIdForStorage = unitIdForStorage || unitIdParam || null;
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
                unitIdForStorage = found.unitId || null;
                break;
              }
              if (!found) {
                const units = await curriculumService.listUnits(ch._id);
                for (const unit of (units?.data || [])) {
                  const unitModules = await curriculumService.listModulesByUnit(unit._id);
                  const foundInUnit = (unitModules?.data || []).find(m => m._id === moduleNumber);
                  if (foundInUnit) {
                    chapterIdForStorage = ch._id;
                    unitIdForStorage = unit._id;
                    break;
                  }
                }
                if (chapterIdForStorage && unitIdForStorage) break;
              }
            }
          }
        } catch (e) {
          console.warn('[MCQ] Could not fetch chapterId/unitId:', e);
        }
        
        if (chapterIdForStorage && moduleNumber) {
          markCompletedLocal(chapterIdForStorage, unitIdForStorage || '', moduleNumber);
        }
        recordCompletedId(moduleNumber);
        
        // Clear session tracking when lesson is completed
        clearSession();

        if (chapterIdForStorage && unitIdForStorage) {
          try {
            const map = JSON.parse(localStorage.getItem('last_unit_by_chapter') || '{}');
            map[chapterIdForStorage] = unitIdForStorage;
            localStorage.setItem('last_unit_by_chapter', JSON.stringify(map));
          } catch (_) {}
        }
      } catch (error) {
        console.error('[MCQ] Failed to save progress locally:', error);
      }
      const completionParams = new URLSearchParams();
      completionParams.set('chapter', String(moduleNumber));
      completionParams.set('moduleId', String(moduleNumber));
      if (chapterIdForStorage) completionParams.set('chapterId', chapterIdForStorage);
      if (unitIdForStorage) completionParams.set('unitId', unitIdForStorage);
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
    // If master, award correct silently and move next
    const qid = `${moduleNumber}_${index}_mcq`;
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

  // Flagging removed with revision context

  if (loading) return <SimpleLoading />;
  if (error) return (
    <div className="h-screen w-full flex items-center justify-center bg-white">
      <NetworkError />
    </div>
  );
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
  
  // Only display if it's actually a multiple-choice type
  if (actualType !== 'multiple-choice') {
    return <div className="p-6">No MCQ at this step.</div>;
  }

  // Gate lesson content behind intro video acknowledgement when present
  // For end video, show it when showEndVideo is true and we have a video URL
  const hasStartVideo = index === 0 && forcedIntroByModule[String(moduleNumber)] && introVideoUrl;
  const hasEndVideo = showEndVideo && introVideoUrl;
  const hasMidLessonVideo = midLessonVideos[midLessonKey] && introVideoUrl;
  const shouldShowVideo = (hasStartVideo || hasEndVideo || hasMidLessonVideo) && !videoAcknowledged;
  
  console.log('[MCQ] Video gate check:', {
    moduleNumber,
    index,
    showEndVideo,
    videoAcknowledged,
    introVideoUrl,
    midLessonKey,
    hasEndVideo,
    hasMidLessonVideo,
    hasMidLessonVideoKey: midLessonVideos[midLessonKey],
    shouldShowVideo,
    allVideoKeys: Object.keys(midLessonVideos)
  });
  
  if (shouldShowVideo) {
    return (
      <div className="h-screen bg-white flex flex-col overflow-hidden">
        <LessonHeader
          onBack={handleBack}
          title={actualReviewMode ? 'REVISE PROGRESS' : 'LEARN PROGRESS'}
          currentIndex={actualReviewMode ? (initialQueueCount - queue.length) : index}
          total={actualReviewMode ? Math.max(1, initialQueueCount) : (items?.filter(it => !isMissionCompleteItem(it)).length || items.length)}
          stageInfo={stageInfo}
          theme="light"
        />

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

  // Desktop only: lay options out in two columns when there is an even number of short ones
  // (an odd count or long answers would leave a lone or cramped option)
  const mcqOptions = Array.isArray(item?.options) ? item.options : [];
  const desktopTwoColumns = mcqOptions.length >= 2 && mcqOptions.length % 2 === 0 &&
    mcqOptions.every((opt) => typeof opt === 'string' && opt.length <= 48 && !opt.startsWith('http'));
  // Desktop only (no scrolling): a question picture sits left of the options, with feedback under the
  // options; without a picture, feedback after a wrong answer sits beside the options instead
  const questionImages = (Array.isArray(item?.images) ? item.images : (item?.images ? [item.images] : [])).filter(Boolean);
  if (questionImages.length === 0 && item?.imageUrl) questionImages.push(item.imageUrl);
  const hasQuestionImage = questionImages.length > 0 &&
    !mcqOptions.some((opt) => typeof opt === 'string' && opt.startsWith('http'));
  const desktopSideFeedback = !hasQuestionImage && showResult && !isCorrect && hasQuizFeedback(item);
  const desktopWidth = (hasQuestionImage || desktopSideFeedback) ? 'lg:max-w-6xl' : 'lg:max-w-3xl';

  return (
    <div className="fixed inset-0 select-none overflow-hidden">
      <PlayfulBackground isHotZone={isHotZone} cardIndex={index}>
      {/* Header bar (Unified Lesson Header) */}
      <LessonHeader
        onBack={handleBack}
        title={isHotZone ? 'HOT ZONE' : (actualReviewMode ? 'REVISE PROGRESS' : 'PRACTICE')}
        currentIndex={actualReviewMode ? (initialQueueCount - queue.length) : index}
        total={actualReviewMode ? Math.max(1, initialQueueCount) : (items?.filter(it => !isMissionCompleteItem(it)).length || items.length)}
        stageInfo={stageInfo}
        theme={isHotZone ? 'hotzone' : 'light'}
        onSkip={handleMasterSkip}
      />

      {/* Main Content Area - Top Aligned */}
      <div className={`flex-1 w-full max-w-md ${desktopWidth} px-3 sm:px-4 lg:px-6 py-1 lg:py-4 lgshort:py-2 overflow-y-auto flex flex-col justify-start items-center`}>
        {/* Main Question Card (Matching Screenshot 1 & 4) */}
        <div className={`w-full bg-white rounded-[28px] sm:rounded-[32px] p-5 sm:p-6 lg:p-7 lgshort:p-5 shadow-[0_8px_30px_rgba(0,0,0,0.08)] flex flex-col border-2 mt-1 sm:mt-2 lg:mt-4 lgshort:mt-1 animate-fade-in ${
          isHotZone ? 'border-[#FF6B00] shadow-[0_12px_40px_rgba(255,107,0,0.18)]' : 'border-[#D1FADF]'
        }`}>
          {/* Top badges inside card */}
          <div className="w-full flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className={`px-3.5 py-1 rounded-full font-black text-xs sm:text-sm tracking-wide ${
                isHotZone 
                  ? 'bg-[#FF6B00] text-white shadow-xs' 
                  : 'bg-[#E6F8F0] text-[#027A48]'
              }`}>
                {isHotZone ? "Hot zone" : (item?.badge && item.badge !== "Lock it in" ? item.badge : "MCQ")}
              </span>
            </div>

            <div className="flex items-center gap-2.5">
              <span className="text-slate-500 font-black text-sm sm:text-base">
                {questionNumberDisplay}
              </span>
              <ReportFlagButton
                itemId={item?.itemId || item?._id || `mcq-${index}`}
                moduleId={moduleNumber}
                chapterId={chapterIdParam}
                questionText={item?.question}
                screenName={`MCQ Q${index + 1}`}
              />
            </div>
        </div>

        {/* Question Title + TTS Audio Button */}
        <div className="flex items-start justify-between gap-3 my-3 text-left">
          <h2 
            style={{ fontFamily: "var(--f-display, 'Fredoka', sans-serif)" }}
            className="text-xl sm:text-2xl lg:text-[26px] lgshort:text-[22px] font-black text-[#101F33] tracking-tight leading-snug"
          >
            {item.question}
          </h2>
          <button
            type="button"
            onClick={playPromptAudio}
            title="Listen to question"
            className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 flex items-center justify-center flex-shrink-0 transition-all cursor-pointer shadow-xs"
          >
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
            </svg>
          </button>
        </div>

        {/* Desktop with a picture: picture on the left, options (and feedback) on the right */}
        <div className={hasQuestionImage ? 'contents lg:grid lg:grid-cols-2 lg:gap-7 lg:items-center lg:mt-1' : 'contents'}>
        {/* Question Images if any */}
        {(() => {
          const imgs = (Array.isArray(item.images) ? item.images : (item.images ? [item.images] : [])).filter(Boolean);
          if (imgs.length === 0 && item.imageUrl) imgs.push(item.imageUrl);
          const hasImageOptions = item.options?.some(opt => typeof opt === 'string' && (opt.startsWith('http') || opt.startsWith('https')));
          if (hasImageOptions || imgs.length === 0) return null;

          return (
            <div className="w-full flex justify-center my-2 lg:my-0">
              <img 
                src={imgs[0]} 
                alt="Question visual" 
                className="max-h-40 lg:max-h-[340px] lgshort:max-h-[200px] lg:max-w-full rounded-2xl border-2 border-slate-100 object-contain shadow-xs"
              />
            </div>
          );
        })()}

        <div className={hasQuestionImage ? 'contents lg:block' : 'contents'}>
        {/* Desktop: options on the left and, after a wrong answer, feedback on the right.
            Below lg these wrappers are display:contents, so the phone layout is unchanged. */}
        <div className={desktopSideFeedback ? 'contents lg:grid lg:grid-cols-2 lg:gap-6 lg:items-start lg:mt-2' : 'contents'}>
        <div className="contents lg:block">
        {/* Options List (desktop: two columns when the options are an even number of short answers) */}
        <div className={`flex flex-col gap-2.5 sm:gap-3 w-full my-2 lg:my-3 ${desktopTwoColumns && !desktopSideFeedback ? 'lg:grid lg:grid-cols-2 lg:gap-3.5' : 'lg:gap-3.5'} lgshort:gap-2 lgshort:my-2`}>
          {(item.options || []).map((opt, idx) => {
            const isSelected = selectedIndex === idx;
            const isEliminated = eliminatedOptions.includes(idx);
            const isCorrectOption = String(opt).trim().toLowerCase() === String(item.answer || '').trim().toLowerCase();

            let cardClass = "w-full text-left p-4 lg:px-6 lg:py-3.5 lgshort:py-2 rounded-[20px] font-bold text-base sm:text-lg lg:text-xl lgshort:text-base transition-all shadow-xs cursor-pointer select-none ";

            if (isEliminated) {
              cardClass += "bg-gray-100 border-2 border-gray-200 text-gray-400 line-through opacity-45 pointer-events-none cursor-not-allowed";
            } else if (showResult) {
              if (isSelected) {
                cardClass += isCorrect 
                  ? "bg-green-100 border-2 border-green-500 text-green-900 ring-2 ring-green-200" 
                  : "bg-red-100 border-2 border-red-500 text-red-900 ring-2 ring-red-200";
              } else if (isCorrectOption) {
                cardClass += "bg-green-50 border-2 border-green-400 text-green-800";
              } else {
                cardClass += "bg-gray-50 border-2 border-gray-200 text-gray-400 opacity-60";
              }
            } else {
              if (isSelected) {
                cardClass += "bg-[#F0F7FF] border-2 border-[#1E74FD] text-[#101F33] ring-2 ring-blue-100 shadow-sm";
              } else {
                cardClass += "bg-white border-2 border-[#CBDCEE] hover:border-[#1E74FD] hover:bg-[#F0F7FF] text-[#101F33] active:scale-[0.99]";
              }
            }

            return (
              <button
                key={idx}
                type="button"
                disabled={showResult || isEliminated}
                onClick={() => handleOptionClick(idx)}
                className={cardClass}
              >
                {opt}
              </button>
            );
          })}
        </div>

        {/* Hot Zone Hint Button / Text Hint */}
        {isHotZone && (
          <div className="w-full flex flex-col gap-2 my-1">
            {!showResult && (
              <button
                type="button"
                onClick={handleUseHint}
                disabled={hintUsed || eliminatedOptions.length > 0}
                className={`w-full py-3.5 rounded-[18px] font-bold text-base transition-all select-none cursor-pointer ${
                  hintUsed || eliminatedOptions.length > 0
                    ? 'bg-[#2A0E0A] border border-[#5A1C14] text-slate-500 cursor-not-allowed'
                    : 'bg-[#3B120D] hover:bg-[#4E1812] border border-[#5A1C14] text-[#E0B0A8] active:scale-[0.99]'
                }`}
              >
                {hintUsed || eliminatedOptions.length > 0 ? "Hint used (1 answer struck off)" : "Use a hint"}
              </button>
            )}

            {showTextHint && (
              <div className="w-full p-3.5 rounded-[18px] bg-amber-50 border border-amber-200 text-amber-900 font-bold text-sm text-left animate-fade-in">
                💡 Hint: {item.hint || item.onWrong || "Think carefully about what you learned in this unit!"}
              </div>
            )}
          </div>
        )}

        </div>

        {/* Feedback Cards (strictly only when present in Excel) */}
        <div className="contents lg:block lg:-mt-2">
        <QuizFeedbackCards item={item} showResult={showResult} isCorrect={isCorrect} />
        </div>
        </div>
        </div>
        </div>

        </div>
      </div>

      {/* Bottom Action Bar: Check button removed per user request (tapping option directly shows result) */}
      {!showResult ? (
        isHotZone ? (
          <div className="w-full max-w-md px-4 py-3 flex-shrink-0 bg-transparent flex flex-col gap-2">
            <button
              type="button"
              onClick={handleUseHint}
              disabled={hintUsed || eliminatedOptions.length > 0}
              className={`w-full py-3 rounded-2xl font-black text-sm tracking-wider uppercase transition-all select-none cursor-pointer ${
                hintUsed || eliminatedOptions.length > 0
                  ? 'bg-stone-800 text-stone-500 cursor-not-allowed border border-stone-700'
                  : 'bg-[#2A100B] hover:bg-[#3D1812] border border-[#FF6B00]/40 text-[#FF8A48] shadow-md active:scale-95'
              }`}
            >
              {hintUsed || eliminatedOptions.length > 0 ? "Hint used (1 answer struck off)" : "Use a hint"}
            </button>
          </div>
        ) : null
      ) : !isCorrect ? (
        <div className={`w-full max-w-md ${desktopWidth} px-4 lg:px-6 py-3 flex-shrink-0 bg-transparent flex items-center gap-2.5 sm:gap-3`}>
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

      {/* Modal disabled per user request */}

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


