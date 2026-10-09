import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';


const HomeIcon = ({ active }) => (
  <svg className={`w-[26px] h-[26px] ${active ? 'text-[#2563EB]' : 'text-gray-400'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

const LearnIcon = ({ active }) => (
  <svg className={`w-[26px] h-[26px] ${active ? 'text-[#2563EB]' : 'text-gray-400'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" />
  </svg>
);

const HomeworkIcon = ({ active }) => (
  <svg className={`w-[26px] h-[26px] ${active ? 'text-[#2563EB]' : 'text-gray-400'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
    <path d="M9 14l2 2 4-4" />
  </svg>
);

const ExamIcon = ({ active }) => (
  <svg className={`w-[26px] h-[26px] ${active ? 'text-[#2563EB]' : 'text-gray-400'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <path d="M9 15l2 2 4-4" />
  </svg>
);

const RanksIcon = ({ active }) => (
  <svg className={`w-[26px] h-[26px] ${active ? 'text-[#2563EB]' : 'text-gray-400'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
    <path d="M4 22h16" />
    <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
    <rect x="6" y="4" width="12" height="10" rx="2" />
  </svg>
);

const MoreIcon = ({ active }) => (
  <svg className={`w-[26px] h-[26px] ${active ? 'text-[#2563EB]' : 'text-gray-400'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);

const ProIcon = ({ active }) => (
  <svg className={`w-[26px] h-[26px] ${active ? 'text-[#2563EB]' : 'text-amber-500'}`} viewBox="0 0 24 24" fill="currentColor">
    <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z" />
  </svg>
);

const BottomNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const path = location.pathname;

  const { user } = useAuth();
  const showProTab = false; // Hidden for play store

  const isHome = path === '/home';
  const isLearn = path === '/learn';
  const isHomework = path === '/homework' || path === '/home-work';
  const isExam = path === '/exam';
  const isRanks = path === '/ranks';
  const isPro = path === '/subscription' || path === '/pricing';
  const isMore = path === '/more';

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-150 flex justify-around items-center pb-safe pt-2.5 pb-2 min-h-[64px] z-[2000] shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
      <button 
        onClick={() => navigate('/home', { replace: true })}
        className={`flex flex-col items-center justify-center flex-1 pb-1.5 relative transition-all active:scale-95 ${isHome ? 'text-[#2563EB]' : 'text-gray-400'}`}
      >
        <HomeIcon active={isHome} />
        <span className="text-[11px] font-black mt-0.5 tracking-tight">Home</span>
        {isHome && <div className="absolute top-[-10px] left-1/2 -translate-x-1/2 w-9 h-1.5 bg-[#2563EB] rounded-full" />}
      </button>

      <button 
        onClick={() => navigate('/learn', { replace: true })}
        className={`flex flex-col items-center justify-center flex-1 pb-1.5 relative transition-all active:scale-95 ${isLearn ? 'text-[#2563EB]' : 'text-gray-400'}`}
      >
        <LearnIcon active={isLearn} />
        <span className="text-[11px] font-black mt-0.5 tracking-tight">Learn</span>
        {isLearn && <div className="absolute top-[-10px] left-1/2 -translate-x-1/2 w-9 h-1.5 bg-[#2563EB] rounded-full" />}
      </button>

      <button 
        onClick={() => navigate('/homework', { replace: true })}
        className={`flex flex-col items-center justify-center flex-1 pb-1.5 relative transition-all active:scale-95 ${isHomework ? 'text-[#2563EB]' : 'text-gray-400'}`}
      >
        <HomeworkIcon active={isHomework} />
        <span className="text-[11px] font-black mt-0.5 tracking-tight">Homework</span>
        {isHomework && <div className="absolute top-[-10px] left-1/2 -translate-x-1/2 w-9 h-1.5 bg-[#2563EB] rounded-full" />}
      </button>

      <button 
        onClick={() => navigate('/exam', { replace: true })}
        className={`flex flex-col items-center justify-center flex-1 pb-1.5 relative transition-all active:scale-95 ${isExam ? 'text-[#2563EB]' : 'text-gray-400'}`}
      >
        <ExamIcon active={isExam} />
        <span className="text-[11px] font-black mt-0.5 tracking-tight">Exam</span>
        {isExam && <div className="absolute top-[-10px] left-1/2 -translate-x-1/2 w-9 h-1.5 bg-[#2563EB] rounded-full" />}
      </button>

      <button 
        onClick={() => navigate('/ranks', { replace: true })}
        className={`flex flex-col items-center justify-center flex-1 pb-1.5 relative transition-all active:scale-95 ${isRanks ? 'text-[#2563EB]' : 'text-gray-400'}`}
      >
        <RanksIcon active={isRanks} />
        <span className="text-[11px] font-black mt-0.5 tracking-tight">Ranks</span>
        {isRanks && <div className="absolute top-[-10px] left-1/2 -translate-x-1/2 w-9 h-1.5 bg-[#2563EB] rounded-full" />}
      </button>

      {showProTab && (
        <button 
          onClick={() => navigate('/subscription')}
          className={`flex flex-col items-center justify-center flex-1 pb-1.5 relative transition-all active:scale-95 ${isPro ? 'text-[#2563EB]' : 'text-amber-500'}`}
        >
          <ProIcon active={isPro} />
          <span className={`text-[11px] font-black mt-0.5 tracking-tight ${isPro ? 'text-[#2563EB]' : 'text-amber-600'}`}>Pro</span>
          {isPro && <div className="absolute top-[-10px] left-1/2 -translate-x-1/2 w-9 h-1.5 bg-[#2563EB] rounded-full" />}
        </button>
      )}

      <button 
        onClick={() => navigate('/more', { replace: true })}
        className={`flex flex-col items-center justify-center flex-1 pb-1.5 relative transition-all active:scale-95 ${isMore ? 'text-[#2563EB]' : 'text-gray-400'}`}
      >
        <MoreIcon active={isMore} />
        <span className="text-[11px] font-black mt-0.5 tracking-tight">More</span>
        {isMore && <div className="absolute top-[-10px] left-1/2 -translate-x-1/2 w-9 h-1.5 bg-[#2563EB] rounded-full" />}
      </button>
    </div>
  );
};

export default BottomNavigation;
