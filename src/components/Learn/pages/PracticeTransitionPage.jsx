import React, { useMemo } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useModuleItems } from '../../../hooks/useModuleItems.js';
import { useAuth } from '../../../context/AuthContext.jsx';
import SimpleLoading from '../../ui/SimpleLoading.jsx';
import LessonHeader from '../LessonHeader.jsx';

export default function PracticeTransitionPage() {
  const navigate = useNavigate();
  const { moduleNumber } = useParams();
  const location = useLocation();
  const { user } = useAuth();
  const { items, loading } = useModuleItems(moduleNumber);

  const searchParams = new URLSearchParams(location.search);
  const title = searchParams.get('title') || `Module ${moduleNumber}`;
  const isDemo = moduleNumber === 'demo' || searchParams.get('demo') === 'true';

  // Find all practice questions in the module
  const practiceItems = useMemo(() => {
    if (!items || items.length === 0) return [];
    return items.filter(it => {
      const t = String(it.type || '').toLowerCase();
      return (
        t === 'multiple-choice' ||
        t === 'fill-in-the-blank' ||
        t === 'rearrange' ||
        t === 'descriptive' ||
        t === 'practice'
      );
    });
  }, [items]);

  // Find first practice question index in the module items array
  const firstPracticeIndex = useMemo(() => {
    if (!items || items.length === 0) return 0;
    const idx = items.findIndex(it => {
      const t = String(it.type || '').toLowerCase();
      return (
        t === 'multiple-choice' ||
        t === 'fill-in-the-blank' ||
        t === 'rearrange' ||
        t === 'descriptive'
      );
    });
    return idx >= 0 ? idx : 0;
  }, [items]);

  const handleStartPractice = () => {
    const suffix = location.search || '';
    if (isDemo || practiceItems.length === 0) {
      // Direct demo rearrange question
      navigate(`/learn/module/${moduleNumber || 1}/rearrange/${firstPracticeIndex}${suffix}`);
      return;
    }

    const firstItem = items[firstPracticeIndex];
    const itemType = String(firstItem?.type || 'rearrange').toLowerCase();

    switch (itemType) {
      case 'multiple-choice':
        navigate(`/learn/module/${moduleNumber}/mcq/${firstPracticeIndex}${suffix}`);
        break;
      case 'fill-in-the-blank':
        navigate(`/learn/module/${moduleNumber}/fillups/${firstPracticeIndex}${suffix}`);
        break;
      case 'rearrange':
        navigate(`/learn/module/${moduleNumber}/rearrange/${firstPracticeIndex}${suffix}`);
        break;
      case 'descriptive':
        navigate(`/learn/module/${moduleNumber}/descriptive/${firstPracticeIndex}${suffix}`);
        break;
      default:
        navigate(`/learn/module/${moduleNumber}/rearrange/${firstPracticeIndex}${suffix}`);
    }
  };

  // Directly bypass and start with questions immediately
  React.useEffect(() => {
    if (!loading || isDemo) {
      handleStartPractice();
    }
  }, [loading, isDemo, items, firstPracticeIndex]);

  const handleBack = () => {
    navigate(-1);
  };

  if (loading && !isDemo) {
    return <SimpleLoading text="Getting practice ready..." />;
  }

  const questionCount = practiceItems.length > 0 ? practiceItems.length : 2;

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-between items-center p-4 sm:p-6 select-none">
      {/* Top Header (Unified Lesson Header) */}
      <div className="w-full relative z-10">
        <LessonHeader
          onBack={handleBack}
          title="PRACTICE"
          currentIndex={firstPracticeIndex}
          total={items.length}
          theme="light"
          onSkip={handleStartPractice}
        />
      </div>

      {/* Main Transition Hero Card */}
      <div className="w-full max-w-md bg-white rounded-[32px] border-2 border-[#D1FADF] shadow-[0_12px_40px_rgba(0,0,0,0.12)] p-6 sm:p-8 flex flex-col items-center text-center my-auto animate-fade-in">
        {/* Mint green pill */}
        <div className="px-4 py-1.5 rounded-full bg-[#E6F9F0] text-[#027A48] font-black text-xs sm:text-sm uppercase tracking-wider mb-4 inline-flex items-center gap-2 shadow-xs">
          <span className="w-2 h-2 rounded-full bg-[#12B76A] animate-ping" />
          <span>Next Up</span>
        </div>

        {/* Animated Practice Icon */}
        <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-[#FEF08A] border-4 border-[#FACC15] flex items-center justify-center text-5xl sm:text-6xl mb-4 shadow-inner transform hover:scale-105 transition-transform">
          🎯
        </div>

        {/* Title: Practice */}
        <h1 
          style={{ fontFamily: "var(--f-display, 'Fredoka', sans-serif)" }}
          className="text-3xl sm:text-4xl font-black text-[#101F33] tracking-tight leading-tight mb-2"
        >
          Practice
        </h1>

        <p className="text-sm sm:text-base font-semibold text-slate-600 max-w-xs mb-5 leading-snug">
          Great job with the lesson! Now let&rsquo;s test what you learned with quick questions.
        </p>

        {/* Question Types Badge Row */}
        <div className="w-full bg-[#F8FAFC] border border-slate-200 rounded-2xl p-3.5 mb-6 flex items-center justify-around text-xs font-black text-slate-700">
          <div className="flex items-center gap-1.5">
            <span className="text-base">🧩</span>
            <span>Rearrange</span>
          </div>
          <span className="text-slate-300">•</span>
          <div className="flex items-center gap-1.5">
            <span className="text-base">✍️</span>
            <span>Fill-ins</span>
          </div>
          <span className="text-slate-300">•</span>
          <div className="flex items-center gap-1.5">
            <span className="text-base">🔘</span>
            <span>MCQs</span>
          </div>
        </div>

        {/* Start Practice 3D Button */}
        <button
          onClick={handleStartPractice}
          style={{ fontFamily: "var(--f-display, 'Fredoka', sans-serif)" }}
          className="w-full h-14 sm:h-16 rounded-[22px] font-black text-xl bg-[#FACC15] hover:bg-[#EAB308] border-b-4 border-[#CA8A04] text-slate-950 shadow-md active:translate-y-[2px] active:scale-[0.99] transition-all flex items-center justify-center cursor-pointer"
        >
          Start Practice
        </button>
      </div>

      {/* Footer Info */}
      <div className="py-2 text-xs font-bold text-slate-400">
        {questionCount} questions in this practice set
      </div>
    </div>
  );
}
