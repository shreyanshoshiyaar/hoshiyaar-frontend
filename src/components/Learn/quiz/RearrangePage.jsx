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
import { useModuleItems } from '../../../hooks/useModuleItems';
import ConceptExitConfirm from '../../modals/ConceptExitConfirm.jsx';
// Audio imports
import correctSound from '../../../assets/sounds/correct-choice-43861.mp3';
import wrongSound from '../../../assets/sounds/error-010-206498.mp3';



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
  const { add: addToReview, removeActive, requeueActive, undoActive, stageIncorrect, clearStagedForModule, active: activeReviewItem, queue } = useReview();
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
        words: Array.isArray(revisionItem.words) ? revisionItem.words : (curriculumItem?.words || []),
        answer: revisionItem.answer || curriculumItem?.answer || '',
        images: Array.isArray(revisionItem.images) ? revisionItem.images : (curriculumItem?.images || [])
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
  // First-attempt guard per question instance
  const [hasAttempted, setHasAttempted] = useState(false);
  const [videoAcknowledged, setVideoAcknowledged] = useState(false);
  const [showEndVideo, setShowEndVideo] = useState(false);

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
    // Prefer explicit words from item
    let words = Array.isArray(item.words) ? item.words.filter(Boolean) : [];
    if (!words || words.length === 0) {
      // Derive from the correct answer string
      const correctAnswer = Array.isArray(item?.answer) ? String(item.answer[0] || '') : String(item?.answer || '');
      const derived = correctAnswer.split(/\s+/).filter(Boolean);
      // Add a few neutral extras to make the game playable
      const extrasPool = ['the','a','is','are','not','and','in','on','with','of'];
      const extras = extrasPool.slice(0, Math.max(2, derived.length));
      words = [...derived, ...extras];
    }
    // Shuffle
    const shuffled = [...words].sort(() => Math.random() - 0.5);
    setAvailableWords(shuffled);
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

  // Enter to submit/continue
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'Enter') return;
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
        navigate('/learn');
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
    if (showResult) return;

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

  const handleSubmit = async () => {
    if (showResult) return;
    // Normalize answers to avoid punctuation/extra-space mismatches
    const normalize = (s) => String(s || '')
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ') // drop punctuation
      .replace(/\s+/g, ' ') // collapse spaces
      .trim();
    const userAnswer = normalize(arrangedWords.join(' '));
    const correctAnswer = Array.isArray(item.answer) ? item.answer[0] : item.answer;
    const correct = normalize(correctAnswer) === userAnswer;
    
    setIsCorrect(correct);
    setShowResult(true);
    const isFirstAttempt = !hasAttempted;
    if (!hasAttempted) setHasAttempted(true);

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
            await authService.updateProgress({ userId: user._id, moduleId: String(moduleNumber), subject: user?.subject || 'Science', lessonTitle: item?.title || `Module ${moduleNumber}`, isCorrect: true, deltaScore: pts });
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
            await authService.updateProgress({ userId: user._id, moduleId: String(moduleNumber), subject: user?.subject || 'Science', lessonTitle: item?.title || `Module ${moduleNumber}`, isCorrect: false, deltaScore: -3 });
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
          await reviewSvc.saveIncorrect({ userId: user._id, questionId, moduleId: String(moduleNumber) });
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
    
    if (nextIndex >= items.length) {
      // Declare variables outside try block so they're accessible throughout the function
      let chapterIdForStorage = chapterIdParam || null;
      let unitIdForStorage = unitIdParam || null;
      
      // Count only when module completes
      try { 
        if (user?._id) await authService.updateProgress({ userId: user._id, moduleId: String(moduleNumber), subject: user.subject || 'Science', conceptCompleted: true }); 
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
    navigate(`${routeForType(nextItem.type, nextIndex)}${suffix}`);
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
        await authService.updateProgress({ userId: user._id, moduleId: String(moduleNumber), subject: user.subject || 'Science', lessonTitle: item?.title || `Module ${moduleNumber}`, isCorrect: true, deltaScore: 3 });
      }
    } catch (_) {}
    handleNext(true);
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
    // Reshuffle and return arranged words to pool
    setAvailableWords(prev => [...prev, ...arrangedWords].sort(() => Math.random() - 0.5));
    setArrangedWords([]);
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
  if (!item) return <SimpleLoading />;
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
            backgroundImage: 'url("https://res.cloudinary.com/dcxlzfyfp/image/upload/v1778244665/img-to-link/lapihposkebjatdeljev.webp")',
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
            <ProgressBar currentIndex={index} total={items.length} />
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
    <div 
      style={{ 
        backgroundImage: 'url("https://res.cloudinary.com/dcxlzfyfp/image/upload/v1778244665/img-to-link/lapihposkebjatdeljev.webp")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
      className="h-screen flex flex-col overflow-hidden md:!bg-none md:!bg-[#ffe7e1]"
    >
      {/* Header - reduced padding for mobile */}
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
            LEARN PROGRESS: {index + 1} / {items.length}
          </span>
          <ProgressBar currentIndex={index} total={items.length} />
        </div>
        <div className="flex items-center gap-1 sm:gap-2 md:gap-3">
          {(user?.role === 'admin' || user?.role === 'master' || user?.username === 'Host' || user?.username === 'hostcbse') && (
            <button
              onClick={handleMasterSkip}
              className="px-3 py-1 bg-yellow-500 hover:bg-yellow-600 text-white text-xs font-black rounded-lg shadow-sm border-b-4 border-yellow-700 active:border-b-0 active:translate-y-1 transition-all mr-2 uppercase"
            >
              Skip ⚡️
            </button>
          )}
          
          {isFlagged && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-50 border border-green-200 text-green-700">
              <span className="text-lg">✅</span>
              <span className="text-sm font-medium">Marked for Review</span>
            </div>
          )}
          
          <StarCounter />
        </div>
      </div>

      {/* Main Content - optimized for mobile with reduced spacing */}
      <div className="flex-1 w-full px-2 sm:px-4 md:px-6 max-w-5xl mx-auto overflow-y-auto md:overflow-y-auto md:justify-start pb-40 sm:pb-32 md:pb-0 mt-2 md:mt-4">
        <div className="mt-2 sm:mt-4 md:mt-4 mb-4 sm:mb-6">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-gray-900 text-center leading-tight">
            {item.question}
          </h2>
        </div>

        <div className="flex flex-col gap-4 sm:gap-6 md:gap-8 items-center">
          <div className="flex flex-col w-full max-w-3xl">
            <div className="relative w-full">
              <div
                className={`w-full h-auto min-h-[120px] sm:min-h-[140px] border-2 border-dashed border-gray-300 rounded-[20px] sm:rounded-2xl p-3 sm:p-4 bg-gray-50 flex flex-wrap gap-2 items-start content-start ${isResetting ? 'transition-opacity opacity-50' : ''}`}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, 'arranged')}
              >
                {arrangedWords.map((word, idx) => (
                  <button
                    key={`arranged-${word}-${idx}`}
                    onClick={() => handleWordClick(word, 'arranged', idx)}
                    draggable
                    onDragStart={(e) => handleDragStart(e, word, 'arranged', idx)}
                    data-index={idx}
                    className={`px-3 py-2 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl border-2 font-semibold transition-all text-sm sm:text-base break-words whitespace-normal max-w-full ${
                      showResult
                        ? isCorrect
                          ? 'bg-green-500 border-green-500 text-white'
                          : 'bg-red-500 border-red-500 text-white'
                        : 'bg-white border-gray-300 text-gray-700 hover:border-blue-400 hover:scale-105 cursor-move'
                    }`}
                    disabled={showResult}
                  >
                    {word}
                  </button>
                ))}
              </div>
              
              {!showResult && (
                <button
                  onClick={handleResetWords}
                  disabled={arrangedWords.length === 0}
                  className={`absolute bottom-3 right-3 w-8 h-8 rounded-full text-white flex items-center justify-center transition-transform ${arrangedWords.length === 0 ? 'bg-gray-400/60 cursor-not-allowed' : 'bg-gray-800/70 hover:scale-105'}`}
                  title="Reset"
                >
                  ↻
                </button>
              )}
            </div>

            {/* Word bank */}
            <div className="flex flex-wrap gap-2 sm:gap-3 mt-4 sm:mt-6 md:mt-8 justify-center w-full">
              {availableWords.length > 0 ? (
                availableWords.map((word, idx) => (
                  <button
                    key={`available-${word}-${idx}`}
                    onClick={() => handleWordClick(word, 'available', idx)}
                    draggable
                    onDragStart={(e) => handleDragStart(e, word, 'available', idx)}
                    disabled={showResult}
                    className={`p-2 sm:p-3 rounded-lg sm:rounded-xl border-2 font-semibold transition-all text-sm sm:text-base break-words whitespace-normal max-w-full ${
                      showResult
                        ? 'bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-white border-gray-300 text-gray-700 hover:border-blue-400 hover:scale-105 cursor-move'
                    }`}
                  >
                    {word}
                  </button>
                ))
              ) : (
                <div className="w-full text-center text-gray-500 py-6">No words available.</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Action Bar - Unified for stability */}
      <div className="fixed sm:relative bottom-0 left-0 right-0 sm:bottom-auto sm:left-auto sm:right-auto bg-white/40 backdrop-blur-sm border-t-2 border-white/20 shadow-lg sm:shadow-none px-2 sm:px-3 md:px-6 py-2 sm:py-3 z-50 sm:z-auto">
        {!showResult ? (
          <div className="w-full max-w-sm sm:max-w-md md:max-w-2xl lg:max-w-3xl mx-auto relative z-10">
            <img 
              src="https://res.cloudinary.com/dcxlzfyfp/image/upload/v1779103894/img-to-link/ro7myyeaahos06av0oel.png" 
              alt="Babaloo" 
              className="hidden md:block absolute bottom-0 right-4 lg:right-8 w-[110px] lg:w-[145px] object-contain -z-10 pointer-events-none" 
            />
            <button
              onClick={handleSubmit}
              disabled={arrangedWords.length === 0}
              className={`w-full py-2.5 sm:py-3 rounded-xl sm:rounded-2xl text-white font-extrabold text-base sm:text-lg transition-colors ${arrangedWords.length === 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
            >
              Check
            </button>
          </div>
        ) : (
          <div className="h-[60px] sm:h-0"></div>
        )}
      </div>

      {/* Inline feedback bar */}
      {showResult && (
        <div className={`fixed left-0 right-0 bottom-0 z-[100] animate-in slide-in-from-bottom duration-300 pb-safe shadow-[0_-10px_40px_rgba(0,0,0,0.2)] ${
          isCorrect ? 'bg-[#d7ffb8]' : 'bg-[#1a2b3c]'
        }`}>
          <div className="w-full max-w-sm sm:max-w-md md:max-w-2xl lg:max-w-3xl mx-auto px-6 py-4 flex flex-col gap-3 relative z-10">
            <img 
              src="https://res.cloudinary.com/dcxlzfyfp/image/upload/v1779103894/img-to-link/ro7myyeaahos06av0oel.png" 
              alt="Babaloo" 
              className="hidden md:block absolute bottom-0 right-4 lg:right-8 w-[110px] lg:w-[145px] object-contain -z-10 pointer-events-none" 
            />
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-inner ${
                isCorrect ? 'bg-white text-[#58a700]' : 'bg-[#ff4b4b] text-white'
              }`}>
                <span className="text-xl">{isCorrect ? '✓' : '✕'}</span>
              </div>
              <div className="flex flex-col">
                <p className={`text-[18px] font-black tracking-tight leading-tight ${
                  isCorrect ? 'text-[#58a700]' : 'text-[#ff4b4b]'
                }`}>
                  {isCorrect ? 'You are correct!' : 'Correct solution:'}
                </p>
                {!isCorrect && (
                  <p className="text-[15px] font-bold text-white mt-0.5 opacity-90">
                    {Array.isArray(item?.answer) ? item?.answer[0] : item?.answer}
                  </p>
                )}
              </div>
            </div>
            
            <button
              onClick={isCorrect ? handleNext : handleTryAgain}
              className={`w-full py-3 rounded-[16px] text-[16px] font-black tracking-widest shadow-[0_4px_0_rgba(0,0,0,0.2)] transform active:translate-y-1 active:shadow-none transition-all uppercase ${
                isCorrect 
                  ? 'bg-[#58cc02] text-white hover:bg-[#61e002]' 
                  : 'bg-[#ff4b4b] text-white hover:bg-[#ff5f5f]'
              }`}
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
    </div>
  );
}
