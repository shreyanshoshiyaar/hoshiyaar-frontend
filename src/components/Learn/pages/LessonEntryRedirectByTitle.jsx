import React, { useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useModuleItems } from '../../../hooks/useModuleItems';
import { useReview } from '../../../context/ReviewContext.jsx';

export default function LessonEntryRedirectByTitle() {
  const navigate = useNavigate();
  const { moduleNumber, title } = useParams();
  const location = useLocation();
  const decodedTitle = decodeURIComponent(title || '');
  const { items, loading, error } = useModuleItems(moduleNumber);
  const { reset } = useReview();
  const params = new URLSearchParams(location.search);
  const mode = params.get('mode');

  useEffect(() => {
    try { reset(); } catch (_) {}
    if (loading) return;
    if (error) return;
    if (!items || items.length === 0) return;
    let targetIndex = items.findIndex(i => (i.title || '') === decodedTitle);
    if (targetIndex < 0) targetIndex = 0;
    if (mode === 'revision') {
      // For now, start from first fill-in-the-blank or mcq item of this lesson
      const start = items.findIndex((i, idx) => idx >= targetIndex && ((i.title || '') === decodedTitle) && (i.type === 'fill-in-the-blank' || i.type === 'multiple-choice' || i.type === 'rearrange'));
      if (start >= 0) targetIndex = start;
    }
    const item = items[targetIndex];
    if (!item) return;
    // Preserve existing query params (including chapterId/unitId) while updating title
    const mergedParams = new URLSearchParams(location.search);
    mergedParams.set('title', decodedTitle);
    const querySuffix = mergedParams.toString() ? `?${mergedParams.toString()}` : '';
    switch (item.type) {
      case 'concept':
      case 'statement':
        navigate(`/learn/module/${moduleNumber}/concept/${targetIndex}${querySuffix}`, { replace: true });
        break;
      case 'multiple-choice':
        navigate(`/learn/module/${moduleNumber}/mcq/${targetIndex}${querySuffix}`, { replace: true });
        break;
      case 'fill-in-the-blank':
        navigate(`/learn/module/${moduleNumber}/fillups/${targetIndex}${querySuffix}`, { replace: true });
        break;
      case 'rearrange':
        navigate(`/learn/module/${moduleNumber}/rearrange/${targetIndex}${querySuffix}`, { replace: true });
        break;
      default:
        navigate('/learn', { replace: true });
    }
  }, [items, loading, error, moduleNumber, decodedTitle, navigate]);

  if (loading) return <div className="p-6">Loading…</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;
  return <div className="p-6">No content.</div>;
}


