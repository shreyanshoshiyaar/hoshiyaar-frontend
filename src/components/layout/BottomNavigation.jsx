import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const HomeIcon = ({ active }) => (
  <svg className={`w-6 h-6 ${active ? 'text-[#2563EB]' : 'text-gray-400'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

const LearnIcon = ({ active }) => (
  <svg className={`w-6 h-6 ${active ? 'text-[#2563EB]' : 'text-gray-400'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" />
  </svg>
);

const RanksIcon = ({ active }) => (
  <svg className={`w-6 h-6 ${active ? 'text-[#2563EB]' : 'text-gray-400'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
    <path d="M4 22h16" />
    <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
    <rect x="6" y="4" width="12" height="10" rx="2" />
  </svg>
);

const MoreIcon = ({ active }) => (
  <svg className={`w-6 h-6 ${active ? 'text-[#2563EB]' : 'text-gray-400'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);

const BottomNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const path = location.pathname;

  const isHome = path === '/home';
  const isLearn = path === '/learn';
  const isRanks = path === '/ranks';
  const isMore = path === '/more';

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex justify-around items-center pb-safe pt-2 z-[2000] shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
      <button 
        onClick={() => navigate('/home', { replace: true })}
        className={`flex flex-col items-center justify-center w-1/4 pb-2 relative transition-all ${isHome ? 'text-[#2563EB]' : 'text-gray-400'}`}
      >
        <HomeIcon active={isHome} />
        <span className="text-[10px] font-black mt-1">Home</span>
        {isHome && <div className="absolute top-[-8px] left-1/2 -translate-x-1/2 w-8 h-1 bg-[#2563EB] rounded-full" />}
      </button>

      <button 
        onClick={() => navigate('/learn', { replace: true })}
        className={`flex flex-col items-center justify-center w-1/4 pb-2 relative transition-all ${isLearn ? 'text-[#2563EB]' : 'text-gray-400'}`}
      >
        <LearnIcon active={isLearn} />
        <span className="text-[10px] font-black mt-1">Learn</span>
        {isLearn && <div className="absolute top-[-8px] left-1/2 -translate-x-1/2 w-8 h-1 bg-[#2563EB] rounded-full" />}
      </button>

      <button 
        onClick={() => navigate('/ranks', { replace: true })}
        className={`flex flex-col items-center justify-center w-1/4 pb-2 relative transition-all ${isRanks ? 'text-[#2563EB]' : 'text-gray-400'}`}
      >
        <RanksIcon active={isRanks} />
        <span className="text-[10px] font-black mt-1">Ranks</span>
        {isRanks && <div className="absolute top-[-8px] left-1/2 -translate-x-1/2 w-8 h-1 bg-[#2563EB] rounded-full" />}
      </button>

      <button 
        onClick={() => navigate('/more', { replace: true })}
        className={`flex flex-col items-center justify-center w-1/4 pb-2 relative transition-all ${isMore ? 'text-[#2563EB]' : 'text-gray-400'}`}
      >
        <MoreIcon active={isMore} />
        <span className="text-[10px] font-black mt-1">More</span>
        {isMore && <div className="absolute top-[-8px] left-1/2 -translate-x-1/2 w-8 h-1 bg-[#2563EB] rounded-full" />}
      </button>
    </div>
  );
};

export default BottomNavigation;
