import React, { useMemo, useState, useEffect, useCallback } from 'react';
import ProgressBar from '../../ui/ProgressBar.jsx';
import { StarCounter } from '../../../context/StarsContext.jsx';
import SimpleLoading from '../../ui/SimpleLoading.jsx';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useModuleItems } from '../../../hooks/useModuleItems';
import authService from '../../../services/authService.js';
import { useAuth } from '../../../context/AuthContext.jsx';
import { useReview } from '../../../context/ReviewContext.jsx';
import ConceptExitConfirm from '../../modals/ConceptExitConfirm.jsx';

export default function ConceptPage() {
  const navigate = useNavigate();
  const { moduleNumber, index: indexParam } = useParams();
  const index = Number(indexParam || 0);
  const { items, loading, error } = useModuleItems(moduleNumber);
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const isReviewModeFromUrl = searchParams.get('review') === 'true';
  const isRevisionModeFromUrl = searchParams.get('revision') === 'true';
  const isInReviewOrRevision = isReviewModeFromUrl || isRevisionModeFromUrl;
  const { removeActive, active: activeReviewItem, queue } = useReview();
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

  // Show exit confirmation on browser back button in revision/review mode
  useEffect(() => {
    if (!isInReviewOrRevision) return;

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
  }, [isInReviewOrRevision]);

  function routeForType(type, idx) {
    switch (type) {
      case 'concept':
      case 'statement':
        return `/learn/module/${moduleNumber}/concept/${idx}`;
      case 'multiple-choice': return `/learn/module/${moduleNumber}/mcq/${idx}`;
      case 'fill-in-the-blank': return `/learn/module/${moduleNumber}/fillups/${idx}`;
      case 'rearrange': return `/learn/module/${moduleNumber}/rearrange/${idx}`;
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
      } catch (_) {}
      return navigate('/lesson-complete');
    }
    const nextItem = items[nextIndex];
    const params = new URLSearchParams(window.location.search);
    const title = params.get('title');
    const suffix = title ? `?title=${encodeURIComponent(title)}` : '';
    navigate(`${routeForType(nextItem.type, nextIndex)}${suffix}`);
  }, [index, items, user, moduleNumber, navigate, isInReviewOrRevision, removeActive]);

  // Allow advancing with Enter key when the exit confirmation is not visible
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Enter' && !showExitConfirm) {
        event.preventDefault();
        goNext();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goNext, showExitConfirm]);

  if (loading) return <SimpleLoading />;
  if (error) return <div className="p-6 text-red-600">{error}</div>;
  if (!item) return <SimpleLoading />;
  // Check type: In revision mode, use revisionItem.type; in normal mode, use item.type
  let actualType = String(item?.type || '');
  if (isRevisionModeFromUrl && revisionItem?.type) {
    // In revision mode, use revision data type (preserved exactly)
    actualType = String(revisionItem.type || '');
  }
  const isConceptOrStatement = actualType === 'concept' || actualType === 'statement';
  if (!isConceptOrStatement) {
    return <div className="p-6">No concept at this step.</div>;
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
        <StarCounter />
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
        {(() => { const imgs = (item.images || []).filter(Boolean); if (imgs.length === 0 && item.imageUrl) imgs.push(item.imageUrl); return imgs.length > 0 ? (
          <div className="w-full max-w-2xl sm:max-w-3xl md:max-w-4xl mt-2 sm:mt-6 md:mt-8 flex justify-center">
            <div className="flex flex-wrap justify-center gap-1 sm:gap-3 md:gap-5">
              {((item.images && item.images.filter(Boolean)) || (item.imageUrl ? [item.imageUrl] : [])).slice(0,5).map((src, i) => (
                <div key={i} className="border border-blue-300 rounded-lg sm:rounded-2xl p-1 sm:p-3 bg-white shadow-sm">
                  <img src={src} alt={'concept-'+i} className="h-40 w-32 sm:h-32 sm:w-24 md:h-48 md:w-36 lg:h-60 lg:w-44 xl:h-80 xl:w-60 object-contain rounded-md sm:rounded-xl" />
                </div>
              ))}
            </div>
          </div>
        ) : null })()}
        
        {/* Bottom padding - mobile only for fixed button */}
        <div className="h-16 sm:h-0 md:h-0"></div>
      </div>

      {/* Continue button - fixed on mobile, normal on desktop */}
      <div className="fixed sm:relative bottom-0 left-0 right-0 sm:bottom-auto sm:left-auto sm:right-auto bg-white border-t-2 border-blue-300 sm:border-t-0 shadow-lg sm:shadow-none px-2 sm:px-3 md:px-6 py-3 sm:py-4 z-50 sm:z-auto">
        <div className="w-full max-w-sm sm:max-w-md md:max-w-2xl lg:max-w-3xl mx-auto">
          <button 
            onClick={goNext}
            className="w-full py-3 sm:py-4 md:py-5 rounded-lg sm:rounded-xl bg-blue-600 text-white font-extrabold text-xl sm:text-base md:text-lg hover:bg-blue-700 transition-colors shadow-lg sm:shadow-none"
          >
            Continue
          </button>
        </div>
      </div>

      {showExitConfirm && (
        <div className="fixed inset-0 z-[9999]">
          <ConceptExitConfirm 
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
          />
        </div>
      )}
    </div>
  );
}


