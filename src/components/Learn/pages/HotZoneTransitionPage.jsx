import React, { useMemo } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useModuleItems } from '../../../hooks/useModuleItems.js';
import SimpleLoading from '../../ui/SimpleLoading.jsx';
import LessonHeader from '../LessonHeader.jsx';

export default function HotZoneTransitionPage() {
  const navigate = useNavigate();
  const { moduleNumber } = useParams();
  const location = useLocation();
  const { items, loading } = useModuleItems(moduleNumber);

  const searchParams = new URLSearchParams(location.search);
  const isDemo = moduleNumber === 'demo' || searchParams.get('demo') === 'true';

  // Find all hotzone questions in the module
  const hotZoneIndex = useMemo(() => {
    if (!items || items.length === 0) return 0;
    const idx = items.findIndex(it => {
      const q = String(it.question || it.text || '').toLowerCase();
      const ct = String(it.cardTitle || it.batchTitle || '').toLowerCase();
      const type = String(it.type || '').toLowerCase();
      return q.includes('hot zone') || q.includes('hotzone') || ct.includes('hot zone') || type.includes('hotzone');
    });
    return idx >= 0 ? idx : 0;
  }, [items]);

  const handleStartHotZone = () => {
    const suffix = location.search || '';
    if (isDemo || !items || items.length === 0) {
      navigate(`/learn/module/${moduleNumber || 1}/mcq/${hotZoneIndex}${suffix}`);
      return;
    }

    const targetItem = items[hotZoneIndex];
    const itemType = String(targetItem?.type || 'multiple-choice').toLowerCase();

    switch (itemType) {
      case 'multiple-choice':
        navigate(`/learn/module/${moduleNumber}/mcq/${hotZoneIndex}${suffix}`);
        break;
      case 'fill-in-the-blank':
        navigate(`/learn/module/${moduleNumber}/fillups/${hotZoneIndex}${suffix}`);
        break;
      case 'rearrange':
        navigate(`/learn/module/${moduleNumber}/rearrange/${hotZoneIndex}${suffix}`);
        break;
      case 'descriptive':
        navigate(`/learn/module/${moduleNumber}/descriptive/${hotZoneIndex}${suffix}`);
        break;
      default:
        navigate(`/learn/module/${moduleNumber}/mcq/${hotZoneIndex}${suffix}`);
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  if (loading && !isDemo) {
    return <SimpleLoading text="Entering Hot Zone..." />;
  }

  return (
    <div className="min-h-screen bg-[#1F0A07] flex flex-col justify-between items-center p-4 sm:p-6 select-none relative overflow-hidden">
      {/* Background ambient fire glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#FF5722]/15 blur-3xl rounded-full pointer-events-none" />

      {/* Top Header (Unified Lesson Header) */}
      <div className="w-full relative z-10">
        <LessonHeader
          onBack={handleBack}
          title="HOT ZONE"
          currentIndex={hotZoneIndex}
          total={items.length}
          theme="hotzone"
          onSkip={handleStartHotZone}
        />
      </div>

      {/* Main Transition Hero Card */}
      <div className="w-full max-w-md bg-white rounded-[32px] border-2 border-[#FF6B00]/30 shadow-[0_16px_50px_rgba(255,107,0,0.25)] p-6 sm:p-8 flex flex-col items-center text-center my-auto animate-fade-in relative z-10">
        {/* Fire pill */}
        <div className="px-4 py-1.5 rounded-full bg-[#FFF1EB] text-[#EA580C] font-black text-xs sm:text-sm uppercase tracking-wider mb-4 inline-flex items-center gap-2 shadow-xs">
          <span className="w-2 h-2 rounded-full bg-[#FF6B00] animate-ping" />
          <span>Challenge Mode</span>
        </div>

        {/* Animated Hot Zone Flame Icon */}
        <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-br from-[#FFF5F0] to-[#FFE3D6] border-4 border-[#FF6B00] flex items-center justify-center text-5xl sm:text-6xl mb-4 shadow-inner transform hover:scale-105 transition-transform">
          🔥
        </div>

        {/* Title: Hot zone! */}
        <h1 
          style={{ fontFamily: "var(--f-display, 'Fredoka', sans-serif)" }}
          className="text-3xl sm:text-4xl font-black text-[#101F33] tracking-tight leading-tight mb-2"
        >
          Hot zone!
        </h1>

        <p className="text-sm sm:text-base font-semibold text-slate-600 max-w-xs mb-5 leading-snug">
          Join this unit to what you learnt before. Think hard!
        </p>

        {/* Features Row */}
        <div className="w-full bg-[#FFF8F5] border border-[#FFD9CC] rounded-2xl p-3.5 mb-6 flex items-center justify-around text-xs font-black text-[#8A2C1A]">
          <div className="flex items-center gap-1.5">
            <span className="text-base">🧠</span>
            <span>Connect ideas</span>
          </div>
          <span className="text-orange-200">•</span>
          <div className="flex items-center gap-1.5">
            <span className="text-base">💡</span>
            <span>Hints enabled</span>
          </div>
          <span className="text-orange-200">•</span>
          <div className="flex items-center gap-1.5">
            <span className="text-base">⭐</span>
            <span>Bonus stars</span>
          </div>
        </div>

        {/* Start Hot Zone 3D Button */}
        <button
          onClick={handleStartHotZone}
          style={{ fontFamily: "var(--f-display, 'Fredoka', sans-serif)" }}
          className="w-full h-15 sm:h-16 rounded-[22px] font-black text-xl bg-[#FF6B00] hover:bg-[#EA580C] border-b-4 border-[#C2410C] text-white shadow-lg active:translate-y-[2px] transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>🔥</span>
          <span>Enter Hot Zone</span>
        </button>
      </div>

      <div className="h-4" />
    </div>
  );
}
