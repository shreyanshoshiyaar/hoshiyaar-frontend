import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useModuleItems } from '../../../hooks/useModuleItems';
import { useReview } from '../../../context/ReviewContext.jsx';
import SimpleLoading from '../../ui/SimpleLoading.jsx';

export default function ModuleEntryRedirect() {
  const navigate = useNavigate();
  const { moduleNumber } = useParams();
  const location = useLocation();
  const { items, loading, error, retry } = useModuleItems(moduleNumber);
  const { reset } = useReview();
  const searchSuffix = location.search || '';

  const [showPrompt, setShowPrompt] = useState(false);
  const [resumePathState, setResumePathState] = useState(null);

  useEffect(() => {
    // Fresh review queue per lesson
    try { reset(); } catch (_) {}
    if (loading) return;
    if (error) {
      console.error('[ModuleEntryRedirect] Error loading items:', error);
      return;
    }
    
    console.log(`[ModuleEntryRedirect] Module ${moduleNumber} content:`, {
      itemCount: items?.length,
      firstType: items?.[0]?.type,
      items: items
    });

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
      console.log('[ModuleEntryRedirect] Navigating to first item:', first.type);
      
      switch (first.type) {
        case 'concept':
        case 'statement':
        case 'comic':
        case 'video':
          navigate(`/learn/module/${moduleNumber}/concept/${idx}${searchSuffix}`, { replace: true });
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
        default:
          console.warn('[ModuleEntryRedirect] Unknown item type, redirecting back:', first.type);
          navigate('/learn', { replace: true });
      }
    }
  }, [items, loading, error, moduleNumber, navigate, searchSuffix, showPrompt, resumePathState]);

  const handleResume = () => {
    navigate(resumePathState, { replace: true });
  };

  const handleStartOver = () => {
    localStorage.removeItem(`resume_lesson_${moduleNumber}`);
    setShowPrompt(false);
    setResumePathState(null);
  };

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

  // If no items, keep user on learn dashboard gracefully
  return (
    <div className="p-10 text-center">
      <h2 className="text-2xl font-bold text-blue-900 mb-4">No content in this module yet.</h2>
      <p className="text-blue-700/60 mb-6">Our team is working on bringing this lesson to you soon!</p>
      <button 
        onClick={() => navigate('/learn')}
        className="px-6 py-2 bg-blue-600 text-white rounded-full font-bold"
      >
        Go Back to Dashboard
      </button>
    </div>
  );
}


