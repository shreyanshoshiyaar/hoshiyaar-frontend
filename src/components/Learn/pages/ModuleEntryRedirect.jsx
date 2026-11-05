import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useModuleItems } from '../../../hooks/useModuleItems';
import { useReview } from '../../../context/ReviewContext.jsx';
import { useAuth } from '../../../context/AuthContext.jsx';
import SimpleLoading from '../../ui/SimpleLoading.jsx';
import { getLearningParams } from '../../../utils/analyticsHelpers.js';
import { trackAppError, trackFirstModuleStatus } from '../../../utils/analytics.js';
import paymentService from '../../../services/paymentService.js';
import PaywallModal from '../../features/Subscription/PaywallModal.jsx';
import { useAccess } from '../../../context/AccessContext.jsx';
import { isNewStyleStory } from '../../../utils/comicStyleHelper.js';
import { requestAudioPermissions } from '../../../utils/audioPreloadService.js';

export default function ModuleEntryRedirect() {
  const navigate = useNavigate();
  const { moduleNumber } = useParams();
  const location = useLocation();
  const { reset } = useReview();
  const { user } = useAuth();
  const searchSuffix = location.search || '';

  const [showPrompt, setShowPrompt] = useState(false);
  const [resumePathState, setResumePathState] = useState(null);
  const [unsupportedType, setUnsupportedType] = useState(false);

  // Trial / pass gatekeeper: the server counts this lesson against the trial or refuses it
  const [accessChecking, setAccessChecking] = useState(true);
  const [showPaywall, setShowPaywall] = useState(false);
  const [accessAttempt, setAccessAttempt] = useState(0);
  const { setAccess } = useAccess();
  const { items, loading, error, retry } = useModuleItems(moduleNumber, { enabled: !accessChecking && !showPaywall });

  useEffect(() => {
    // Request audio permissions & unlock audio pipeline early
    requestAudioPermissions().catch(() => {});
  }, [moduleNumber]);

  useEffect(() => {
    let isMounted = true;
    const verifyModuleAccess = async () => {
      if (!moduleNumber) return;
      try {
        setAccessChecking(true);
        const res = await paymentService.startLesson(moduleNumber);
        if (!isMounted) return;
        if (res?.access) setAccess(res.access);
        setShowPaywall(res?.hasAccess === false);
      } catch (err) {
        // Network trouble: carry on; the lesson content endpoint still enforces access
        console.warn('[ModuleEntryRedirect] start-lesson failed:', err);
        if (isMounted) setShowPaywall(false);
      } finally {
        if (isMounted) setAccessChecking(false);
      }
    };

    verifyModuleAccess();
    return () => { isMounted = false; };
  }, [moduleNumber, accessAttempt, setAccess]);

  useEffect(() => {
    // GA4 Tracking: Level Start
    if (moduleNumber) {
      const key = `level_start_${moduleNumber}`;
      if (!sessionStorage.getItem(key)) {
        sessionStorage.setItem(key, "true");
        sessionStorage.setItem(`module_start_time_${moduleNumber}`, Date.now().toString());

        const searchParams = new URLSearchParams(window.location.search);
        const title = searchParams.get('title') || `Module ${moduleNumber}`;
        const chapterIdParam = searchParams.get('chapterId');
        const unitIdParam = searchParams.get('unitId');

        window.hyTrack?.("level_start", {
          ...getLearningParams({
            user,
            module: { id: moduleNumber, levelName: title, moduleName: title, chapter: chapterIdParam, unit: unitIdParam },
            source: searchParams.get('source') || "module_start"
          }),
          class: user?.classLevel || "unknown_class",
          module_id: moduleNumber,
          module_status: 'started',
          chapter_id: chapterIdParam
        });

        window.hyTrack?.("module_opened", {
          class: user?.classLevel || "unknown_class",
          module_id: moduleNumber,
          module_status: 'opened',
          chapter_id: chapterIdParam
        });
        
        trackFirstModuleStatus('started');
      }
    }
  }, [moduleNumber, user]);

  useEffect(() => {
    // If paywall is blocking or still verifying access, do not navigate
    if (accessChecking || showPaywall) return;

    // Fresh review queue per lesson
    try { reset(); } catch (_) {}
    if (loading) return;
    if (error) {
      console.error('[ModuleEntryRedirect] Error loading items:', error);
      trackAppError('ERR_MODULE_LOAD_FAILED', { module_id: moduleNumber, error_message: error.message || 'Network error' });
      return;
    }
    
    if (!items || items.length === 0) {
      console.warn('[ModuleEntryRedirect] No items found for module:', moduleNumber);
      return;
    }
    
    // Resume functionality
    const isReviewMode = searchSuffix.includes('review=true') || searchSuffix.includes('revision=true');
    if (!isReviewMode && !showPrompt) {
      try {
        const resumePath = localStorage.getItem(`resume_lesson_${moduleNumber}`);
        if (resumePath && !resumePathState) {
          setResumePathState(resumePath);
          setShowPrompt(true);
          return; // Pause navigation, wait for user input
        }
      } catch (e) {
        console.warn('Error reading resume state:', e);
      }
    }
    
    if (!showPrompt) {
      const idx = 0;
      const first = items[idx];
      
      switch (first?.type) {
        case 'engagement':
        case 'engagement-audio':
        case 'engagement-mcq':
        case 'engagement-rearrange':
          navigate(`/learn/module/${moduleNumber}/engagement/${idx}${searchSuffix}`, { replace: true });
          break;
        case 'multiple-choice':
          navigate(`/learn/module/${moduleNumber}/mcq/${idx}${searchSuffix}`, { replace: true });
          break;
        case 'fill-in-the-blank':
          navigate(`/learn/module/${moduleNumber}/fillups/${idx}${searchSuffix}`, { replace: true });
          break;
        case 'rearrange':
          navigate(`/learn/module/${moduleNumber}/rearrange/${idx}${searchSuffix}`, { replace: true });
          break;
        case 'descriptive':
          navigate(`/learn/module/${moduleNumber}/descriptive/${idx}${searchSuffix}`, { replace: true });
          break;
        case 'didyouknow':
        case 'did_you_know':
        case 'did-you-know':
        case 'remember':
          navigate(`/learn/module/${moduleNumber}/didyouknow/${idx}${searchSuffix}`, { replace: true });
          break;
        case 'comic': {
          const searchParams = new URLSearchParams(window.location.search);
          const isNew = isNewStyleStory({
            item: first,
            items,
            chapterId: searchParams.get('chapterId'),
            chapterTitle: searchParams.get('title')
          });
          if (isNew) {
            navigate(`/learn/module/${moduleNumber}/story/${idx}${searchSuffix}`, { replace: true });
          } else {
            navigate(`/learn/module/${moduleNumber}/concept/${idx}${searchSuffix}`, { replace: true });
          }
          break;
        }
        case 'story':
          navigate(`/learn/module/${moduleNumber}/story/${idx}${searchSuffix}`, { replace: true });
          break;
        case 'blackboard':
        case 'blackboard-step':
        case 'board':
          navigate(`/learn/module/${moduleNumber}/blackboard/${idx}${searchSuffix}`, { replace: true });
          break;
        case 'concept':
        case 'statement':
        case 'video':
        default:
          navigate(`/learn/module/${moduleNumber}/concept/${idx}${searchSuffix}`, { replace: true });
          break;
      }
    }
  }, [items, loading, error, moduleNumber, navigate, searchSuffix, showPrompt, resumePathState, accessChecking, showPaywall]);

  const handleResume = () => {
    navigate(resumePathState, { replace: true });
  };

  const handleStartOver = () => {
    localStorage.removeItem(`resume_lesson_${moduleNumber}`);
    setShowPrompt(false);
    setResumePathState(null);
  };

  if (accessChecking) return <SimpleLoading text="Checking access..." />;

  if (showPaywall) {
    const searchParams = new URLSearchParams(window.location.search);
    const lessonTitle = searchParams.get('title') || 'Lesson';

    const chapterIdParam = searchParams.get('chapterId');
    const backTo = chapterIdParam ? `/learn?chapterId=${encodeURIComponent(chapterIdParam)}` : '/learn';
    return (
      <div className="fixed inset-0 bg-[#F0F6FF]">
        <PaywallModal
          isOpen={true}
          onClose={() => {
            // A guest who just created an account gets their remaining trial lessons; try again.
            // login() has already stored the new account, but `user` here is from before it.
            let nowRegistered = false;
            try { nowRegistered = JSON.parse(localStorage.getItem('user') || 'null')?.isGuest === false; } catch (_) {}
            if (user?.isGuest && nowRegistered) {
              setShowPaywall(false);
              setAccessAttempt(n => n + 1);
              return;
            }
            navigate(backTo, { replace: true });
          }}
          onSuccess={() => {
            setShowPaywall(false);
            setAccessAttempt(n => n + 1);
          }}
          moduleTitle={lessonTitle}
        />
      </div>
    );
  }

  if (loading) return <SimpleLoading text="Loading Module Content..." />;
  if (error) {
    return (
      <div className="p-10 text-center flex flex-col items-center justify-center min-h-[50vh]">
        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Oops! Something went wrong</h2>
        <p className="text-gray-500 mb-6 max-w-md">We couldn't load this module right now. It might be unavailable or under maintenance.</p>
        <div className="flex flex-col sm:flex-row gap-3">
          <button 
            onClick={retry}
            className="px-6 py-3 bg-white border-2 border-blue-600 text-blue-600 hover:bg-blue-50 rounded-xl font-bold transition-colors shadow-sm active:scale-95"
          >
            Try Again
          </button>
          <button 
            onClick={() => navigate('/learn')}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-colors shadow-sm active:scale-95"
          >
            Go Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (showPrompt) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl transform transition-all animate-fade-in text-center">
          <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
            ⏳
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-gray-900 mb-2">Resume Lesson?</h2>
          <p className="text-gray-600 font-medium mb-6">
            You left this lesson unfinished. Do you want to resume where you left off or start over?
          </p>
          <div className="flex flex-col gap-3">
            <button 
              onClick={handleResume}
              className="w-full py-3 px-4 bg-blue-600 text-white rounded-2xl font-bold text-lg hover:bg-blue-700 shadow-md hover:shadow-lg transition-all active:scale-95"
            >
              Resume
            </button>
            <button 
              onClick={handleStartOver}
              className="w-full py-3 px-4 bg-gray-100 text-gray-700 rounded-2xl font-bold text-lg hover:bg-gray-200 transition-all active:scale-95"
            >
              Start Over
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (unsupportedType) {
    return (
      <div className="p-10 text-center">
        <h2 className="text-2xl font-bold text-blue-900 mb-4">This lesson isn't ready yet.</h2>
        <p className="text-blue-700/60 mb-6">Our team is still working on this content type. Please check back later!</p>
        <button 
          onClick={() => navigate('/learn')}
          className="px-6 py-2 bg-blue-600 text-white rounded-full font-bold"
        >
          Go Back to Dashboard
        </button>
      </div>
    );
  }

  const searchParams = new URLSearchParams(location.search || '');
  const chapterIdParam = searchParams.get('chapterId');
  const unitIdParam = searchParams.get('unitId');
  const backUrl = chapterIdParam 
    ? `/learn?chapterId=${encodeURIComponent(chapterIdParam)}${unitIdParam ? `&unitId=${encodeURIComponent(unitIdParam)}` : ''}`
    : '/learn';

  if (!items || items.length === 0) {
    return (
      <div className="min-h-screen bg-[#F0F6FF] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center text-3xl mb-4 shadow-sm">
          ⚠️
        </div>
        <h2 className="text-xl font-black text-slate-800 mb-2">Lesson Not Found</h2>
        <p className="text-sm font-semibold text-slate-500 max-w-sm mb-6">
          This lesson ID is outdated or was updated during a recent curriculum upload. Please return to the chapter map to open the latest lesson.
        </p>
        <button 
          onClick={() => navigate(backUrl)}
          className="px-6 py-3 rounded-2xl bg-[#2563EB] hover:bg-blue-700 text-white font-black text-sm uppercase tracking-wider shadow-md transition-all active:scale-95 cursor-pointer"
        >
          Back to Chapter Lessons
        </button>
      </div>
    );
  }

  return <SimpleLoading text="Starting lesson..." />;
}


