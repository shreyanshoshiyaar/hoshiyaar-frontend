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
import { useNavigate, useParams } from 'react-router-dom';
import { useModuleItems } from '../../../hooks/useModuleItems';
import ConceptExitConfirm from '../../modals/ConceptExitConfirm.jsx';
import correctSfx from '../../../assets/sounds/correct-choice-43861.mp3';
import errorSfx from '../../../assets/sounds/error-010-206498.mp3';

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
  const { awardCorrect, awardWrong } = useStars();
  const [feedback, setFeedback] = useState({ open: false, correct: false, expected: '' });
  const [userAnswer, setUserAnswer] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [showTryAgainModal, setShowTryAgainModal] = useState(false);
  const [showIncorrectModal, setShowIncorrectModal] = useState(false);
  const [hasAnsweredCorrectly, setHasAnsweredCorrectly] = useState(false);
  const [isFlagged] = useState(false);
  const [showTryAgainOption, setShowTryAgainOption] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  // Track first attempt per question instance; re-attempts award 0
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
          await authService.updateProgress({ userId: user._id, moduleId: String(moduleNumber), subject: user.subject || 'Science', lessonTitle: title, isCorrect: true, deltaScore: 0, resetLesson: true });
        }
      } catch (_) {}
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moduleNumber]);

  // Enter to submit/continue
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'Enter') return;
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


  const normalizeAnswer = (value) => String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ') // drop punctuation/special chars
    .replace(/\s+/g, ' ')
    .trim();

  const handleSubmit = async () => {
    if (showResult || !item || !item.answer) return;
    
    const answer = normalizeAnswer(userAnswer);
    let correct = false;
    
    if (Array.isArray(item.answer)) {
      correct = item.answer.some(ans => normalizeAnswer(ans) === answer);
    } else {
      correct = normalizeAnswer(item.answer) === answer;
    }
    
    setIsCorrect(correct);
    setShowResult(true);
    const isFirstAttempt = !hasAttempted;
    if (!hasAttempted) setHasAttempted(true);

    try { (correct ? correctAudio : errorAudio)?.current?.play?.(); } catch (_) {}

    if (correct) {
      setHasAnsweredCorrectly(true);
      setShowTryAgainOption(false); // Hide try again when correct
      if (isFirstAttempt) {
        const qid = `${moduleNumber}_${index}_fillups`;
        const pts = 5;
        const type = isRevisionModeFromUrl ? 'revision' : 'curriculum';
        if (pts !== 0) awardCorrect(String(moduleNumber), qid, pts, { type });
        try {
          if (user?._id) {
            await pointsService.award({ userId: user._id, questionId: qid, moduleId: String(moduleNumber), type, result: 'correct' });
          }
          await authService.updateProgress({ userId: user._id, moduleId: String(moduleNumber), subject: user.subject || 'Science', lessonTitle: item?.title || `Module ${moduleNumber}`, isCorrect: true, deltaScore: pts });
        } catch (_) {}
      }
      
      if (actualReviewMode) {
        removeActive();
        navigate('/review-round');
      }
    } else {
      // Immediate feedback and enqueue for review
      setShowTryAgainOption(false);
      setShowIncorrectModal(true);
      if (isFirstAttempt && !actualReviewMode) {
        const qid = `${moduleNumber}_${index}_fillups`;
        const type = isRevisionModeFromUrl ? 'revision' : 'curriculum';
        awardWrong(String(moduleNumber), qid, -2, { isRetry: false, type });
        try {
          if (user?._id) {
            await pointsService.award({ userId: user._id, questionId: qid, moduleId: String(moduleNumber), type, result: 'incorrect' });
          }
          await authService.updateProgress({ userId: user._id, moduleId: String(moduleNumber), subject: user.subject || 'Science', lessonTitle: item?.title || `Module ${moduleNumber}`, isCorrect: false, deltaScore: -2 });
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
          await reviewSvc.saveIncorrect({ userId: user._id, questionId, moduleId: String(moduleNumber) });
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
    
    if (nextIndex >= items.length) {
      // Declare variables outside try block so they're accessible throughout the function
      let chapterIdForStorage = chapterIdParam || null;
      let unitIdForStorage = unitIdParam || null;
      
      // Count progress only when module completes
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
      return navigate(`/lesson-complete?${completionParams.toString()}`);
    }
    navigate(`${routeForType(nextItem.type, nextIndex)}${suffix}`);
  }

  // Backward-compat alias in case any stale listeners call goNext
  const goNext = (force = false) => handleNext(force);

  const handleMasterSkip = async () => {
    const qid = `${moduleNumber}_${index}_fillups`;
    const type = isRevisionModeFromUrl ? 'revision' : 'curriculum';
    awardCorrect(String(moduleNumber), qid, 5, { type });
    try {
      if (user?._id) {
        await pointsService.award({ userId: user._id, questionId: qid, moduleId: String(moduleNumber), type, result: 'correct' });
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
    setUserAnswer('');
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
  
  // Only display if it's actually a fill-in-the-blank type
  if (actualType !== 'fill-in-the-blank') {
    return <div className="p-6">No fill-in-the-blank at this step.</div>;
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
          {(user?.role === 'master' || user?.username === 'Host') && (
            <button
              onClick={handleMasterSkip}
              className="px-3 py-1 bg-yellow-500 hover:bg-yellow-600 text-white text-xs font-black rounded-lg shadow-sm border-b-4 border-yellow-700 active:border-b-0 active:translate-y-1 transition-all mr-2 uppercase"
            >
              Skip ⚡️
            </button>
          )}
          <StarCounter />
        </div>
      </div>

      {/* Main Content - optimized for mobile with reduced spacing */}
      <div className="flex-1 flex flex-col items-center px-2 sm:px-3 md:px-6 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 80px)' }}>
        <h2 className="text-xl sm:text-lg md:text-xl lg:text-2xl xl:text-3xl font-extrabold text-gray-900 text-center mt-2 sm:mt-6 md:mt-8 mb-2 sm:mb-3 md:mb-4 text-overflow-fix px-1 sm:px-2">
          {item.question}
        </h2>

        {/* Image block BETWEEN question and input. If no image, reserve space */}
        {(() => {
          const imgs = (item.images || []).filter(Boolean);
          const primary = item.imageUrl ? [item.imageUrl] : [];
          const list = imgs.length > 0 ? imgs : primary;
          if (list.length === 0) {
            return (
              <div className="w-full max-w-xl sm:max-w-2xl md:max-w-3xl h-32 sm:h-40 md:h-60 rounded-2xl sm:rounded-3xl border-2 border-gray-200 bg-gray-50 flex items-center justify-center mb-1 sm:mb-3 md:mb-4">
                <span className="text-gray-400 text-sm sm:text-base">Image</span>
              </div>
            );
          }
          return (
            <div className="w-full max-w-xl sm:max-w-2xl md:max-w-3xl mb-1 sm:mb-3 flex justify-center">
              <div className="flex flex-wrap justify-center gap-1 sm:gap-3 md:gap-5">
                {list.slice(0, 5).map((src, i) => (
                  <div key={i} className="border border-blue-300 rounded-xl sm:rounded-2xl p-1 sm:p-3 bg-white shadow-sm">
                    <img src={src} alt={`fillup-${i}`} className="h-36 w-28 sm:h-28 sm:w-20 md:h-40 md:w-28 lg:h-52 lg:w-40 object-contain rounded-lg sm:rounded-xl" />
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        {/* Text Input for fill-in-the-blank - mobile optimized */}
        <div className="w-full max-w-sm sm:max-w-md md:max-w-2xl lg:max-w-3xl mb-1 sm:mb-3">
            <input
              type="text"
              ref={inputRef}
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              placeholder="Type the full word here..."
              disabled={showResult}
              autoFocus
              className={`w-full p-3 sm:p-3.5 md:p-4 text-lg sm:text-sm md:text-base lg:text-lg border-2 rounded-xl sm:rounded-2xl font-bold transition-all ${
                showResult
                  ? isCorrect
                    ? 'bg-green-100 border-green-500 text-green-800'
                    : 'bg-red-100 border-red-500 text-red-800'
                      : 'bg-white border-gray-300 text-gray-700 focus:border-blue-400 focus:outline-none'
              }`}
            />
          </div>
        
        {/* Bottom padding - mobile only for fixed button */}
        <div className="h-16 sm:h-0 md:h-0"></div>
      </div>

      {/* Continue Button - fixed on mobile, normal on desktop */}
      <div className="fixed sm:relative bottom-0 left-0 right-0 sm:bottom-auto sm:left-auto sm:right-auto bg-white border-t-2 border-blue-300 sm:border-t-0 shadow-lg sm:shadow-none px-2 sm:px-3 md:px-6 py-3 sm:py-4 z-50 sm:z-auto">
        <div className="w-full max-w-sm sm:max-w-md md:max-w-2xl lg:max-w-3xl mx-auto">
          <button
            onClick={() => showResult ? handleNext() : handleSubmit()}
            className="w-full py-3 sm:py-4 md:py-5 rounded-lg sm:rounded-xl bg-blue-600 text-white font-extrabold text-xl sm:text-base md:text-lg hover:bg-blue-700 transition-colors shadow-lg sm:shadow-none"
          >
            {showResult ? 'Continue' : 'Check'}
          </button>
        </div>
      </div>

      {/* Inline Duolingo-style feedback bar - show for both correct and incorrect answers */}
      {showResult && !actualReviewMode && isCorrect && (
        <div className={`fixed left-0 right-0 bottom-0 z-50 border-t-4 shadow-2xl ${
          isCorrect ? 'bg-green-50 border-green-400' : 'bg-red-50 border-red-400'
        }`}>
          <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className={`text-xl font-extrabold ${
              isCorrect ? 'text-green-700' : 'text-red-700'
            }`}>
              {isCorrect ? 'Great job!' : 'Not quite right. Try again!'}
            </div>
            <div className="flex gap-3">
              {/* Show Try Again button ONLY for incorrect answers */}
              {!isCorrect && (
                <button
                  onClick={() => {
                    console.log('[Fillups DEBUG] Try Again button clicked');
                    handleTryAgain();
                  }}
                  className="px-6 py-3 rounded-2xl text-white font-extrabold text-lg bg-orange-600 hover:bg-orange-700 transition-colors"
                >
                  Try Again
                </button>
              )}
              {/* Show Continue button ONLY for correct answers */}
              {isCorrect && !showIncorrectModal && (
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
        incorrectText={userAnswer}
        correctAnswer={Array.isArray(item?.answer) ? item?.answer[0] : item?.answer}
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


