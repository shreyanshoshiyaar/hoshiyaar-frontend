import React, { useMemo, useState, useEffect, useCallback, useRef } from 'react';
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
import NoSkipsModal from '../../modals/NoSkipsModal.jsx';
import Lottie from 'lottie-react';
import NetworkError from '../../ui/NetworkError.jsx';
import { trackLevelStart } from '../../../utils/analytics.js';
import GlyphBoard from '../blackboard/GlyphBoard.jsx';
import LessonHeader from '../LessonHeader.jsx';
import ReportFlagButton from '../../common/ReportFlagButton.jsx';
import PlayfulBackground from '../quiz/PlayfulBackground.jsx';
import { getStageInfoForIndex } from '../../../utils/moduleStages.js';
import { isNewStyleStory } from '../../../utils/comicStyleHelper.js';
import { isMissionCompleteItem } from '../../../utils/missionCompleteHelper.js';
import { getCharacterImage, useCharacterImages } from '../../../utils/characterImages.js';
// Large Lottie files are now fetched from the public folder to avoid build issues

const ComicLightbox = ({ src, alt, onClose }) => {
  const [scale, setScale] = useState(1);
  const isDesktop = window.innerWidth >= 768;
  const zoomFactor = isDesktop ? 1 : 2.5;

  return (
    <div 
      className="fixed inset-0 z-[10000] bg-black/95 overflow-auto custom-scrollbar"
      style={{
        display: 'flex',
        alignItems: scale > 1 ? 'flex-start' : 'center',
        justifyContent: scale > 1 ? 'flex-start' : 'center',
      }}
      onClick={() => setScale(s => s === 1 ? zoomFactor : 1)}
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className="fixed top-4 right-4 z-[10001] bg-white/10 hover:bg-white/20 text-white rounded-full p-3 transition-colors shadow-lg"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 sm:w-8 sm:h-8">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <div
        className="p-2 sm:p-4"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: scale > 1 ? `${zoomFactor * 100}%` : '100%',
          minHeight: '100%',
          flexShrink: 0,
          transition: 'width 0.2s ease-out'
        }}
      >
        <img
          src={src}
          alt={alt}
          className="object-contain shadow-2xl transition-all duration-200 ease-out"
          style={{
            cursor: isDesktop ? 'default' : (scale === 1 ? 'zoom-in' : 'zoom-out'),
            width: '100%',
            height: scale > 1 ? 'auto' : '100%',
            maxHeight: scale > 1 ? 'none' : '95vh',
            display: 'block'
          }}
          draggable={false}
        />
      </div>
      
      {!isDesktop && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 text-white/50 text-xs sm:text-sm font-bold tracking-wider pointer-events-none z-50 bg-black/50 px-4 py-2 rounded-full backdrop-blur-sm">
          {scale === 1 ? 'Click to Magnify' : 'Scroll to Pan • Click to Reset'}
        </div>
      )}
    </div>
  );
};

const LazyIframe = ({ src, title, className, allow, allowFullScreen }) => {
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '100px 0px' } // Preload slightly before it comes into view
    );

    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="absolute inset-0 w-full h-full">
      {isVisible ? (
        <iframe
          src={src}
          title={title}
          className={className}
          allow={allow}
          allowFullScreen={allowFullScreen}
          loading="lazy"
        />
      ) : (
        <div className="absolute inset-0 bg-black/10 animate-pulse flex items-center justify-center">
           <svg className="w-12 h-12 text-gray-400 opacity-50" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
        </div>
      )}
    </div>
  );
};

