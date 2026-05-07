import React from 'react';
import heroChar from '../../assets/images/heroChar.png';

const MobileLeaderboard = ({ 
  user, 
  leaderboardData, 
  leaderboardLoading, 
  leaderboardTimeframe, 
  setLeaderboardTimeframe, 
  isChangingSchool, 
  setIsChangingSchool,
  leaderboardSchool,
  setLeaderboardSchool,
  handleLeaderboardSearch,
  schoolSuggestions,
  showSuggestions,
  setShowSuggestions,
  isManualSchoolInput,
  setIsManualSchoolInput,
  fetchLeaderboard,
  stars,
  weeklyStars,
  onNavigateToPractice
}) => {
  const currentRank = 7; 
  const currentStreak = 12; 

  return (
    <div className="fixed inset-0 bg-white overflow-y-auto no-scrollbar pb-32">
      {/* 1. Hero Section - Today's Rank Booster */}
      <div className="relative bg-[#F3E8FF] pt-2 pb-2 px-6 overflow-hidden">
        {/* Transparent Header Inside Hero */}
        <div className="flex items-center justify-between w-full z-20 mb-[26px] mt-1">
          <div className="flex items-center">
            <img 
              src="https://res.cloudinary.com/dcxlzfyfp/image/upload/v1777997560/img-to-link/mfaw5t09dlayxlunzfas.png" 
              alt="HoshiYaar Logo" 
              className="h-9 w-auto drop-shadow-sm" 
            />
          </div>
          <div className="w-9 h-9"></div> {/* Bell removed */}
        </div>

        {/* Subtle Background Elements */}
        <div className="absolute top-2 right-8 text-purple-300/30 text-2xl">✦</div>
        <div className="absolute bottom-6 right-4 text-purple-300/20 text-3xl">⚗️</div>
        
        <div className="flex items-center gap-4 relative z-10">
          {/* Character */}
          <div className="w-20 h-20 relative flex-shrink-0">
             <img 
               src={heroChar} 
               className="w-full h-full object-contain drop-shadow-xl scale-125 origin-bottom" 
               alt="Character"
             />
             <div className="absolute bottom-2 left-0 bg-yellow-400 text-white rounded-full w-5 h-5 flex items-center justify-center text-[8px] shadow-md border-2 border-white">👍</div>
          </div>

          <div className="flex flex-col">
            <h1 className="text-[16px] font-black text-[#5829D1] leading-tight mb-0.5">Today's Rank Booster</h1>
            <p className="text-[11px] font-bold text-gray-500 mb-2 leading-tight">
              Complete 3 science quests and earn <span className="text-[#5829D1] font-extrabold">+150 XP</span>
            </p>
            <button className="bg-[#6D28D9] text-white px-4 py-2 rounded-full text-[12px] font-black shadow-[0_3px_0_0_#4C1D95] active:translate-y-0.5 active:shadow-none transition-all flex items-center justify-center gap-2 w-fit group">
              Start Challenge 
              <span className="text-lg transform group-hover:translate-x-1 transition-transform">›</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Stats Ribbon (Floating) */}
      <div className="px-6 -mt-5 relative z-20">
        <div className="bg-white rounded-[16px] p-2.5 shadow-[0_8px_25px_-5px_rgba(0,0,0,0.08)] flex justify-around items-center border border-gray-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-b from-[#A855F7] to-[#7E22CE] rounded-lg flex items-center justify-center shadow-md transform -rotate-3 border border-white/20">
               <span className="text-white text-sm">👑</span>
            </div>
            <div className="flex flex-col">
               <span className="text-[8px] font-bold text-gray-400 uppercase tracking-tighter">Rank</span>
               <span className="text-[16px] font-black text-gray-800 leading-none">{currentRank}</span>
            </div>
          </div>
          <div className="w-px h-5 bg-gray-100"></div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 flex items-center justify-center transform hover:scale-110 transition-transform">
               <span className="text-2xl drop-shadow-sm">⭐</span>
            </div>
            <div className="flex flex-col">
               <span className="text-[8px] font-bold text-gray-400 uppercase tracking-tighter">Stars</span>
               <span className="text-[16px] font-black text-gray-800 leading-none">{stars || 363}</span>
            </div>
          </div>
          <div className="w-px h-5 bg-gray-100"></div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 flex items-center justify-center">
               <span className="text-2xl drop-shadow-sm">🔥</span>
            </div>
            <div className="flex flex-col">
               <span className="text-[8px] font-bold text-gray-400 uppercase tracking-tighter">Streak</span>
               <div className="flex items-baseline gap-0.5">
                 <span className="text-[16px] font-black text-gray-800 leading-none">{currentStreak}</span>
                 <span className="text-[8px] font-bold text-gray-500 uppercase">Days</span>
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Main Content Container */}
      <div className="mt-3 px-4 pb-8 bg-white">
        {/* Simple Leaderboard Title */}
        <div className="flex items-center justify-center gap-2 mb-2">
           <span className="text-yellow-400 text-base">★</span>
           <h2 className="text-[14px] font-black text-[#2563EB] uppercase tracking-[0.2em]">Leaderboard</h2>
           <span className="text-yellow-400 text-base">★</span>
        </div>

        {/* School Card (Blue) */}
        <div className="bg-[#1E65FA] rounded-[16px] p-2.5 shadow-[0_6px_15px_-5px_rgba(30,101,250,0.3)] mb-3 flex justify-between items-center border border-white/20 gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center text-base shrink-0">🏫</div>
            <div className="w-px h-6 bg-white/20 shrink-0"></div>
            <h2 className="text-white font-black text-[14px] tracking-tight truncate">{user?.school || "Don Bosco Borivali"}</h2>
          </div>
          <button 
            onClick={() => setIsChangingSchool(!isChangingSchool)}
            className="flex items-center shrink-0 gap-1 px-2 py-1 bg-white border border-blue-100 rounded-lg text-[#2563EB] text-[10px] font-black shadow-sm active:scale-95 transition-all"
          >
            <span className="text-xs">🔄</span> Change
          </button>
        </div>

        {/* Change School Form */}
        {isChangingSchool && (
          <form 
            onSubmit={handleLeaderboardSearch} 
            className="mb-5 flex gap-2 animate-in slide-in-from-top-2 duration-300 px-1"
          >
            <div className="relative flex-grow">
              <input
                type="text"
                placeholder="Find your school..."
                className="w-full px-4 py-3 rounded-xl border-2 border-blue-100 focus:border-blue-500 outline-none font-bold text-sm shadow-inner"
                value={leaderboardSchool}
                onChange={(e) => {
                  setLeaderboardSchool(e.target.value);
                  setShowSuggestions(true);
                }}
              />
              {showSuggestions && schoolSuggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-xl shadow-2xl border border-blue-100 z-[100] max-h-48 overflow-y-auto no-scrollbar">
                  {schoolSuggestions.map((s, i) => (
                    <div 
                      key={i} 
                      className="px-4 py-3 border-b border-gray-50 last:border-0 hover:bg-blue-50 font-bold text-xs text-gray-700"
                      onClick={() => {
                        setLeaderboardSchool(s);
                        setShowSuggestions(false);
                        fetchLeaderboard(s);
                      }}
                    >
                      {s}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <button className="bg-blue-600 text-white px-4 rounded-xl font-black text-xs shadow-lg">JOIN</button>
          </form>
        )}

        {/* Time Filters */}
        <div className="flex gap-2 mb-4 px-1">
          <button 
            onClick={() => setLeaderboardTimeframe('weekly')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[10px] font-black transition-all ${leaderboardTimeframe === 'weekly' ? 'bg-[#2563EB] text-white shadow-md' : 'bg-gray-100 text-gray-500'}`}
          >
            📅 Week
          </button>
          {/* Month removed */}
          <button 
             onClick={() => setLeaderboardTimeframe('total')}
             className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[10px] font-black transition-all ${leaderboardTimeframe === 'total' ? 'bg-[#2563EB] text-white shadow-md' : 'bg-gray-100 text-gray-500'}`}
          >
            📊 All Time
          </button>
        </div>

        {/* Ranking List */}
        <div className="space-y-2 px-1">
          {leaderboardLoading ? (
            <div className="flex flex-col items-center py-8 gap-3">
              <div className="w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
              <span className="text-[11px] font-black text-blue-900">UPDATING...</span>
            </div>
          ) : leaderboardData.length > 0 ? (
            leaderboardData.map((entry, i) => {
              const isMe = entry.username === user?.username;
              const rank = i + 1;
              
              return (
                <div 
                  key={i} 
                  className={`flex items-center justify-between p-2 rounded-[16px] border transition-all ${
                    isMe ? 'bg-[#F0F7FF] border-[#2563EB] shadow-sm' : 'bg-white border-transparent hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="relative shrink-0">
                       <div className={`w-7 h-7 flex items-center justify-center rounded-full text-[10px] font-black ${
                         rank === 1 ? 'bg-yellow-400 text-white shadow-sm' : 
                         rank === 2 ? 'bg-gray-300 text-white shadow-sm' : 
                         rank === 3 ? 'bg-orange-400 text-white shadow-sm' : 
                         'text-gray-400 font-bold'
                       }`}>
                         {rank}
                       </div>
                    </div>
                    

                    
                    <span className={`text-[13px] font-black truncate ${isMe ? 'text-[#1E40AF]' : 'text-gray-800'}`}>
                      {isMe ? 'You' : (entry.name || entry.username)}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-1 shrink-0 px-2 py-0.5 bg-white rounded-lg shadow-sm border border-gray-100">
                    <span className="text-[12px] font-black text-gray-700">{entry.totalPoints?.toLocaleString() || 0}</span>
                    <span className="text-yellow-400 text-sm">★</span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-10 opacity-30">
               <div className="text-4xl mb-3">🏆</div>
               <p className="font-black text-blue-900 uppercase text-[10px]">No rankings found</p>
            </div>
          )}
        </div>
      </div>

      {/* 4. Sticky Footer CTA */}
      <div className="fixed bottom-[80px] left-0 right-0 px-10 pb-4 bg-gradient-to-t from-white via-white/95 to-transparent pointer-events-none z-[100]">
        <button 
          onClick={onNavigateToPractice}
          className="w-full py-2.5 bg-[#FFC107] hover:bg-[#FFD54F] text-gray-900 rounded-full font-black text-[14px] shadow-[0_4px_0_0_#F57F17] active:translate-y-1 active:shadow-none flex items-center justify-center gap-2 transition-all pointer-events-auto group"
        >
          <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform shrink-0">
             <span className="text-[#2563EB] text-[10px] ml-0.5">▶</span>
          </div>
          Continue Your Adventure
          <span className="text-lg font-bold ml-1">›</span>
        </button>
      </div>
    </div>
  );
};

export default MobileLeaderboard;
