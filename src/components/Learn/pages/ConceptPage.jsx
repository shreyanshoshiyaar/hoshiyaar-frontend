import React, { useMemo, useState, useEffect, useCallback } from 'react';
import ProgressBar from '../../ui/ProgressBar.jsx';
import { StarCounter } from '../../../context/StarsContext.jsx';
import SimpleLoading from '../../ui/SimpleLoading.jsx';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useModuleItems } from '../../../hooks/useModuleItems';
import authService from '../../../services/authService.js';
import { useAuth } from '../../../context/AuthContext.jsx';
import { useStars } from '../../../context/StarsContext.jsx';
import { useReview } from '../../../context/ReviewContext.jsx';
import ConceptExitConfirm from '../../modals/ConceptExitConfirm.jsx';
import Lottie from 'lottie-react';
import hoshiMascot from '../../../assets/lottie/Hoshi.json';
import popLottie from '../../../assets/lottie/pop.json';
import backgroundLottie from '../../../assets/lottie/image2lottie-animation.json';

export default function ConceptPage() {
  const navigate = useNavigate();
  const { moduleNumber, index: indexParam } = useParams();
  const index = Number(indexParam || 0);
  const { items, loading, error } = useModuleItems(moduleNumber);
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const isReviewModeFromUrl = searchParams.get('review') === 'true';
  const isRevisionModeFromUrl = searchParams.get('revision') === 'true';
  const chapterIdParam = searchParams.get('chapterId');
  const unitIdParam = searchParams.get('unitId');
  const isInReviewOrRevision = isReviewModeFromUrl || isRevisionModeFromUrl;
  const { removeActive, active: activeReviewItem, queue } = useReview();
  const [videoAcknowledged, setVideoAcknowledged] = useState(false);
  const [showEndVideo, setShowEndVideo] = useState(false);
  const [comicSlideIndex, setComicSlideIndex] = useState(0);
  const { stars: totalStars } = useStars();
  const [isZoomed, setIsZoomed] = useState(false);
  const [comicReadTimer, setComicReadTimer] = useState(0);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Allow temporary override via query param for testing
  const introVideoFromQuery = useMemo(() => {
    const raw = searchParams.get('introVideo') || '';
    return raw && typeof raw === 'string' ? raw : '';
  }, [searchParams]);

  // Lightweight YouTube -> embed converter; other URLs pass through
  const isYouTubeUrl = useCallback((rawUrl) => {
    if (!rawUrl) return '';
    try {
      const url = new URL(rawUrl);
      const host = url.hostname.replace(/^www\./, '');
      if (host === 'youtu.be') return url.pathname.replace('/', '') || '';
      if (host === 'youtube.com' || host === 'm.youtube.com') {
        // Standard watch URLs: ?v=ID
        const vid = url.searchParams.get('v');
        if (vid) return vid;
        // Embed URLs: /embed/ID
        const parts = url.pathname.split('/');
        const embedIdx = parts.indexOf('embed');
        if (embedIdx !== -1 && parts[embedIdx + 1]) {
          return parts[embedIdx + 1];
        }
      }
    } catch (_) {
      // fall through
    }
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
  useEffect(() => {
    if (chapterIdParam && unitIdParam) {
      try {
        const map = JSON.parse(localStorage.getItem('last_unit_by_chapter') || '{}');
        map[chapterIdParam] = unitIdParam;
        localStorage.setItem('last_unit_by_chapter', JSON.stringify(map));
      } catch (_) { }
    }
  }, [chapterIdParam, unitIdParam]);

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
  const item = revisionItem || curriculumItem;
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  // Hardwire intro videos per module when requested
  // Format: { moduleId: videoUrl } for start-of-lesson videos (index 0)
  const forcedIntroByModule = useMemo(() => ({
    // '68e276236d69ef07c1a2e133': 'https://youtu.be/33bEGe44vyE', // Replaced with comic slides
    '68e276b26d69ef07c1a2e167': 'https://youtu.be/mo-oW33Dqu0',
    '68e2771a6d69ef07c1a2e1ab': 'https://youtu.be/ytSYjCqQUj0',
    '68e277716d69ef07c1a2e1d1': 'https://youtu.be/26THnY_3mtY', // Before card 1
    '68e277b86d69ef07c1a2e20f': 'https://youtu.be/CIqRRxP4r7g',
    '68e7cfa9d96c390ca2489fbb': 'https://youtu.be/OYQNzRLDjCo', // Before card 1
    '68e7d53dd96c390ca248a099': 'https://youtu.be/T4-LR0PCGB4', // Before card 1
    '68e7de6bd96c390ca248a0f2': 'https://youtu.be/DbGZ0KSS0ZU', // Before card 1
    '68e7df9bd96c390ca248a12d': 'https://youtu.be/SymhcoFMNaw', // Before card 1
    '68eba905996044d1e5cbefd6': 'https://youtu.be/i59cR7MPD5M', // Before card 1
    '68ebaa6c996044d1e5cbf031': 'https://youtu.be/OoLh_Ck1PTA', // Before card 1
    '68ebb957fc8995cc925650d8': 'https://youtu.be/8kjtyxEIgbg', // Before card 1
    '68ebbaddfc8995cc925650fe': 'https://youtu.be/t41q21zK-iM', // Before card 1
    '68ebbb5ffc8995cc92565152': 'https://youtu.be/fIrQIhIAB4s', // Before card 1
    '68ebbc67fc8995cc925651dd': 'https://youtu.be/9YcQzKUG0vo', // Before card 1
    '68ebc01cfc8995cc92565205': 'https://youtu.be/yh_18cJbBww', // Before card 1
    '68ebc134fc8995cc92565279': 'https://youtu.be/snE3QBO1cDo', // Before card 1
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
  // Videos show BEFORE the specified card, so use index (card - 1)
  // Card 15 (concept) - show at index 14
  // Card 27 - show at index 26 (before card 27)
  // Card 7 - show at index 6 (before card 7)
  // Card 14 - show at index 13 (before card 14)
  const midLessonVideos = useMemo(() => ({
    '68e276236d69ef07c1a2e133:12': 'https://youtu.be/2H3FWuKsahg', // Before card 13
    '68e276b26d69ef07c1a2e167:19': 'https://youtu.be/8uplR1ztb64', // Before card 20
    '68e276b26d69ef07c1a2e167:26': 'https://youtu.be/8uplR1ztb64', // Before card 27 (MCQ)
    '68e2771a6d69ef07c1a2e1ab:5': 'https://youtu.be/kcNefeA1RS8', // Before card 6
    '68e277716d69ef07c1a2e1d1:13': 'https://youtu.be/xDsXRV0MklE', // Before card 14 (concept)
    '68e7cfa9d96c390ca2489fbb:5': 'https://youtu.be/IZx6UiwF7VE', // Before card 6
    '68e7d53dd96c390ca248a099:10': 'https://youtu.be/X2TVQFJZhqk', // Before card 11
    '68e7df9bd96c390ca248a12d:22': 'https://youtu.be/uu94oylVRzA', // Before card 23
    '68eba905996044d1e5cbefd6:15': 'https://youtu.be/m2_hLp0mLkM', // Before card 16
    '68ebb957fc8995cc925650d8:9': 'https://youtu.be/-nbylw4qSbA', // Before card 10
    '68ebbaddfc8995cc925650fe:17': 'https://youtu.be/0zoJVHp0SVQ', // Before card 18
  }), []);

  const introVideoUrl = useMemo(() => {
    // Check for end-of-lesson video (after completing last item)
    if (showEndVideo) {
      const endVideoKey = `${moduleNumber}:${index}`;
      const endVideo = midLessonVideos[endVideoKey] || '';
      if (endVideo) {
        console.log('[ConceptPage] End video found:', { showEndVideo, endVideoKey, endVideo });
        return normalizeVideoUrl(endVideo);
      }
      console.log('[ConceptPage] End video not found:', { showEndVideo, endVideoKey, midLessonVideos });
    }

    // Check for mid-lesson video (specific card/index)
    const midLessonKey = `${moduleNumber}:${index}`;
    const midLessonVideo = midLessonVideos[midLessonKey] || '';

    // Check for start-of-lesson video (index 0)
    const startVideo = index === 0 ? (forcedIntroByModule[String(moduleNumber)] || '') : '';

    // Priority: query param > mid-lesson > start video > item video
    const src = introVideoFromQuery || midLessonVideo || startVideo || item?.introVideoUrl || item?.videoUrl || '';
    return normalizeVideoUrl(src);
  }, [forcedIntroByModule, midLessonVideos, introVideoFromQuery, item, moduleNumber, index, normalizeVideoUrl, showEndVideo]);

  const introComicUrls = useMemo(() => {
    // Try the DB item first:
    const dbType = isRevisionModeFromUrl ? revisionItem?.type : item?.type;
    if (dbType === 'comic') {
      const dbItem = isRevisionModeFromUrl ? revisionItem : item;
      const imgs = (dbItem?.images || []).filter(Boolean);
      if (imgs.length > 0) return imgs;
      if (dbItem?.imageUrl) return [dbItem.imageUrl];
    }
    return null;
  }, [moduleNumber, index, showEndVideo, item, revisionItem, isRevisionModeFromUrl]);

  // Reset gate when starting a new module (index 0) or reaching a card with mid-lesson video
  // Reset comicSlideIndex whenever advancing so new comics start at slide 0
  useEffect(() => {
    setComicSlideIndex(0);
    const midLessonKey = `${moduleNumber}:${index}`;
    if (index === 0 || midLessonVideos[midLessonKey]) {
      setVideoAcknowledged(false);
    }
  }, [moduleNumber, index, midLessonVideos]);

  // Reset showEndVideo when module changes (but keep it when index changes within same module)
  useEffect(() => {
    setShowEndVideo(false);
  }, [moduleNumber]);

  // Auto-navigate to lesson complete after acknowledging end video
  useEffect(() => {
    if (showEndVideo && videoAcknowledged) {
      // Small delay to ensure state is updated, then navigate to lesson complete
      const timer = setTimeout(async () => {
        try {
          if (user?._id) {
            await authService.updateProgress({
              userId: user._id,
              moduleId: String(moduleNumber),
              subject: user.subject || 'Science',
              conceptCompleted: true
            });
          }
        } catch (_) { }
        const completionParams = new URLSearchParams();
        completionParams.set('moduleId', String(moduleNumber));
        completionParams.set('chapter', String(moduleNumber));
        if (chapterIdParam) completionParams.set('chapterId', chapterIdParam);
        if (unitIdParam) completionParams.set('unitId', unitIdParam);
        navigate(`/lesson-complete?${completionParams.toString()}`);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [showEndVideo, videoAcknowledged, user, moduleNumber, navigate, chapterIdParam, unitIdParam]);

  // Show exit confirmation on browser back button in revision/review mode
  useEffect(() => {
    if (!isInReviewOrRevision) return;

    const handlePop = () => {
      // Show confirmation dialog
      setShowExitConfirm(true);
      // Prevent navigation by pushing current state back
      try {
        window.history.pushState(null, '', window.location.href);
      } catch (_) { }
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
    } catch (_) { }

    window.addEventListener('popstate', handlePop);
    window.addEventListener('keydown', handleKey);

    return () => {
      window.removeEventListener('popstate', handlePop);
      window.removeEventListener('keydown', handleKey);
    };
  }, [isInReviewOrRevision]);

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

  const goNext = useCallback(async () => {
    // If in review or revision mode, navigate back to review-round instead of next sequential item
    if (isInReviewOrRevision) {
      removeActive();
      navigate('/review-round');
      return;
    }

    const nextIndex = index + 1;
    if (nextIndex >= items.length) {
      // Check if there's an end-of-lesson video for this module (card 22 case)
      const endVideoKey = `${moduleNumber}:${index}`;
      const endVideo = midLessonVideos[endVideoKey];

      console.log('[ConceptPage] End of lesson check:', {
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
        console.log('[ConceptPage] Setting showEndVideo to true');
        setShowEndVideo(true);
        setVideoAcknowledged(false);
        return;
      }

      // Mark module completed and return
      try {
        if (user?._id) {
          console.log('[ConceptPage] Saving module completion to database:', moduleNumber);
          await authService.updateProgress({
            userId: user._id,
            moduleId: String(moduleNumber),
            subject: user.subject || 'Science', // CRITICAL: Include subject and use moduleId
            conceptCompleted: true
          });
        }
      } catch (_) { }
      const completionParams = new URLSearchParams();
      completionParams.set('moduleId', String(moduleNumber));
      completionParams.set('chapter', String(moduleNumber));
      if (chapterIdParam) completionParams.set('chapterId', chapterIdParam);
      if (unitIdParam) completionParams.set('unitId', unitIdParam);
      return navigate(`/lesson-complete?${completionParams.toString()}`);
    }
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
    navigate(`${routeForType(nextItem.type, nextIndex)}${suffix}`);
  }, [index, items, user, moduleNumber, navigate, isInReviewOrRevision, removeActive, midLessonVideos, showEndVideo, videoAcknowledged, chapterIdParam, unitIdParam]);

  const handleMasterSkip = async () => {
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
    goNext();
  };

  // DERIVED STATE MOVED UP FOR HOOKS
  const actualType = (() => {
    if (isRevisionModeFromUrl && revisionItem?.type) {
      return String(revisionItem.type);
    }
    return String(item?.type || '');
  })();
  const midLessonKey = `${moduleNumber}:${index}`;
  const hasMidLessonVideo = midLessonVideos[midLessonKey];
  const shouldShowVideo = introVideoUrl && !videoAcknowledged && (index === 0 || hasMidLessonVideo || showEndVideo);
  const shouldShowComic = introComicUrls && introComicUrls.length > 0 && (!videoAcknowledged && index === 0 || actualType === 'comic');
  const isComicActive = shouldShowComic || actualType === 'comic';

  // COMIC TIMER EFFECT
  useEffect(() => {
    if (isComicActive) {
      setComicReadTimer(10);
      const interval = setInterval(() => {
        setComicReadTimer(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setComicReadTimer(0);
    }
  }, [isComicActive, comicSlideIndex, index]);

  // Allow advancing with Enter key when the exit confirmation is not visible
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Enter' && !showExitConfirm) {
        event.preventDefault();
        
        if (isComicActive && comicReadTimer > 0) return;

        if (shouldShowComic) {
          if (introComicUrls && comicSlideIndex < introComicUrls.length - 1) {
            setComicSlideIndex(prev => prev + 1);
          } else {
            if (actualType === 'comic') {
              goNext();
            } else {
              setVideoAcknowledged(true);
            }
          }
        } else if (shouldShowVideo && !videoAcknowledged) {
          setVideoAcknowledged(true);
        } else {
          goNext();
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goNext, showExitConfirm, isComicActive, comicReadTimer, shouldShowComic, shouldShowVideo, videoAcknowledged, comicSlideIndex, introComicUrls, actualType]);

  if (loading) return <SimpleLoading />;
  if (error) return <div className="p-6 text-red-600">{error}</div>;
  if (!item) return <SimpleLoading />;

  const isConceptOrStatement = actualType === 'concept' || actualType === 'statement' || actualType === 'comic';
  if (!isConceptOrStatement) {
    return <div className="p-6">No concept at this step.</div>;
  }

  if (showEndVideo || introVideoUrl || shouldShowComic) {
    console.log('[ConceptPage] Media gate check:', {
      moduleNumber,
      index,
      showEndVideo,
      videoAcknowledged,
      introVideoUrl,
      shouldShowComic,
      hasMidLessonVideo,
      midLessonKey,
      shouldShowVideo
    });
  }

  if (shouldShowVideo || shouldShowComic) {
    return (
      <div className="h-screen bg-white flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-2 sm:p-3 md:p-4 flex-shrink-0">
          {!isInReviewOrRevision && (
            <button
              onClick={() => setShowExitConfirm(true)}
              className="w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-sm sm:text-base"
            >
              ✕
            </button>
          )}
          {isInReviewOrRevision && <div className="w-6 h-6 sm:w-8 sm:h-8"></div>}
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

        <div className="flex-1 flex flex-col items-center px-2 sm:px-4 md:px-6 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 80px)' }}>
          <div className="w-full max-w-3xl sm:max-w-4xl mt-4 sm:mt-6 md:mt-8">
            {shouldShowComic ? (
              <div className="relative w-full rounded-xl border border-gray-200 shadow-sm overflow-hidden flex items-center justify-center p-2 bg-gray-50" style={{ minHeight: '60vh' }}>
                <img
                  src={introComicUrls[comicSlideIndex]}
                  alt={`Comic slide ${comicSlideIndex + 1}`}
                  className="max-w-full max-h-[65vh] object-contain cursor-zoom-in"
                  onClick={() => setIsZoomed(true)}
                />

                {/* Zoom button on top right */}
                <button
                  onClick={() => setIsZoomed(true)}
                  className="absolute top-4 right-4 bg-white/80 backdrop-blur text-gray-800 p-2.5 rounded-lg shadow-md border border-gray-200 hover:bg-white transition-colors"
                  title="Zoom In"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM10.5 7.5v6m3-3h-6" />
                  </svg>
                </button>
              </div>
            ) : (
              <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
                <iframe
                  src={introVideoUrl}
                  title="Lesson intro video"
                  className="absolute inset-0 w-full h-full rounded-xl border border-gray-200 shadow-sm"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen={false}
                />
              </div>
            )}

            <div className="mt-4 sm:mt-5 md:mt-6 flex flex-col items-center gap-2">
              {shouldShowComic ? (
                <button
                  disabled={comicReadTimer > 0}
                  onClick={() => {
                    if (comicSlideIndex < introComicUrls.length - 1) {
                      setComicSlideIndex(prev => prev + 1);
                    } else {
                      if (actualType === 'comic') {
                        goNext();
                      } else {
                        setVideoAcknowledged(true);
                      }
                    }
                  }}
                  className={`px-5 py-3 sm:px-6 sm:py-3.5 rounded-lg sm:rounded-xl text-white font-semibold text-base sm:text-lg shadow-md transition-colors min-w-[200px] ${comicReadTimer > 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
                >
                  {comicReadTimer > 0 
                    ? `Wait ${comicReadTimer}s`
                    : (comicSlideIndex < introComicUrls.length - 1 ? 'Next' : (actualType === 'comic' ? 'Continue' : 'Start lesson'))}
                </button>
              ) : (
                <button
                  onClick={() => setVideoAcknowledged(true)}
                  className="px-5 py-3 sm:px-6 sm:py-3.5 rounded-lg sm:rounded-xl text-white font-semibold text-base sm:text-lg shadow-md transition-colors bg-blue-600 hover:bg-blue-700"
                >
                  Start lesson
                </button>
              )}
            </div>
          </div>
        </div>

        {isZoomed && shouldShowComic && (
          <div className="fixed inset-0 z-[10000] bg-black/95 flex flex-col items-center justify-center p-4">
            <button
              onClick={() => setIsZoomed(false)}
              className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white rounded-full p-3 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <img
              src={introComicUrls[comicSlideIndex]}
              alt={`Zoomed Comic ${comicSlideIndex + 1}`}
              className="max-w-[95%] max-h-[90vh] object-contain cursor-zoom-out"
              onClick={() => setIsZoomed(false)}
            />
          </div>
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
      </div>
    );
  }

  if (isMobile) {
    return (
      <div className="h-screen w-full relative overflow-hidden bg-gradient-to-b from-[#4138a3] to-[#7b5ef0]">
        {/* Background Starry Lottie */}
        <div className="absolute inset-0 z-0">
          <Lottie
            animationData={backgroundLottie}
            loop={true}
            className="w-full h-full object-cover opacity-100"
            rendererSettings={{
              preserveAspectRatio: 'xMidYMid slice'
            }}
          />
        </div>

        {/* Floating Header */}
        <div className="absolute top-0 left-0 right-0 p-5 flex flex-col gap-4 z-30">
          <div className="flex items-center justify-between">
            {!isInReviewOrRevision && (
              <button
                onClick={() => setShowExitConfirm(true)}
                className="w-11 h-11 flex items-center justify-center rounded-full bg-[#6d5dfc] text-white shadow-lg active:scale-95 transition-all border-2 border-white/20"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                </svg>
              </button>
            )}
            {isInReviewOrRevision && <div className="w-11 h-11"></div>}

            <div className="flex-1 flex flex-col items-center px-4">
              <div className="w-full max-w-[180px]">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[11px] font-black text-white uppercase tracking-wider">Lesson Progress</span>
                  <span className="text-[11px] font-black text-white tracking-widest">{index + 1}/{items.length}</span>
                </div>
                <div className="h-3 w-full bg-white/30 rounded-full overflow-hidden border border-white/20">
                  <div 
                    className="h-full bg-[#a166ff] transition-all duration-500 rounded-full" 
                    style={{ width: `${((index + 1) / items.length) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center">
              <div className="bg-white rounded-full p-1.5 px-3 shadow-lg flex items-center gap-2 h-10 border border-purple-100">
                <div className="w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center text-white shadow-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                    <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-sm font-black text-blue-900">{totalStars}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Mascot Section */}
        <div className="absolute top-[5px] left-0 right-0 flex justify-center z-0">
          <div className="relative w-full max-w-sm flex items-center justify-center px-4">
            {/* Hoshi Lottie - Shifted right by 5% relative to previous position */}
            <div className="w-64 h-64 -ml-10 -mb-16 opacity-100">
              <Lottie animationData={hoshiMascot} loop={true} className="w-full h-full drop-shadow-2xl" />
            </div>

            {/* Pop Lottie - Shifted down relative to mascot */}
            <div className="w-64 h-64 -ml-24 mt-10">
              <Lottie animationData={popLottie} loop={true} className="w-full h-full" />
            </div>
          </div>
        </div>

        {/* Concept Card */}
        <div className="absolute inset-x-8 top-[240px] bottom-[140px] z-10 scale-[1.02] origin-top">
          <div className="h-full w-full bg-white rounded-[40px] shadow-[0_25px_60px_rgba(0,0,0,0.4)] flex flex-col overflow-hidden border border-white/50">
            {/* Card Header */}
            <div className="p-5 px-6 flex items-center justify-start gap-3 flex-shrink-0">
              <img 
                src="https://res.cloudinary.com/dcxlzfyfp/image/upload/v1777550585/img-to-link/rpxdtc6dw5kjgmrthpmn.png" 
                alt="icon" 
                className="w-10 h-10 object-contain"
              />
              <span className="text-[24px] font-black text-blue-900 uppercase tracking-tight">Concepts</span>
            </div>

            {/* Card Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 pt-2 flex flex-col items-center no-scrollbar">
              {/* Text above images - Enlarged and Centered */}
              <div 
                className="text-[18px] font-black text-gray-800 text-center leading-snug w-full mb-6"
                dangerouslySetInnerHTML={{ __html: String(item.text || item.content || '') }}
              />

              {/* Images Grid inside Card - Adaptive for 1, 2, or 3+ images */}
              {(() => {
                const imgs = (item.images || []).filter(Boolean);
                if (imgs.length === 0 && item.imageUrl) imgs.push(item.imageUrl);
                if (imgs.length === 0) return null;

                return (
                  <div className={`grid ${imgs.length === 1 ? 'grid-cols-1' : 'grid-cols-2'} gap-4 w-full no-scrollbar`}>
                    {imgs.slice(0, 4).map((src, i) => {
                      const isLastOfThree = imgs.length === 3 && i === 2;
                      return (
                        <div 
                          key={i} 
                          className={`aspect-square bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm active:scale-95 transition-all p-2 flex items-center justify-center ${isLastOfThree ? 'col-span-2 max-w-[180px] mx-auto' : ''}`}
                        >
                          <img src={src} alt="concept" className="w-full h-full object-contain" />
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>

        {/* Floating Bottom Button - No background container, just the button on starry bg */}
        <div className="absolute bottom-8 left-0 right-0 px-10 z-20">
          <button
            onClick={goNext}
            disabled={isComicActive && comicReadTimer > 0}
            className={`w-full py-5 rounded-[24px] font-black text-2xl tracking-wide shadow-[0_8px_0_0_#4a3fcc] active:shadow-none active:translate-y-2 transition-all uppercase ${isComicActive && comicReadTimer > 0
                ? 'bg-gray-400 text-gray-200 shadow-[0_8px_0_0_#4b5563]'
                : 'bg-[#6d5dfc] text-white'
              }`}
          >
            {isComicActive && comicReadTimer > 0 ? `Wait ${comicReadTimer}s` : 'Check'}
          </button>
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
        {!isInReviewOrRevision && (
          <button
            onClick={() => setShowExitConfirm(true)}
            className="w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-sm sm:text-base"
          >
            ✕
          </button>
        )}
        {isInReviewOrRevision && <div className="w-6 h-6 sm:w-8 sm:h-8"></div>}
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

      {/* Main Content - mobile optimized, desktop unchanged */}
      <div className="flex-1 flex flex-col items-center px-2 sm:px-4 md:px-6 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 80px)' }}>
        {/* Title and Text - mobile optimized, desktop unchanged */}
        {item.title && (
          <h2 className="text-2xl sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-extrabold text-gray-900 text-center mt-2 sm:mt-6 md:mt-8 text-overflow-fix px-1 sm:px-2">
            {item.title}
          </h2>
        )}
        <div className="w-full max-w-2xl sm:max-w-3xl md:max-w-4xl mt-2 sm:mt-6 md:mt-8 lg:mt-10">
          <p
            className="text-lg sm:text-base md:text-lg lg:text-xl xl:text-2xl font-extrabold text-gray-900 leading-relaxed whitespace-pre-wrap text-center text-overflow-fix px-1 sm:px-2"
            dangerouslySetInnerHTML={{ __html: String(item.text || item.content || '') }}
          />
        </div>

        {/* Images block - mobile optimized, desktop unchanged */}
        {(() => {
          const imgs = (item.images || []).filter(Boolean); if (imgs.length === 0 && item.imageUrl) imgs.push(item.imageUrl); return imgs.length > 0 ? (
            <div className="w-full max-w-2xl sm:max-w-3xl md:max-w-4xl mt-2 sm:mt-6 md:mt-8 flex justify-center">
              <div className="flex flex-wrap justify-center gap-1 sm:gap-3 md:gap-5">
                {((item.images && item.images.filter(Boolean)) || (item.imageUrl ? [item.imageUrl] : [])).slice(0, 5).map((src, i) => (
                  <div key={i} className="border border-blue-300 rounded-lg sm:rounded-2xl p-1 sm:p-3 bg-white shadow-sm">
                    <img src={src} alt={'concept-' + i} className="h-40 w-32 sm:h-32 sm:w-24 md:h-48 md:w-36 lg:h-60 lg:w-44 xl:h-80 xl:w-60 object-contain rounded-md sm:rounded-xl" />
                  </div>
                ))}
              </div>
            </div>
          ) : null
        })()}

        {/* Bottom padding - mobile only for fixed button */}
        <div className="h-16 sm:h-0 md:h-0"></div>
      </div>

      {/* Continue button - fixed on mobile, normal on desktop */}
      <div className="fixed sm:relative bottom-0 left-0 right-0 sm:bottom-auto sm:left-auto sm:right-auto bg-white border-t-2 border-blue-300 sm:border-t-0 shadow-lg sm:shadow-none px-2 sm:px-3 md:px-6 py-3 sm:py-4 z-50 sm:z-auto">
        <div className="w-full max-w-sm sm:max-w-md md:max-w-2xl lg:max-w-3xl mx-auto">
          <button
            onClick={goNext}
            disabled={isComicActive && comicReadTimer > 0}
            className={`w-full py-3 sm:py-4 md:py-5 rounded-lg sm:rounded-xl text-white font-extrabold text-xl sm:text-base md:text-lg transition-colors shadow-lg sm:shadow-none ${isComicActive && comicReadTimer > 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
          >
            {isComicActive && comicReadTimer > 0 ? `Please wait ${comicReadTimer}s...` : 'Continue'}
          </button>
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

