import React, { useMemo, useState, useEffect, useCallback } from 'react';
import ProgressBar from '../../ui/ProgressBar.jsx';
import { StarCounter } from '../../../context/StarsContext.jsx';
import SimpleLoading from '../../ui/SimpleLoading.jsx';
import { useNavigate, useParams } from 'react-router-dom';
import { useModuleItems } from '../../../hooks/useModuleItems';
import authService from '../../../services/authService.js';
import { useAuth } from '../../../context/AuthContext.jsx';
import ConceptExitConfirm from '../../modals/ConceptExitConfirm.jsx';

export default function ConceptPage() {
  const navigate = useNavigate();
  const { moduleNumber, index: indexParam } = useParams();
  const index = Number(indexParam || 0);
  const { items, loading, error } = useModuleItems(moduleNumber);
  const { user } = useAuth();
  const item = useMemo(() => items[index] || null, [items, index]);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  // Removed back/popstate interception

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
    const nextIndex = index + 1;
    if (nextIndex >= items.length) {
      // Mark chapter completed and return
      try {
        if (user?._id) {
          await authService.updateProgress({ userId: user._id, chapter: Number(moduleNumber), conceptCompleted: true });
        }
      } catch (_) {}
      return navigate('/lesson-complete');
    }
    const nextItem = items[nextIndex];
    const params = new URLSearchParams(window.location.search);
    const title = params.get('title');
    const suffix = title ? `?title=${encodeURIComponent(title)}` : '';
    navigate(`${routeForType(nextItem.type, nextIndex)}${suffix}`);
  }, [index, items, user, moduleNumber, navigate]);

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
  if (item.type !== 'concept' && item.type !== 'statement') return <div className="p-6">No concept at this step.</div>;

  return (
    <div className="h-screen bg-white flex flex-col overflow-hidden">
      {/* Header - reduced padding for mobile */}
      <div className="flex items-center justify-between p-2 sm:p-3 md:p-4 flex-shrink-0">
        <button 
          onClick={() => setShowExitConfirm(true)}
          className="w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-sm sm:text-base"
        >
          ✕
        </button>
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
          <ConceptExitConfirm onQuit={() => navigate('/learn')} onContinue={() => setShowExitConfirm(false)} />
        </div>
      )}
    </div>
  );
}


