import React from 'react';
import heroChar from '../../assets/images/heroChar.png';
import NetworkError from '../ui/NetworkError.jsx';

const MobileLeaderboard = ({ 
  user, 
  leaderboardData, 
  leaderboardLoading, 
  leaderboardError,
  leaderboardTimeframe, 
  setLeaderboardTimeframe,
  leaderboardMetric,
  setLeaderboardMetric,
  leaderboardScope,
  setLeaderboardScope,
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
  streak,
  onNavigateToPractice
}) => {
  const myEntry = leaderboardData?.find(e => e.username === user?.username);
  const currentRank = myEntry ? (leaderboardData.indexOf(myEntry) + 1) : '-';
  const currentStreak = streak || 1;

  return (
    <div className="fixed inset-0 bg-white overflow-y-auto no-scrollbar pb-32">
      {/* Full Width Hero Banner with Logo Overlay */}
      <div className="relative w-full overflow-hidden">
        <img 
          src="https://res.cloudinary.com/w7rytq0k/image/upload/v1785322534/img-to-link/r2bkh4ou7qxpl8nsekj6.webp" 
          alt="Rank Banner" 
          className="w-full h-auto object-cover"
        />
        
        {/* Logo Overlay */}
        <div className="absolute top-0 left-0 right-0 z-20 px-6 pt-5 flex items-center justify-between w-full">
          <div className="flex items-center">
            <img 
              src="https://res.cloudinary.com/w7rytq0k/image/upload/v1785322514/img-to-link/bihseec7aigbmau4amnd.png" 
              alt="HoshiYaar Logo" 
              className="h-9 w-auto drop-shadow-sm" 
            />
          </div>
        </div>
      </div>      {/* 2. Stats Ribbon (Floating) */}
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
               <span className="text-[16px] font-black text-gray-800 leading-none">{stars || 0}</span>
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

        {/* Leaderboard Scope Toggle */}
        <div className="flex bg-gray-100 p-1 rounded-2xl mb-4 mx-1">
          <button 
            onClick={() => {
              setLeaderboardScope('school');
              fetchLeaderboard(user?.school, null, 'school');
            }}
            className={`flex-1 py-2.5 rounded-xl text-[12px] font-black transition-all ${leaderboardScope === 'school' ? 'bg-white text-[#2563EB] shadow-sm' : 'text-gray-400'}`}
          >
            🏫 My School
          </button>
          <button 
            onClick={() => {
              setLeaderboardScope('global');
              fetchLeaderboard(null, null, 'global');
            }}
            className={`flex-1 py-2.5 rounded-xl text-[12px] font-black transition-all ${leaderboardScope === 'global' ? 'bg-white text-[#2563EB] shadow-sm' : 'text-gray-400'}`}
          >
            🌎 All Users
          </button>
        </div>

        {/* School Card (Blue) - Only show in School Scope */}
        {leaderboardScope === 'school' && (
          <div className="mb-3">
            {!isChangingSchool ? (
              <div className="bg-[#1E65FA] rounded-[18px] p-3 shadow-[0_6px_15px_-5px_rgba(30,101,250,0.3)] flex justify-between items-center border border-white/20 gap-2">
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center text-white shrink-0">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
                      <path d="M6 6h10" />
                      <path d="M6 10h10" />
                      <path d="M6 14h10" />
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[9px] font-extrabold text-blue-100 uppercase tracking-widest leading-none mb-0.5">Current School</p>
                    <h2 className="text-white font-black text-xs sm:text-sm tracking-tight truncate">{user?.school || "Select your school"}</h2>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    setLeaderboardSchool('');
                    setIsChangingSchool(true);
                    setShowSuggestions(true);
                  }}
                  className="flex items-center shrink-0 gap-1.5 px-3 py-1.5 bg-white border border-blue-100 rounded-xl text-[#2563EB] text-[11px] font-black shadow-sm active:scale-95 transition-all cursor-pointer"
                >
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
                  </svg>
                  <span>{user?.school ? "Change" : "Add"}</span>
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-3 border-2 border-blue-200 shadow-lg flex flex-col gap-2 animate-in slide-in-from-top-2 duration-200">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-black text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <circle cx="11" cy="11" r="8" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                    Find Your School
                  </span>
                  <button 
                    type="button" 
                    onClick={() => {
                      setIsChangingSchool(false);
                      setShowSuggestions(false);
                    }} 
                    className="text-[11px] font-bold text-gray-500 hover:text-gray-800 px-2 py-0.5 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    Cancel
                  </button>
                </div>

                <div className="relative w-full">
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      autoFocus
                      placeholder="Type school or area name..."
                      className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-blue-100 focus:border-blue-500 outline-none font-bold text-xs text-gray-800 shadow-inner bg-slate-50"
                      value={leaderboardSchool}
                      onChange={(e) => {
                        setLeaderboardSchool(e.target.value);
                        setShowSuggestions(true);
                      }}
                      onFocus={() => setShowSuggestions(true)}
                    />
                    <div className="absolute left-3 text-gray-400 pointer-events-none">
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <circle cx="11" cy="11" r="8" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                      </svg>
                    </div>
                    {leaderboardSchool && (
                      <button
                        type="button"
                        onClick={() => setLeaderboardSchool('')}
                        className="absolute right-2.5 text-gray-400 hover:text-gray-600 p-1"
                      >
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    )}
                  </div>

                  {showSuggestions && leaderboardSchool.trim().length >= 2 && (
                    <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl shadow-2xl border border-blue-100 z-[100] max-h-48 overflow-y-auto no-scrollbar divide-y divide-gray-50">
                      {schoolSuggestions.length > 0 ? (
                        schoolSuggestions.map((s, i) => (
                          <div 
                            key={i} 
                            className="px-3.5 py-2.5 hover:bg-blue-50 font-bold text-xs text-gray-700 hover:text-blue-900 cursor-pointer flex items-start gap-2.5 transition-colors"
                            onClick={() => {
                              handleLeaderboardSearch(null, s);
                              setIsChangingSchool(false);
                            }}
                          >
                            <div className="w-5 h-5 rounded-md bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                                <circle cx="12" cy="9" r="2.5" />
                              </svg>
                            </div>
                            <span className="line-clamp-2 leading-relaxed">{s}</span>
                          </div>
                        ))
                      ) : (
                        <div className="px-3 py-3 text-center text-xs font-semibold text-gray-400">
                          No schools found.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Metric Filters */}
        <div className="flex gap-2 mb-2 px-1">
          <button 
            onClick={() => {
              setLeaderboardMetric('points');
              const school = leaderboardScope === 'global' ? null : (user?.school);
              fetchLeaderboard(school, leaderboardTimeframe, leaderboardScope, 'points');
            }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${leaderboardMetric === 'points' ? 'bg-orange-500 text-white shadow-md' : 'bg-gray-100 text-gray-500'}`}
          >
            ⭐ Points
          </button>
          <button 
             onClick={() => {
               setLeaderboardMetric('streak');
               const school = leaderboardScope === 'global' ? null : (user?.school);
               fetchLeaderboard(school, leaderboardTimeframe, leaderboardScope, 'streak');
             }}
             className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${leaderboardMetric === 'streak' ? 'bg-orange-500 text-white shadow-md' : 'bg-gray-100 text-gray-500'}`}
          >
            🔥 Streaks
          </button>
        </div>

        {/* Time Filters */}
        {leaderboardMetric === 'points' && (
          <div className="flex gap-2 mb-4 px-1">
            <button 
              onClick={() => {
                setLeaderboardTimeframe('weekly');
                const school = leaderboardScope === 'global' ? null : (user?.school);
                fetchLeaderboard(school, 'weekly', leaderboardScope, leaderboardMetric);
              }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[10px] font-black transition-all ${leaderboardTimeframe === 'weekly' ? 'bg-[#2563EB] text-white shadow-md' : 'bg-gray-100 text-gray-500'}`}
            >
              📅 Week
            </button>
            <button 
               onClick={() => {
                 setLeaderboardTimeframe('total');
                 const school = leaderboardScope === 'global' ? null : (user?.school);
                 fetchLeaderboard(school, 'total', leaderboardScope, leaderboardMetric);
               }}
               className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[10px] font-black transition-all ${leaderboardTimeframe === 'total' ? 'bg-[#2563EB] text-white shadow-md' : 'bg-gray-100 text-gray-500'}`}
            >
              📊 All Time
            </button>
          </div>
        )}

        {/* Ranking List */}
        <div className="space-y-2 px-1">
          {leaderboardError ? (
            <div className="py-8">
              <NetworkError />
            </div>
          ) : leaderboardLoading ? (
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
                    

                    
                    <div className="flex flex-col min-w-0">
                      <span className={`text-[13px] font-black truncate ${isMe ? 'text-[#1E40AF]' : 'text-gray-800'}`}>
                        {isMe ? 'You' : (entry.username || entry.name)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                      <span className="text-[13px] font-black text-gray-800 tracking-tight">
                        {leaderboardMetric === 'streak' ? (entry.currentStreak || 0) : (entry.totalPoints?.toLocaleString() || 0)}
                      </span>
                      <span className={`text-[12px] drop-shadow-sm ${leaderboardMetric === 'streak' ? 'text-orange-500' : 'text-yellow-400'}`}>
                        {leaderboardMetric === 'streak' ? '🔥' : '⭐'}
                      </span>
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

export default React.memo(MobileLeaderboard);
