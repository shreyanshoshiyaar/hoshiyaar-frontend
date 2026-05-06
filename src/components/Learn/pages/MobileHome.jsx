import React from 'react';
import heroChar from '../../../assets/images/heroChar.png'; // Fallback image

const HexagonRankIcon = ({ rank }) => (
  <div className="relative w-12 h-12 flex items-center justify-center">
    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
      <polygon points="50 3, 93 25, 93 75, 50 97, 7 75, 7 25" fill="url(#hexGradient)" />
      <defs>
        <linearGradient id="hexGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#A855F7" />
          <stop offset="100%" stopColor="#7E22CE" />
        </linearGradient>
      </defs>
    </svg>
    <div className="absolute flex flex-col items-center justify-center text-white">
      <svg className="w-5 h-5 mb-0.5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z"/>
      </svg>
    </div>
  </div>
);

const MobileHome = ({ user, stars, weeklyStars, leaderboardData, onNavigateToPractice }) => {
  // Find current user rank
  const myRankData = leaderboardData?.find(d => d.userId === user?._id);
  const myRank = myRankData ? myRankData.rank : '-';
  const myStreak = 12; // Example placeholder, replace with actual if available

  return (
    <div className="w-full min-h-screen bg-[#F0F6FF] pb-32 font-sans overflow-y-auto">
      {/* Hero Section */}
      <div className="relative w-full pt-20 pb-16 px-6 overflow-hidden" style={{ background: 'linear-gradient(180deg, #E6F0FF 0%, #F0F6FF 100%)' }}>
        {/* Background stars/sparkles */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-10 right-10 text-yellow-400 text-xl animate-pulse">✨</div>
          <div className="absolute top-32 left-10 text-yellow-400 text-lg animate-pulse" style={{ animationDelay: '1s'}}>✨</div>
          <div className="absolute top-20 right-1/3 text-yellow-400 text-sm animate-pulse" style={{ animationDelay: '0.5s'}}>⭐</div>
        </div>

        {/* Text */}
        <div className="relative z-10 w-[60%] pt-4">
          <h1 className="text-3xl font-extrabold text-gray-900 leading-tight">
            Don't memorize <br/>
            <span className="text-blue-600">science.</span><br/>
            Solve it.<br/>
            Remember it.
          </h1>
        </div>

        {/* Characters Placeholder */}
        <div className="absolute bottom-0 right-[-20px] w-[65%] h-[80%] z-0 flex items-end justify-end">
          <img src={heroChar} alt="Characters" className="object-contain h-full w-full object-bottom" style={{ filter: 'drop-shadow(0 10px 15px rgba(0,0,0,0.2))' }} />
        </div>
      </div>

      <div className="px-5 -mt-8 relative z-20 flex flex-col gap-5">
        
        {/* Stats Row */}
        <div className="w-full bg-white rounded-3xl p-4 shadow-[0_8px_20px_rgba(0,0,0,0.04)] flex justify-between items-center border border-white/50 backdrop-blur-sm">
          {/* Rank */}
          <div className="flex items-center gap-3 w-1/3">
            <HexagonRankIcon rank={myRank} />
            <div className="flex flex-col">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Rank</span>
              <span className="text-xl font-black text-gray-800 leading-none">{myRank}</span>
              <div className="w-6 h-1 rounded-full bg-purple-500 mt-1"></div>
            </div>
          </div>
          
          <div className="w-px h-10 bg-gray-100"></div>

          {/* Stars */}
          <div className="flex items-center gap-2 w-1/3 justify-center">
            <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center text-2xl drop-shadow-sm">⭐</div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Stars</span>
              <span className="text-xl font-black text-gray-800 leading-none">{stars || 0}</span>
            </div>
          </div>

          <div className="w-px h-10 bg-gray-100"></div>

          {/* Streak */}
          <div className="flex items-center gap-2 w-1/3 justify-end pr-2">
            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center text-2xl drop-shadow-sm">🔥</div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Streak</span>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-black text-gray-800 leading-none">{myStreak}</span>
                <span className="text-xs font-bold text-gray-500">Days</span>
              </div>
            </div>
          </div>
        </div>

        {/* 2-Column Bento Grid */}
        <div className="grid grid-cols-12 gap-4">
          
          {/* Today's Mission (Left Col) */}
          <div className="col-span-7 bg-blue-500 rounded-3xl p-1 overflow-hidden relative shadow-lg h-full flex flex-col border border-blue-400">
            <div className="flex justify-center items-center py-2 text-white text-xs font-black tracking-widest uppercase">
              <span className="mr-1 text-yellow-300">⭐</span> TODAY'S MISSION <span className="ml-1 text-yellow-300">⭐</span>
            </div>
            
            <div className="bg-white rounded-[20px] p-4 flex-1 flex flex-col items-center justify-between relative shadow-inner">
              <h2 className="text-3xl font-black text-[#1A202C] tracking-tight relative">
                FAT
                <div className="absolute -right-3 -top-1 flex gap-0.5">
                  <div className="w-1 h-3 bg-yellow-400 rounded-full transform rotate-45"></div>
                  <div className="w-1 h-3 bg-yellow-400 rounded-full transform -rotate-45 mt-1"></div>
                </div>
              </h2>
              
              <div className="flex justify-between w-full mt-3 px-1">
                <div className="flex flex-col items-center">
                  <span className="text-[10px] font-bold text-gray-600">Store</span>
                  <div className="text-3xl mt-1 drop-shadow-md">🍯</div>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-[10px] font-bold text-gray-600">Cushion</span>
                  <div className="text-3xl mt-1 drop-shadow-md">🟦</div>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-[10px] font-bold text-gray-600">Insulate</span>
                  <div className="text-3xl mt-1 drop-shadow-md">🧥</div>
                </div>
              </div>

              {/* Character pointer */}
              <div className="mt-4 relative w-full h-24 flex items-center justify-center">
                 <img src={heroChar} className="h-32 object-contain absolute bottom-0 drop-shadow-xl" alt="Mission char" />
              </div>
              
              <button 
                onClick={onNavigateToPractice}
                className="w-full py-3 mt-4 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-full font-black text-sm shadow-[0_4px_0_0_#1E3A8A] active:translate-y-1 active:shadow-none flex items-center justify-center gap-2"
              >
                <div className="w-6 h-6 bg-white text-blue-600 rounded-full flex items-center justify-center pl-0.5 text-xs">▶</div>
                Let's Explore
                <div className="absolute right-4 flex flex-col gap-1 -mt-3">
                  <div className="w-1 h-2 bg-yellow-300 rounded-full rotate-12"></div>
                  <div className="w-1 h-2 bg-yellow-300 rounded-full -rotate-12 ml-2"></div>
                </div>
              </button>
            </div>
          </div>

          {/* Right Column Stack */}
          <div className="col-span-5 flex flex-col gap-4">
            
            {/* Calendar Card */}
            <div className="bg-[#F8F5FF] rounded-3xl p-4 shadow-sm border border-[#E9D8FF] flex flex-col items-center justify-center h-1/2 relative overflow-hidden">
              <div className="absolute top-2 left-2 text-[#C084FC] text-lg">✦</div>
              <div className="relative mb-2">
                <div className="text-5xl drop-shadow-md">📅</div>
                <div className="absolute -bottom-2 -right-2 text-2xl drop-shadow-md">⭐</div>
              </div>
              <p className="text-[#4A5568] font-bold text-center text-xs leading-tight">
                Fresh mysteries <br/>every
              </p>
              <div className="flex items-center gap-1 mt-1 text-[#8B5CF6] font-black text-sm">
                <span className="opacity-50">≥</span> Tues & Fri <span className="opacity-50">≤</span>
              </div>
            </div>

            {/* Social Card */}
            <div className="bg-[#F0F6FF] rounded-3xl p-3 shadow-sm border border-[#D6E4FF] flex flex-col items-center justify-center h-1/2">
              <h3 className="text-[#1E3A8A] font-black text-xs">Stay Connected</h3>
              <p className="text-[#4A5568] font-semibold text-[9px] mb-2">Watch & follow us</p>
              <div className="flex gap-2 w-full">
                <a href="https://www.instagram.com/hoshiyaar_club/" target="_blank" rel="noopener noreferrer" className="flex-1 bg-white rounded-xl p-2 flex flex-col items-center justify-center shadow-sm border border-gray-100">
                  <div className="w-8 h-8 rounded-[8px] bg-gradient-to-tr from-[#FD1D1D] via-[#E1306C] to-[#833AB4] flex items-center justify-center text-white mb-1 shadow-sm">
                    <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm3.98-10.169a1.44 1.44 0 11-2.88 0 1.44 1.44 0 012.88 0z"/></svg>
                  </div>
                  <span className="text-[8px] font-bold text-gray-600">Instagram</span>
                </a>
                <a href="https://www.youtube.com/@Hoshi-yaar" target="_blank" rel="noopener noreferrer" className="flex-1 bg-white rounded-xl p-2 flex flex-col items-center justify-center shadow-sm border border-gray-100">
                  <div className="w-8 h-8 rounded-[8px] bg-[#FF0000] flex items-center justify-center text-white mb-1 shadow-sm">
                    <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                  </div>
                  <span className="text-[8px] font-bold text-gray-600">YouTube</span>
                </a>
              </div>
            </div>

          </div>
        </div>

        {/* Leaderboard Section */}
        <div className="w-full flex justify-between items-center px-4 mt-2 mb-1">
          <div className="text-yellow-400 text-sm">⭐</div>
          <h2 className="text-xl font-black text-gray-900">Leaderboard</h2>
          <div className="text-yellow-400 text-sm">⭐</div>
        </div>

        {/* Dynamic Leaderboard Rank Cards */}
        <div className="flex gap-3 justify-center">
          {[
            { rank: 3, name: 'Uzzair', stars: 363, color: 'bg-purple-500', isMe: false },
            { rank: 4, name: 'You', stars: 363, color: 'bg-blue-500', isMe: true },
            { rank: 5, name: 'Akshit', stars: 363, color: 'bg-indigo-500', isMe: false }
          ].map((lb, i) => (
            <div key={i} className={`flex-1 rounded-[24px] p-3 flex flex-col items-center justify-center relative shadow-sm border ${lb.isMe ? 'border-blue-500 border-2 bg-[#F0F7FF] shadow-md' : 'border-gray-200 bg-[#F9FAFB]'}`}>
              {/* Rank Badge */}
              <div className={`absolute -top-3 -left-1 w-7 h-7 rounded-full text-white font-black flex items-center justify-center text-xs shadow-md ${lb.color}`}>
                {lb.rank}
              </div>
              <div className={`font-black mt-2 text-sm ${lb.isMe ? 'text-blue-600 text-lg' : 'text-gray-800'}`}>
                {lb.name}
              </div>
              <div className="flex items-center gap-1 mt-1 bg-white rounded-full px-2 py-0.5 shadow-[0_2px_4px_rgba(0,0,0,0.05)]">
                <span className="text-sm drop-shadow-sm">⭐</span>
                <span className="text-xs font-bold text-gray-700">{lb.stars}</span>
              </div>
            </div>
          ))}
        </div>

      </div>

      {/* Sticky Bottom CTA */}
      <div className="fixed bottom-[80px] left-0 right-0 px-5 z-[100] pb-2 pt-6 bg-gradient-to-t from-[#F0F6FF] to-transparent pointer-events-none">
        <button 
          onClick={onNavigateToPractice}
          className="w-full py-4 bg-[#FFC107] hover:bg-[#FFD54F] text-gray-900 rounded-full font-black text-lg shadow-[0_6px_0_0_#F57F17] active:translate-y-1.5 active:shadow-none flex items-center justify-center gap-3 transition-all pointer-events-auto"
        >
          <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm">
             <span className="text-blue-600 text-sm ml-0.5">▶</span>
          </div>
          Continue Your Adventure
          <span className="ml-2 text-xl font-bold">›</span>
        </button>
      </div>
    </div>
  );
};

export default MobileHome;
