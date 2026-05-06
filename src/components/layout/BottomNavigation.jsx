import React from 'react';

const HomeIcon = ({ active }) => (
  <svg className={`w-6 h-6 ${active ? 'text-[#2563EB]' : 'text-gray-400'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

const PracticeIcon = ({ active }) => (
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

const BottomNavigation = ({ activeTab, onTabChange }) => {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex justify-around items-center pb-safe pt-2 z-[2000] shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
      <button 
        onClick={() => onTabChange('home')}
        className={`flex flex-col items-center justify-center w-1/4 pb-2 relative transition-all ${activeTab === 'home' ? 'text-[#2563EB]' : 'text-gray-400'}`}
      >
        <HomeIcon active={activeTab === 'home'} />
        <span className="text-[10px] font-black mt-1">Home</span>
        {activeTab === 'home' && <div className="absolute top-[-8px] left-1/2 -translate-x-1/2 w-8 h-1 bg-[#2563EB] rounded-full" />}
      </button>

      <button 
        onClick={() => onTabChange('practice')}
        className={`flex flex-col items-center justify-center w-1/4 pb-2 relative transition-all ${activeTab === 'practice' ? 'text-[#2563EB]' : 'text-gray-400'}`}
      >
        <PracticeIcon active={activeTab === 'practice'} />
        <span className="text-[10px] font-black mt-1">Practice</span>
        {activeTab === 'practice' && <div className="absolute top-[-8px] left-1/2 -translate-x-1/2 w-8 h-1 bg-[#2563EB] rounded-full" />}
      </button>

      <button 
        onClick={() => onTabChange('ranks')}
        className={`flex flex-col items-center justify-center w-1/4 pb-2 relative transition-all ${activeTab === 'ranks' ? 'text-[#2563EB]' : 'text-gray-400'}`}
      >
        <RanksIcon active={activeTab === 'ranks'} />
        <span className="text-[10px] font-black mt-1">Ranks</span>
        {activeTab === 'ranks' && <div className="absolute top-[-8px] left-1/2 -translate-x-1/2 w-8 h-1 bg-[#2563EB] rounded-full" />}
      </button>

      <button 
        onClick={() => onTabChange('more')}
        className={`flex flex-col items-center justify-center w-1/4 pb-2 relative transition-all ${activeTab === 'more' ? 'text-[#2563EB]' : 'text-gray-400'}`}
      >
        <MoreIcon active={activeTab === 'more'} />
        <span className="text-[10px] font-black mt-1">More</span>
        {activeTab === 'more' && <div className="absolute top-[-8px] left-1/2 -translate-x-1/2 w-8 h-1 bg-[#2563EB] rounded-full" />}
      </button>
    </div>
  );
};

export default BottomNavigation;
