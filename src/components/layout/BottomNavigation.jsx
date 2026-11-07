import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useShowPro } from '../../hooks/useShowPro.js';
import { vibrateLight } from '../../utils/vibrationService.js';


const HomeIcon = ({ active }) => (
  <svg className={`w-[26px] h-[26px] ${active ? 'text-white' : 'text-[#475569]'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

const LearnIcon = ({ active }) => (
  <svg className={`w-[26px] h-[26px] ${active ? 'text-white' : 'text-[#475569]'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 4h6a4 4 0 0 1 4 4v13a3 3 0 0 0-3-3H2z" />
    <path d="M22 4h-6a4 4 0 0 0-4 4v13a3 3 0 0 1 3-3h7z" />
  </svg>
);

const HomeworkIcon = ({ active }) => (
  <svg className={`w-[26px] h-[26px] ${active ? 'text-white' : 'text-[#475569]'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
    <path d="M9 14l2 2 4-4" />
  </svg>
);

const ExamIcon = ({ active }) => (
  <svg className={`w-[26px] h-[26px] ${active ? 'text-white' : 'text-[#475569]'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <path d="M9 15l2 2 4-4" />
  </svg>
);

const RanksIcon = ({ active }) => (
  <svg className={`w-[26px] h-[26px] ${active ? 'text-white' : 'text-[#475569]'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
    <path d="M4 22h16" />
    <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
    <rect x="6" y="4" width="12" height="10" rx="2" />
  </svg>
);

const MoreIcon = ({ active }) => (
  <svg className={`w-[26px] h-[26px] ${active ? 'text-white' : 'text-[#475569]'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);

const ProIcon = ({ active }) => (
  <svg className={`w-[26px] h-[26px] ${active ? 'text-[#FDE047]' : 'text-[#D97706]'}`} viewBox="0 0 24 24" fill="currentColor">
    <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z" />
  </svg>
);

const BottomNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const path = location.pathname;

  const { user } = useAuth();
  // Shown once the trial applies to the learner (and always for admins), like the other Pro links
  const showProTab = useShowPro();

  // Fetch the Pro page's code in the background once the tab shows, so tapping it opens
  // straight away instead of showing the loading screen
  useEffect(() => {
    if (!showProTab) return undefined;
    const id = setTimeout(() => { import('../features/Subscription/SubscriptionPage.jsx').catch(() => {}); }, 1500);
    return () => clearTimeout(id);
  }, [showProTab]);

  const isHome = path === '/home';
  const isLearn = path === '/learn';
  const isHomework = path === '/homework' || path === '/home-work';
  const isExam = path === '/exam';
  const isRanks = path === '/ranks';
  const isPro = path === '/subscription' || path === '/pricing';
  const isMore = path === '/more';

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 rounded-t-[24px] flex justify-around items-center pb-safe pt-2 pb-2 px-1 h-[70px] z-[2000] shadow-[0_-6px_20px_rgba(109,40,217,0.15)]">
      <button 
        onClick={() => { vibrateLight(); navigate('/home', { replace: true }); }}
        className={`flex flex-col items-center justify-center flex-1 mx-1 py-1.5 rounded-2xl relative transition-all active:scale-95 ${isHome ? 'bg-gradient-to-b from-[#A855F7] to-[#7C3AED] text-white shadow-[0_3px_0_0_#5B21B6]' : 'text-[#475569]'}`}
      >
        <HomeIcon active={isHome} />
        <span className="text-[12.5px] font-black mt-0.5 tracking-tight leading-none">Home</span>
      </button>

      <button 
        onClick={() => { vibrateLight(); navigate('/learn', { replace: true }); }}
        className={`flex flex-col items-center justify-center flex-1 mx-1 py-1.5 rounded-2xl relative transition-all active:scale-95 ${isLearn ? 'bg-gradient-to-b from-[#A855F7] to-[#7C3AED] text-white shadow-[0_3px_0_0_#5B21B6]' : 'text-[#475569]'}`}
      >
        <LearnIcon active={isLearn} />
        <span className="text-[12.5px] font-black mt-0.5 tracking-tight leading-none">Learn</span>
      </button>

      <button 
        onClick={() => { vibrateLight(); navigate('/ranks', { replace: true }); }}
        className={`flex flex-col items-center justify-center flex-1 mx-1 py-1.5 rounded-2xl relative transition-all active:scale-95 ${isRanks ? 'bg-gradient-to-b from-[#A855F7] to-[#7C3AED] text-white shadow-[0_3px_0_0_#5B21B6]' : 'text-[#475569]'}`}
      >
        <RanksIcon active={isRanks} />
        <span className="text-[12.5px] font-black mt-0.5 tracking-tight leading-none">Ranks</span>
      </button>

      {showProTab && (
        <button 
          onClick={() => { vibrateLight(); navigate('/subscription'); }}
          className={`flex flex-col items-center justify-center flex-1 mx-1 py-1.5 rounded-2xl relative transition-all active:scale-95 ${isPro ? 'bg-gradient-to-b from-[#A855F7] to-[#7C3AED] text-white shadow-[0_3px_0_0_#5B21B6]' : 'text-[#B45309]'}`}
        >
          <ProIcon active={isPro} />
          <span className={`text-[12.5px] font-black mt-0.5 tracking-tight leading-none ${isPro ? 'text-white' : 'text-[#B45309]'}`}>Pro</span>
        </button>
      )}

      <button 
        onClick={() => { vibrateLight(); navigate('/more', { replace: true }); }}
        className={`flex flex-col items-center justify-center flex-1 mx-1 py-1.5 rounded-2xl relative transition-all active:scale-95 ${isMore ? 'bg-gradient-to-b from-[#A855F7] to-[#7C3AED] text-white shadow-[0_3px_0_0_#5B21B6]' : 'text-[#475569]'}`}
      >
        <MoreIcon active={isMore} />
        <span className="text-[12.5px] font-black mt-0.5 tracking-tight leading-none">More</span>
      </button>
    </div>
  );
};

export default BottomNavigation;
