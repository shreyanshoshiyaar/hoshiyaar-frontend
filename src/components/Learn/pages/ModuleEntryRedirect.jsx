import React, { useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useModuleItems } from '../../../hooks/useModuleItems';
import { useReview } from '../../../context/ReviewContext.jsx';

export default function ModuleEntryRedirect() {
  const navigate = useNavigate();
  const { moduleNumber } = useParams();
  const location = useLocation();
  const { items, loading, error } = useModuleItems(moduleNumber);
  const { reset } = useReview();
  const searchSuffix = location.search || '';

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
    
    const idx = 0;
    const first = items[idx];
    console.log('[ModuleEntryRedirect] Navigating to first item:', first.type);
    
    switch (first.type) {
      case 'concept':
      case 'statement':
      case 'comic':
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
      default:
        console.warn('[ModuleEntryRedirect] Unknown item type, redirecting back:', first.type);
        navigate('/learn', { replace: true });
    }
  }, [items, loading, error, moduleNumber, navigate]);

  if (loading) return <div className="p-6">Loading Module Content...</div>;
  if (error) return <div className="p-6 text-red-600">Error: {error}</div>;
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


