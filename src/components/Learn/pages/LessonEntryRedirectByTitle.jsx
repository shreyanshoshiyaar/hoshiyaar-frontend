import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useModuleItems } from '../../../hooks/useModuleItems';

export default function LessonEntryRedirectByTitle() {
  const navigate = useNavigate();
  const { moduleNumber, title } = useParams();
  const decodedTitle = decodeURIComponent(title || '');
  const { items, loading, error } = useModuleItems(moduleNumber);
  const params = new URLSearchParams(window.location.search);
  const mode = params.get('mode');

  useEffect(() => {
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
    const q = `?title=${encodeURIComponent(decodedTitle)}`;
    switch (item.type) {
      case 'concept':
      case 'statement':
        navigate(`/learn/module/${moduleNumber}/concept/${targetIndex}${q}`, { replace: true });
        break;
      case 'multiple-choice':
        navigate(`/learn/module/${moduleNumber}/mcq/${targetIndex}${q}`, { replace: true });
        break;
      case 'fill-in-the-blank':
        navigate(`/learn/module/${moduleNumber}/fillups/${targetIndex}${q}`, { replace: true });
        break;
      case 'rearrange':
        navigate(`/learn/module/${moduleNumber}/rearrange/${targetIndex}${q}`, { replace: true });
        break;
      default:
        navigate('/learn', { replace: true });
    }
  }, [items, loading, error, moduleNumber, decodedTitle, navigate]);

  if (loading) return <div className="p-6">Loading…</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;
  return <div className="p-6">No content.</div>;
}