export default function ConceptPage() {
  useCharacterImages();
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
  const stageInfo = useMemo(() => {
    if (isInReviewOrRevision || !items || items.length === 0) return null;
    return getStageInfoForIndex(items, index);
  }, [isInReviewOrRevision, items, index]);
  const isAdminUser = Boolean(
    user?.role === 'admin' || 
    user?.role === 'master' || 
    ['Host', 'hostcbse', 'AKSHITRAVULA', 'AKSHIT', 'SB10', 'Nidhi sekhri'].includes(user?.username) || 
    ['9867735936', '7021970672', '9820277252', '8310532323'].some(p => String(user?.phone || '').replace(/\D/g, '').endsWith(p))
  );
  const { add: addToReview, removeActive, requeueActive, undoActive, stageIncorrect, clearStagedForModule, active: activeReviewItem, queue, initialQueueCount } = useReview();
  // Declared after useReview(): reading initialQueueCount earlier throws and blanks the page
  const effectiveTotal = useMemo(() => {
    if (isInReviewOrRevision) return Math.max(1, initialQueueCount);
    if (!items || !items.length) return 1;
    return items.filter(it => !isMissionCompleteItem(it)).length;
  }, [isInReviewOrRevision, initialQueueCount, items]);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [showNoSkipsModal, setShowNoSkipsModal] = useState(false);
  const [videoAcknowledged, setVideoAcknowledged] = useState(false);
  const [showEndVideo, setShowEndVideo] = useState(false);
  const [skipsLeft, setSkipsLeft] = useState(() => {
    const stored = sessionStorage.getItem(`skips_${moduleNumber}`);
    return stored !== null ? parseInt(stored, 10) : 5;
  });
  const [comicSlideIndex, setComicSlideIndex] = useState(() => {
    try {
      const saved = localStorage.getItem(`resume_lesson_comic_${moduleNumber}_${indexParam || 0}`);
      if (saved) return parseInt(saved, 10) || 0;
    } catch (_) {}
    return 0;
  });

  useEffect(() => {
    try {
      localStorage.setItem(`resume_lesson_comic_${moduleNumber}_${index}`, comicSlideIndex);
    } catch (e) {}
  }, [comicSlideIndex, moduleNumber, index]);
  const { stars: totalStars } = useStars();
  const [isZoomed, setIsZoomed] = useState(false);
  const [comicReadTimer, setComicReadTimer] = useState(0);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // States for fetched Lottie animations
  const [hoshiAnim, setHoshiAnim] = useState(null);
  const [popAnim, setPopAnim] = useState(null);
  const [bgAnim, setBgAnim] = useState(null);
  const [myraBgAnim, setMyraBgAnim] = useState(null);

  useEffect(() => {
    // Fetch large animations from the public folder
    fetch('/lottie/Hoshi2.json').then(res => res.json()).then(data => setHoshiAnim(data)).catch(console.error);
    fetch('/lottie/pop.json').then(res => res.json()).then(data => setPopAnim(data)).catch(console.error);
    fetch('/lottie/Hoshi-Background.json').then(res => res.json()).then(data => setBgAnim(data)).catch(console.error);
    fetch('/lottie/Myra-Background.json').then(res => res.json()).then(data => setMyraBgAnim(data)).catch(console.error);
  }, []);

  // Dynamically enable native pinch-to-zoom when viewing comic full screen
  useEffect(() => {
    const metaViewport = document.querySelector('meta[name="viewport"]');
    if (!metaViewport) return;
    if (isZoomed) {
      metaViewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes');
    } else {
      metaViewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
    }
  }, [isZoomed]);

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
    if (!rawUrl || typeof rawUrl !== 'string') return '';
    const str = rawUrl.trim();
    const vMatch = str.match(/(?:v=|embed\/|shorts\/|\.be\/)([^?&/\s]+)/i);
    if (vMatch && vMatch[1]) return vMatch[1];
    
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
    const match = str.match(regex);
    if (match && match[1]) return match[1];

    try {
      const u = new URL(str.startsWith('http') ? str : `https://${str}`);
      if (u.hostname.includes('youtube.com') || u.hostname.includes('youtu.be')) {
        const vid = u.searchParams.get('v');
        if (vid) return vid;
        const parts = u.pathname.split('/');
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

  const itemVideoUrl = useMemo(() => {
    const sources = [
      introVideoUrl,
      item?.videoUrl,
      item?.introVideoUrl,
      item?.question,
      item?.text,
      item?.content,
      item?.title,
    ];
    
    // First pass: try to find and normalize a YouTube URL
    for (const src of sources) {
      if (typeof src === 'string' && (src.includes('youtube.com') || src.includes('youtu.be') || isYouTubeUrl(src))) {
        const normalized = normalizeVideoUrl(src);
        if (normalized) return normalized;
      }
    }
    
    // Second pass: if no YouTube URL, just return explicit video fields if they start with http
    if (introVideoUrl && typeof introVideoUrl === 'string' && introVideoUrl.startsWith('http')) return introVideoUrl;
    if (item?.videoUrl && typeof item.videoUrl === 'string' && item.videoUrl.startsWith('http')) return item.videoUrl;
    if (item?.introVideoUrl && typeof item.introVideoUrl === 'string' && item.introVideoUrl.startsWith('http')) return item.introVideoUrl;
    
    // Third pass: check other text fields ONLY if they contain a video extension
    for (const src of sources) {
      if (typeof src === 'string' && src.trim().startsWith('http') && 
         (src.toLowerCase().includes('.mp4') || src.toLowerCase().includes('.webm') || src.toLowerCase().includes('.mov'))) {
        return src.trim();
      }
    }
    
    return '';
  }, [item, introVideoUrl, normalizeVideoUrl, isYouTubeUrl]);

  const isShortVideo = useMemo(() => {
    const sources = [
      introVideoUrl,
      item?.imageUrl,
      item?.videoUrl,
      item?.question,
      item?.text,
      ...(item?.images || []),
    ];
    for (const src of sources) {
      if (typeof src === 'string' && (src.includes('shorts/') || src.toLowerCase().includes('shorts'))) {
        return true;
      }
    }
    return false;
  }, [item, introVideoUrl]);

  // DERIVED STATE MOVED UP FOR HOOKS
  const actualType = (() => {
    if (isRevisionModeFromUrl && revisionItem?.type) {
      return String(revisionItem.type);
    }
    return String(item?.type || '');
  })();

  const bgImage = actualType === 'comic' 
    ? 'https://res.cloudinary.com/imq5966f/image/upload/v1791543802/img-to-link/eqapfsffgxkdty1pkq5f.webp'
    : 'https://res.cloudinary.com/imq5966f/image/upload/v1791543803/img-to-link/m6w3rzzraf0o5di82eui.webp';
  const midLessonKey = `${moduleNumber}:${index}`;
  const hasMidLessonVideo = midLessonVideos[midLessonKey];
  const shouldShowVideo = introVideoUrl && !videoAcknowledged && (index === 0 || hasMidLessonVideo || showEndVideo);
  const shouldShowComic = introComicUrls && introComicUrls.length > 0 && (!videoAcknowledged && index === 0 || actualType === 'comic');
  const isComicActive = shouldShowComic || actualType === 'comic';
  const isVideoShowing = shouldShowVideo || !!itemVideoUrl || actualType === 'video';

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

  // Seamlessly redirect blackboard/board items to dedicated BlackboardMode player
  useEffect(() => {
    if (actualType === 'blackboard' || actualType === 'board') {
      const searchSuffix = window.location.search || '';
      navigate(`/learn/module/${moduleNumber}/blackboard/${index}${searchSuffix}`, { replace: true });
    }
  }, [actualType, moduleNumber, index, navigate]);

  // Seamlessly redirect comic/story items to dedicated StoryMode player ONLY for new-style stories / new chapters
  useEffect(() => {
    const isNew = isNewStyleStory({
      item,
      items,
      chapterId: chapterIdParam,
      chapterTitle: new URLSearchParams(window.location.search).get('title') || new URLSearchParams(window.location.search).get('chapterTitle')
    });

    if (actualType === 'story' || (actualType === 'comic' && isNew)) {
      const searchSuffix = window.location.search || '';
      navigate(`/learn/module/${moduleNumber}/story/${index}${searchSuffix}`, { replace: true });
    }
  }, [actualType, moduleNumber, index, navigate, item, items, chapterIdParam]);

  // Seamlessly redirect MissionComplete / Case Closed items to LessonComplete
  useEffect(() => {
    if (isMissionCompleteItem(item)) {
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
      const completionParams = new URLSearchParams();
      completionParams.set('moduleId', String(moduleNumber));
      completionParams.set('chapter', String(moduleNumber));
      if (chapterIdParam) completionParams.set('chapterId', chapterIdParam);
      if (unitIdParam) completionParams.set('unitId', unitIdParam);
      navigate(`/lesson-complete?${completionParams.toString()}`, { replace: true });
    }
  }, [item, moduleNumber, chapterIdParam, unitIdParam, user, navigate]);

  // Auto-navigate to lesson complete after acknowledging end video
  useEffect(() => {
    if (showEndVideo && videoAcknowledged) {
      // Small delay to ensure state is updated, then navigate to lesson complete
      const timer = setTimeout(async () => {
        try {
          if (user?._id) {
            authService.updateProgress({
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
        
        const params = new URLSearchParams(window.location.search);
        const title = params.get('title') || `Module ${moduleNumber}`;
        
        navigate(`/lesson-complete?${completionParams.toString()}`);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [showEndVideo, videoAcknowledged, user, moduleNumber, navigate, chapterIdParam, unitIdParam]);

  // Reset server-side lesson score at entry and track level_start
  useEffect(() => {
    (async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const title = params.get('title') || item?.title || `Module ${moduleNumber}`;
        
        trackLevelStart(moduleNumber, title.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase() || `level_${moduleNumber}`);

        if (user?._id) {
          authService.updateProgress({ userId: user._id, moduleId: String(moduleNumber), subject: user.subject || 'Science', lessonTitle: title, isCorrect: true, deltaScore: 0, resetLesson: index === 0 });
        }
      } catch (_) {}
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moduleNumber]);

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
      case 'comic':
        return `/learn/module/${moduleNumber}/story/${idx}`;
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
    // 1. Comic slide backwards logic
    if (shouldShowComic && comicSlideIndex > 0) {
      setComicSlideIndex(prev => prev - 1);
      return;
    }

    // 2. Double press detection for quit popup
    const lastPress = Number(sessionStorage.getItem('last_back_press_time') || 0);
    const now = Date.now();
    
    if (now - lastPress < 2000) { 
      // Double press confirmed! Show exit confirmation
      setShowExitConfirm(true);
      sessionStorage.removeItem('last_back_press_time');
      return;
    }

    // Record first press
    sessionStorage.setItem('last_back_press_time', String(now));

    // If at the very beginning of the lesson, do not navigate instantly, 
    // wait for the double-press to show the quit confirm.
    if (index === 0 || isInReviewOrRevision) {
      // Optional: You could add a small toast notification here saying "Press back again to quit"
      return;
    }

    // 3. Normal navigation back to previous concept if index > 0
    const prevIndex = index - 1;
    const prevItem = items[prevIndex];
    if (!prevItem) return;
    const params = new URLSearchParams(window.location.search);
    const suffix = params.toString() ? `?${params.toString()}` : '';
    navigate(`${routeForType(prevItem?.type || 'concept', prevIndex)}${suffix}`);
    
  }, [index, items, navigate, moduleNumber, shouldShowComic, comicSlideIndex, isInReviewOrRevision]);

  const goNext = useCallback(async () => {
    // If in review or revision mode, navigate back to review-round instead of next sequential item
    if (isInReviewOrRevision) {
      removeActive();
      navigate('/review-round');
      return;
    }

    const nextIndex = index + 1;
    if (nextIndex >= items.length || isMissionCompleteItem(items[nextIndex])) {
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
          authService.updateProgress({
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
      
      const searchParams = new URLSearchParams(window.location.search);
      const title = searchParams.get('title') || `Module ${moduleNumber}`;
      
      return navigate(`/lesson-complete?${completionParams.toString()}`);
    }
    const nextItem = items[nextIndex];
    const nextType = String(nextItem?.type || '').toLowerCase();
    const isNextPractice = ['multiple-choice', 'fill-in-the-blank', 'rearrange', 'descriptive'].includes(nextType);

    const params = new URLSearchParams(window.location.search);
    const persistent = new URLSearchParams();
    ['title', 'chapterId', 'unitId', 'review', 'revision'].forEach((key) => {
      const value = params.get(key);
      if (value !== null && value !== '') {
        persistent.set(key, value);
      }
    });
    const suffix = persistent.toString() ? `?${persistent.toString()}` : '';

    navigate(`${routeForType(nextItem?.type || 'concept', nextIndex)}${suffix}`);
  }, [index, items, user, moduleNumber, navigate, isInReviewOrRevision, removeActive, midLessonVideos, showEndVideo, videoAcknowledged, chapterIdParam, unitIdParam]);

  const handleMasterSkip = async () => {
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
    goNext();
  };

  const handlePlayerSkip = async () => {
    if (skipsLeft > 0) {
      const newSkips = skipsLeft - 1;
      setSkipsLeft(newSkips);
      sessionStorage.setItem(`skips_${moduleNumber}`, newSkips.toString());
      if (isInReviewOrRevision) {
        removeActive();
        navigate('/review-round');
        return;
      }
      goNext();
    } else {
      setShowNoSkipsModal(true);
    }
  };


  // COMIC TIMER EFFECT
  useEffect(() => {
    if (isComicActive) {
      setComicReadTimer(5);
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
      if ((event.key === 'Enter' || event.keyCode === 13) && !showExitConfirm) {
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

  const isConceptOrStatement = actualType === 'concept' || actualType === 'statement' || actualType === 'comic' || actualType === 'video' || actualType === 'story' || actualType === 'blackboard' || actualType === 'blackboard-step' || actualType === 'board';
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

  if ((shouldShowVideo || shouldShowComic) && !isMobile) {
    return (
      <div className="fixed inset-0 select-none overflow-hidden">
        <PlayfulBackground cardIndex={index}>
        {/* Unified Lesson Header */}
        <LessonHeader
          onBack={handleBack}
          title={isInReviewOrRevision ? 'REVISE PROGRESS' : (actualType === 'comic' ? 'COMIC' : (stageInfo?.stageTitle || 'LEARN PROGRESS'))}
          currentIndex={isInReviewOrRevision ? (initialQueueCount - queue.length) : index}
          total={effectiveTotal}
          stageInfo={stageInfo}
          theme="light"
          onSkip={isAdminUser ? handleMasterSkip : handlePlayerSkip}
          skipsLeft={skipsLeft}
          canMasterSkip={isAdminUser}
          rightExtra={
            <ReportFlagButton
              itemId={item?.itemId || item?._id || `item-${index}`}
              moduleId={moduleNumber}
              chapterId={chapterIdParam}
              questionText={actualType === 'comic' ? `Comic Slide ${comicSlideIndex + 1}` : (item?.text || item?.title || 'Concept Screen')}
              screenName={actualType === 'comic' ? `Comic Slide ${comicSlideIndex + 1}` : `Screen ${index + 1}`}
              className="w-8 h-8 sm:w-9 sm:h-9"
            />
          }
        />

        <div className="flex-1 flex flex-col items-center px-2 sm:px-4 md:px-6 overflow-hidden md:justify-start mt-2 md:mt-4" style={{ maxHeight: 'calc(100vh - 80px)' }}>
          <div className="w-full max-w-3xl sm:max-w-4xl mt-2 md:mt-4">
            {shouldShowComic ? (
              <div className="flex items-center justify-center w-full -mt-2 pb-4">
                <div className="relative inline-block max-w-full flex flex-col items-center">
                  <img
                    src={introComicUrls[comicSlideIndex]}
                    alt={`Comic slide ${comicSlideIndex + 1}`}
                    className="max-w-full h-auto max-h-[70vh] md:max-h-[calc(100vh-250px)] object-contain rounded-xl sm:rounded-2xl cursor-zoom-in shadow-md border-2 border-blue-50 bg-white"
                    onClick={() => setIsZoomed(true)}
                  />
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center w-full">
                <div 
                  className={`relative overflow-hidden border-2 border-blue-50 shadow-md bg-black rounded-xl sm:rounded-2xl ${isShortVideo ? 'aspect-[9/16] h-[65vh]' : 'w-full aspect-video'}`}
                  style={!isShortVideo ? { maxWidth: 'max(320px, calc((100vh - 250px) * 16 / 9))', width: '100%' } : {}}
                >
                  <LazyIframe
                    src={introVideoUrl}
                    title="Lesson intro video"
                    className="absolute inset-0 w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen={true}
                  />
                </div>
              </div>
            )}

            <div className="mt-4 sm:mt-5 md:mt-6 w-full max-w-sm sm:max-w-md md:max-w-2xl lg:max-w-3xl mx-auto relative z-10">
              {shouldShowComic && (
                <img 
                  src="https://res.cloudinary.com/imq5966f/image/upload/v1791543804/img-to-link/prjwol57ayvxogrzua2z.png" 
                  alt="Hoshi" 
                  className="hidden md:block absolute bottom-0 right-4 lg:-right-4 w-[135px] lg:w-[180px] object-contain -z-10 pointer-events-none" 
                />
              )}
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
                  className={`w-full py-3 sm:py-4 md:py-5 rounded-lg sm:rounded-xl text-white font-extrabold text-xl sm:text-base md:text-lg transition-colors shadow-lg sm:shadow-none ${comicReadTimer > 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
                >
                  {comicReadTimer > 0 
                    ? `Wait ${comicReadTimer}s`
                    : (comicSlideIndex < introComicUrls.length - 1 ? 'Next' : (actualType === 'comic' ? 'Continue' : 'Start lesson'))}
                </button>
              ) : (
                <button
                  onClick={() => setVideoAcknowledged(true)}
                  className="w-full py-3 sm:py-4 md:py-5 rounded-lg sm:rounded-xl text-white font-extrabold text-xl sm:text-base md:text-lg transition-colors shadow-lg sm:shadow-none bg-blue-600 hover:bg-blue-700"
                >
                  Start lesson
                </button>
              )}
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
        <NoSkipsModal isOpen={showNoSkipsModal} onClose={() => setShowNoSkipsModal(false)} />
        {isZoomed && shouldShowComic && (
          <ComicLightbox 
            src={introComicUrls[comicSlideIndex]} 
            alt={`Zoomed Comic ${comicSlideIndex + 1}`} 
            onClose={() => setIsZoomed(false)} 
          />
        )}
        </PlayfulBackground>
      </div>
    );
  }



  return (
    <div className="fixed inset-0 select-none overflow-hidden">
      <PlayfulBackground cardIndex={index}>
      {/* Unified Lesson Header */}
      <LessonHeader
        onBack={handleBack}
        title={isInReviewOrRevision ? 'REVISE PROGRESS' : (actualType === 'comic' ? 'COMIC' : (stageInfo?.stageTitle || 'LEARN PROGRESS'))}
        currentIndex={isInReviewOrRevision ? (initialQueueCount - queue.length) : index}
        total={effectiveTotal}
        stageInfo={stageInfo}
        theme="light"
        onSkip={isAdminUser ? handleMasterSkip : handlePlayerSkip}
        skipsLeft={skipsLeft}
        canMasterSkip={isAdminUser}
        rightExtra={
          <ReportFlagButton
            itemId={item?.itemId || item?._id || `item-${index}`}
            moduleId={moduleNumber}
            chapterId={chapterIdParam}
            questionText={actualType === 'comic' ? `Comic Slide ${comicSlideIndex + 1}` : (item?.text || item?.title || 'Concept Screen')}
            screenName={actualType === 'comic' ? `Comic Slide ${comicSlideIndex + 1}` : `Screen ${index + 1}`}
            className="w-8 h-8 sm:w-9 sm:h-9"
          />
        }
      />

      {/* Main Content - stable height to prevent background moving */}
      <div className={`flex-1 flex flex-col items-center px-2 sm:px-4 md:px-6 pb-24 sm:pb-16 md:pb-0 md:justify-start mt-2 md:mt-4 overflow-hidden`} style={{ maxHeight: 'calc(100vh - 80px)' }}>
        {isVideoShowing ? (
          <div className="flex-1 flex flex-col items-center justify-center p-4 w-full">
            <div 
              className={`relative overflow-hidden border border-gray-100 shadow-lg bg-black flex-shrink-0 mt-2 sm:mt-6 rounded-3xl ${isShortVideo ? 'aspect-[9/16] h-[74vh] max-h-[calc(100vh-230px)]' : 'w-full aspect-video'}`}
              style={!isShortVideo ? { maxWidth: 'max(320px, min(72rem, calc((100vh - 320px) * 16 / 9)))', width: '100%' } : {}}
            >
              {(() => {
                const finalSrc = itemVideoUrl || introVideoUrl || '';
                const isYt = finalSrc.includes('youtube.com') || finalSrc.includes('youtu.be');
                if (isYt || !finalSrc) {
                  return (
                    <LazyIframe
                      src={finalSrc}
                      title="Concept video"
                      className="absolute inset-0 w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen={true}
                    />
                  );
                }
                return (
                  <video
                    src={finalSrc}
                    controls
                    className="absolute inset-0 w-full h-full object-contain bg-black"
                    controlsList="nodownload"
                    playsInline
                  />
                );
              })()}
            </div>
          </div>
        ) : shouldShowComic ? (
          <div className="flex-1 flex flex-col items-center justify-start p-2 sm:p-4 w-full">
            <div className="flex items-center justify-center w-full -mt-2 pb-24 md:pb-2">
              <div className="relative inline-block max-w-full flex flex-col items-center">
                <img
                  src={introComicUrls[comicSlideIndex]}
                  alt={`Comic slide ${comicSlideIndex + 1}`}
                  className="max-w-full h-auto max-h-[60vh] md:max-h-[calc(100vh-230px)] object-contain rounded-xl sm:rounded-2xl cursor-zoom-in shadow-md border-2 border-blue-50 bg-white"
                  onClick={() => setIsZoomed(true)}
                />
                
                <button
                  onClick={() => setIsZoomed(true)}
                  className="mt-3 flex items-center gap-2 px-4 py-2 bg-blue-50/50 text-blue-600 rounded-xl font-bold hover:bg-blue-100 transition-colors border border-blue-100 shadow-sm relative z-50"
                  title="Zoom In"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM10.5 7.5v6m3-3h-6" />
                  </svg>
                  <span className="text-sm">Zoom Image</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Character Avatar at top - Hoshi image in every concept card (as requested) */}
            <div className="flex justify-center mb-2 sm:mb-3 mt-1 sm:mt-2">
              <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-[22px] sm:rounded-[28px] p-1 bg-white/80 backdrop-blur-xs shadow-md border-2 border-white/80 overflow-hidden flex items-center justify-center flex-shrink-0">
                <img
                  src={getCharacterImage(item.speaker || 'hoshi', 'hoshi')}
                  alt={item.speaker || "Hoshi"}
                  className="w-full h-full object-cover rounded-[18px] sm:rounded-[24px]"
                />
              </div>
            </div>

            {/* Title if present */}
            {item.title && (
              <h2 className="text-2xl sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-extrabold text-gray-900 text-center mt-1 sm:mt-2 text-overflow-fix px-1 sm:px-2">
                {item.title}
              </h2>
            )}
            <div className="w-full max-w-2xl sm:max-w-3xl md:max-w-4xl mt-2 sm:mt-4 md:mt-4 lg:mt-6">
              <p
                className="text-lg sm:text-base md:text-lg lg:text-xl xl:text-2xl font-extrabold text-gray-900 leading-relaxed whitespace-pre-wrap text-center text-overflow-fix px-1 sm:px-2"
                dangerouslySetInnerHTML={{ __html: String(item.text || item.content || '') }}
              />
            </div>

            {/* Speaker name label at bottom (like second screenshot) */}
            <div className="flex items-center justify-center mt-3 sm:mt-4 mb-1">
              <span className="text-xs sm:text-sm font-black text-slate-600 uppercase tracking-wider">
                {item.speaker || 'Hoshi'}
              </span>
            </div>

            {/* Visual Chalkboard Drawing if available */}
            {(item.glyphCode || actualType === 'blackboard' || actualType === 'blackboard-step' || item.inputJson?.actions) && (
              <div className="w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-3xl mt-3 sm:mt-6">
                <GlyphBoard 
                  noShadow
                  // Desktop: never taller than the space between the title and the Continue button
                  cardClassName="lg:!max-h-[calc(100dvh-330px)] lg:!min-h-[240px]"
                  currentLine={item} 
                  stepJson={item.inputJson}
                  cardTitle={item.title || item.cardTitle || ''} 
                  animKey={index} 
                />
              </div>
            )}

            {/* Images block - larger and responsive */}
            {(() => {
              const imgs = (Array.isArray(item.images) ? item.images : (item.images ? [item.images] : [])).filter(Boolean);
              if (imgs.length === 0 && item.imageUrl) imgs.push(item.imageUrl);
              if (imgs.length > 0) {
                const isSingle = imgs.length === 1;
                return (
                  <div className="w-full max-w-3xl md:max-w-4xl mt-3 sm:mt-5 flex justify-center px-2">
                    <div className="flex flex-wrap justify-center items-center gap-3 sm:gap-4 max-w-full">
                      {imgs.slice(0, 5).map((src, i) => (
                        <div
                          key={i}
                          className="border-2 border-blue-200/90 rounded-2xl p-2 sm:p-3 bg-white shadow-md flex items-center justify-center max-w-full overflow-hidden"
                        >
                          <img
                            src={src}
                            alt={'concept-' + i}
                            className={`${
                              isSingle
                                ? 'max-h-[46vh] sm:max-h-[50vh] md:max-h-[54vh] w-auto max-w-full'
                                : 'h-44 sm:h-56 md:h-64 w-auto max-w-full'
                            } object-contain rounded-xl`}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }

              return null;
            })()}
          </>
        )}

        {/* Bottom padding - mobile only for fixed button */}
        <div className="h-16 sm:h-0 md:h-0"></div>
      </div>

      <div className="fixed sm:relative bottom-0 left-0 right-0 sm:bottom-auto sm:left-auto sm:right-auto bg-white/40 lg:bg-transparent backdrop-blur-sm lg:backdrop-blur-none border-t-2 border-white/20 sm:border-t-0 shadow-lg sm:shadow-none px-2 sm:px-3 md:px-6 py-3 sm:py-4 lg:pb-8 z-50 sm:z-auto lg:w-full">
        <div className="w-full max-w-sm sm:max-w-md md:max-w-2xl lg:max-w-3xl mx-auto relative z-10">
          <button
            onClick={() => {
              if (shouldShowComic) {
                if (comicSlideIndex < introComicUrls.length - 1) {
                  setComicSlideIndex(prev => prev + 1);
                } else {
                  if (actualType === 'comic') goNext(); else setVideoAcknowledged(true);
                }
              } else {
                goNext();
              }
            }}
            disabled={isComicActive && comicReadTimer > 0}
            className={`w-full py-3 sm:py-4 md:py-5 rounded-lg sm:rounded-xl text-white font-extrabold text-xl sm:text-base md:text-lg transition-colors shadow-lg sm:shadow-none ${
              isComicActive && comicReadTimer > 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isComicActive && comicReadTimer > 0 
              ? `Please wait ${comicReadTimer}s...` 
              : (shouldShowComic && comicSlideIndex < introComicUrls.length - 1 ? 'Next' : 'Continue')}
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

      {isZoomed && shouldShowComic && (
        <ComicLightbox 
          src={introComicUrls[comicSlideIndex]} 
          alt={`Zoomed Comic ${comicSlideIndex + 1}`} 
          onClose={() => setIsZoomed(false)} 
        />
      )}
      <NoSkipsModal isOpen={showNoSkipsModal} onClose={() => setShowNoSkipsModal(false)} />
      </PlayfulBackground>
    </div>
  );
}

