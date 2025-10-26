import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext.jsx';
import reviewService from '../../../services/reviewService.js';
import curriculumService from '../../../services/curriculumService.js';
import { useReview } from '../../../context/ReviewContext.jsx';

export default function RevisionStar({ align = 'left', moduleId, chapterId, unitId }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { reset, add } = useReview();
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    if (!user) return;
    setLoading(true);
    reviewService
      .listIncorrect(user._id, moduleId || undefined, chapterId || undefined)
      .then(list => { if (active) setCount(list.length || 0); })
      .catch(() => {})
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [user, moduleId, chapterId]);

  const handleStart = async () => {
    if (!user) return;
    if (chapterId) {
      // If unitId is provided, navigate directly to that unit's revision page
      if (unitId) {
        navigate(`/revision?chapterId=${encodeURIComponent(chapterId)}&unitId=${encodeURIComponent(unitId)}`);
        return;
      }
      try {
        const res = await curriculumService.listUnits(chapterId);
        const arr = res?.data || [];
        if (Array.isArray(arr) && arr.length > 0) {
          // Prefer user's last opened unit for this chapter if available
          let lastMap = {};
          try { lastMap = JSON.parse(localStorage.getItem('last_unit_by_chapter') || '{}'); } catch (_) { lastMap = {}; }
          const preferred = lastMap?.[chapterId];
          const exists = arr.find(u => u?._id === preferred)?._id;
          const targetUnitId = exists || arr[0]._id;
          if (targetUnitId) {
            navigate(`/revision?chapterId=${encodeURIComponent(chapterId)}&unitId=${encodeURIComponent(targetUnitId)}`);
            return;
          }
        }
      } catch (_) {}
      // Fallback to chapter page if no units
      navigate(`/revision?chapterId=${encodeURIComponent(chapterId)}`);
    } else {
      navigate(`/revision?moduleId=${encodeURIComponent(moduleId || '')}`);
    }
  };

  const sideClass = align === 'right' ? 'items-end text-right' : 'items-start text-left';

  const Icon = () => (
    <svg className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 text-white" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M18 2H7.5C6.12 2 5 3.12 5 4.5v15C5 20.88 6.12 22 7.5 22H19V4c0-1.1-.9-2-2-2zm0 18H7.5c-.55 0-1-.45-1-1V4.5c0-.55.45-1 1-1H18v16z"/>
      <path d="M8 6h8v2H8zM8 10h8v2H8zM8 14h6v2H8z"/>
    </svg>
  );

  return (
    <div className={`flex ${sideClass} my-6 sm:my-8`}>
      <div
        onClick={handleStart}
        className="w-16 h-16 sm:w-18 sm:h-18 md:w-20 md:h-20 lg:w-20 lg:h-20 rounded-full bg-yellow-400 shadow-[0_4px_0_0_rgba(0,0,0,0.15)] sm:shadow-[0_6px_0_0_rgba(0,0,0,0.15)] md:shadow-[0_8px_0_0_rgba(0,0,0,0.15)] flex items-center justify-center cursor-pointer hover:scale-110 transition-transform ring-2 sm:ring-3 md:ring-4 ring-white/70"
        title="Revision"
      >
        <Icon />
      </div>
      {/* Removed loading/count label per request */}
    </div>
  );
}
