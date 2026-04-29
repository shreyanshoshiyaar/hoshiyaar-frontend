import ProgressBar from '../../ui/ProgressBar.jsx';
import SimpleLoading from '../../ui/SimpleLoading.jsx';
import TryAgainModal from '../../modals/TryAgainModal.jsx';
import IncorrectAnswerModal from '../../modals/IncorrectAnswerModal.jsx';
import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import ConceptExitConfirm from '../../modals/ConceptExitConfirm.jsx';
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
// Inline feedback bar instead of modal

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
  
  // Local storage helpers for dashboard progress sync - NOW USING COMPOSITE KEYS
  // Moved after useAuth() to ensure user is available
  const LS_KEY_BASE = 'lesson_progress_v2'; // v2 for composite key support
  
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
  const { add: addToReview, removeActive, requeueActive, stageIncorrect, clearStagedForModule, active: activeReviewItem, queue } = useReview();
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
        images: Array.isArray(revisionItem.images) ? revisionItem.images : (curriculumItem?.images || [])
      };
    }
    return curriculumItem;
  }, [isRevisionModeFromUrl, revisionItem, curriculumItem]);
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

  // Auto-navigate to lesson complete after acknowledging end video
  useEffect(() => {
    if (showEndVideo && videoAcknowledged) {
      // Small delay to ensure state is updated, then navigate to lesson complete
      const timer = setTimeout(async () => {
        let chapterIdForStorage = chapterIdParam || null;
        let unitIdForStorage = unitIdParam || null;
        
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
          await authService.updateProgress({ userId: user._id, moduleId: String(moduleNumber), subject: user.subject || 'Science', lessonTitle: title, isCorrect: true, deltaScore: 0, resetLesson: true });
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
      case 'comic':
      case 'concept':
      case 'statement':
        return `/learn/module/${moduleNumber}/concept/${idx}`;
      case 'multiple-choice': return `/learn/module/${moduleNumber}/mcq/${idx}`;
      case 'fill-in-the-blank': return `/learn/module/${moduleNumber}/fillups/${idx}`;
      case 'rearrange': return `/learn/module/${moduleNumber}/rearrange/${idx}`;
      case 'descriptive': return `/learn/module/${moduleNumber}/descriptive/${idx}`;
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
        const pts = 5;
        const type = isRevisionModeFromUrl ? 'revision' : 'curriculum';
        if (pts !== 0) awardCorrect(String(moduleNumber), qid, pts, { type });
        try {
          await authService.updateProgress({ userId: user._id, moduleId: String(moduleNumber), subject: user.subject || 'Science', lessonTitle: item?.title || `Module ${moduleNumber}`, isCorrect: true, deltaScore: pts });
        } catch (_) {}
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
        const type = isRevisionModeFromUrl ? 'revision' : 'curriculum';
        awardWrong(String(moduleNumber), qid, -2, { isRetry: false, type });
        try {
          await authService.updateProgress({ userId: user._id, moduleId: String(moduleNumber), subject: user.subject || 'Science', lessonTitle: item?.title || `Module ${moduleNumber}`, isCorrect: false, deltaScore: -2 });
        } catch (_) {}
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
        setShowTryAgainModal(false);
        setShowIncorrectModal(false);
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
          const response = await authService.updateProgress({ 
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
    navigate(`${routeForType(nextItem.type, nextIndex)}${suffix}`);
  }

  const handleMasterSkip = async () => {
    // If master, award correct silently and move next
    const qid = `${moduleNumber}_${index}_mcq`;
    const type = isRevisionModeFromUrl ? 'revision' : 'curriculum';
    awardCorrect(String(moduleNumber), qid, 5, { type });
    try {
      if (user?._id) {
        await authService.updateProgress({ userId: user._id, moduleId: String(moduleNumber), subject: user.subject || 'Science', lessonTitle: item?.title || `Module ${moduleNumber}`, isCorrect: true, deltaScore: 5 });
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
            <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
              <iframe
                src={introVideoUrl}
                title="Lesson intro video"
                className="absolute inset-0 w-full h-full rounded-xl border border-gray-200 shadow-sm"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen={false}
              />
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
          {/* Master Mode Skip Button */}
          {(user?.role === 'master' || user?.username === 'Host') && (
            <button
              onClick={handleMasterSkip}
              className="px-3 py-1 bg-yellow-500 hover:bg-yellow-600 text-white text-xs font-black rounded-lg shadow-sm border-b-4 border-yellow-700 active:border-b-0 active:translate-y-1 transition-all mr-2 uppercase"
            >
              Skip ⚡️
            </button>
          )}
          
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
              <div className="flex flex-wrap md:flex-nowrap items-center justify-center gap-1 sm:gap-3 md:gap-5">
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
    </div>
  );
}


