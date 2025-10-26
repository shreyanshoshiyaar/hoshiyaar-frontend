import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useModuleItems } from '../../../hooks/useModuleItems';

export default function ModuleEntryRedirect() {
  const navigate = useNavigate();
  const { moduleNumber } = useParams();
  const { items, loading, error } = useModuleItems(moduleNumber);

  useEffect(() => {
    if (loading) return;
    if (error) return;
    if (!items || items.length === 0) return;
    const idx = 0;
    const first = items[idx];
    switch (first.type) {
      case 'concept':
      case 'statement':
        navigate(`/learn/module/${moduleNumber}/concept/${idx}`, { replace: true });
        break;
      case 'multiple-choice':
        navigate(`/learn/module/${moduleNumber}/mcq/${idx}`, { replace: true });
        break;
      case 'fill-in-the-blank':
        navigate(`/learn/module/${moduleNumber}/fillups/${idx}`, { replace: true });
        break;
      case 'rearrange':
        navigate(`/learn/module/${moduleNumber}/rearrange/${idx}`, { replace: true });
        break;
      default:
        navigate('/learn', { replace: true });
    }
  }, [items, loading, error, moduleNumber, navigate]);

  if (loading) return <div className="p-6">Loading…</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;
  // If no items, keep user on learn dashboard gracefully
  return <div className="p-6">No content in this module yet.</div>;
}


