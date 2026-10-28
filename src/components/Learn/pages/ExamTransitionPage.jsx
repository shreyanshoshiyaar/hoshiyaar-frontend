import React, { useMemo } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useModuleItems } from '../../../hooks/useModuleItems.js';
import SimpleLoading from '../../ui/SimpleLoading.jsx';
import LessonHeader from '../LessonHeader.jsx';

export default function ExamTransitionPage() {
  const navigate = useNavigate();
  const { moduleNumber } = useParams();
  const location = useLocation();
  const { items, loading } = useModuleItems(moduleNumber);

  const searchParams = new URLSearchParams(location.search);
  const isDemo = moduleNumber === 'demo' || searchParams.get('demo') === 'true';

  // Find all exam/descriptive questions in the module
  const examIndex = useMemo(() => {
    if (!items || items.length === 0) return 0;
    const idx = items.findIndex(it => {
      const q = String(it.question || it.text || '').toLowerCase();
      const ct = String(it.cardTitle || it.batchTitle || '').toLowerCase();
      const type = String(it.type || '').toLowerCase();
      return q.includes('exam moment') || q.includes('exam mode') || ct.includes('exam') || type === 'descriptive';
    });
    return idx >= 0 ? idx : 0;
  }, [items]);

  const handleStartExam = () => {
    const suffix = location.search || '';
    if (isDemo || !items || items.length === 0) {
      navigate(`/learn/module/${moduleNumber || 1}/descriptive/${examIndex}${suffix}`);
      return;
    }

    const targetItem = items[examIndex];
    const itemType = String(targetItem?.type || 'descriptive').toLowerCase();

    switch (itemType) {
      case 'descriptive':
        navigate(`/learn/module/${moduleNumber}/descriptive/${examIndex}${suffix}`);
        break;
      case 'multiple-choice':
        navigate(`/learn/module/${moduleNumber}/mcq/${examIndex}${suffix}`);
        break;
      case 'fill-in-the-blank':
        navigate(`/learn/module/${moduleNumber}/fillups/${examIndex}${suffix}`);
        break;
      default:
        navigate(`/learn/module/${moduleNumber}/descriptive/${examIndex}${suffix}`);
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  if (loading && !isDemo) {
    return <SimpleLoading text="Getting Exam Moment ready..." />;
  }

  return (
    <div className="min-h-screen bg-[#0B1726] flex flex-col justify-between items-center p-4 sm:p-6 select-none relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#1E74FD]/15 blur-3xl rounded-full pointer-events-none" />

      {/* Top Header (Unified Lesson Header) */}
      <div className="w-full relative z-10">
        <LessonHeader
          onBack={handleBack}
          title="EXAM MOMENT"
          currentIndex={examIndex}
          total={items.length}
          theme="exam"
          onSkip={handleStartExam}
        />
      </div>

      {/* Main Transition Hero Card */}
      <div className="w-full max-w-md bg-white rounded-[32px] border-2 border-[#1E74FD]/30 shadow-[0_16px_50px_rgba(30,116,253,0.2)] p-6 sm:p-8 flex flex-col items-center text-center my-auto animate-fade-in relative z-10">
        {/* Exam pill */}
        <div className="px-4 py-1.5 rounded-full bg-[#EEF5FF] text-[#1E74FD] font-black text-xs sm:text-sm uppercase tracking-wider mb-4 inline-flex items-center gap-2 shadow-xs">
          <span className="w-2 h-2 rounded-full bg-[#1E74FD] animate-ping" />
          <span>Final Test</span>
        </div>

        {/* Animated Exam Icon */}
        <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-br from-[#F0F7FF] to-[#DCEBFF] border-4 border-[#1E74FD] flex items-center justify-center text-5xl sm:text-6xl mb-4 shadow-inner transform hover:scale-105 transition-transform">
          📝
        </div>

        {/* Title: Exam moment */}
        <h1 
          style={{ fontFamily: "var(--f-display, 'Fredoka', sans-serif)" }}
          className="text-3xl sm:text-4xl font-black text-[#101F33] tracking-tight leading-tight mb-2"
        >
          Exam moment
        </h1>

        <p className="text-sm sm:text-base font-semibold text-slate-600 max-w-xs mb-5 leading-snug">
          Write it the way you would in the exam.
        </p>

        {/* Features Row */}
        <div className="w-full bg-[#F8FAFC] border border-slate-200 rounded-2xl p-3.5 mb-6 flex items-center justify-around text-xs font-black text-slate-700">
          <div className="flex items-center gap-1.5">
            <span className="text-base">✍️</span>
            <span>Own words</span>
          </div>
          <span className="text-slate-300">•</span>
          <div className="flex items-center gap-1.5">
            <span className="text-base">🎤</span>
            <span>Voice speak</span>
          </div>
          <span className="text-slate-300">•</span>
          <div className="flex items-center gap-1.5">
            <span className="text-base">🏆</span>
            <span>Max score</span>
          </div>
        </div>

        {/* Start Exam 3D Button */}
        <button
          onClick={handleStartExam}
          style={{ fontFamily: "var(--f-display, 'Fredoka', sans-serif)" }}
          className="w-full h-15 sm:h-16 rounded-[22px] font-black text-xl bg-[#1E74FD] hover:bg-blue-600 border-b-4 border-blue-700 text-white shadow-lg active:translate-y-[2px] transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>✍️</span>
          <span>Start Exam Moment</span>
        </button>
      </div>

      <div className="h-4" />
    </div>
  );
}
