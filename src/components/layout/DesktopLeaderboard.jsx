import React from 'react';
import heroChar from '../../assets/images/heroChar.png';
import NetworkError from '../ui/NetworkError.jsx';

const DesktopLeaderboard = ({ 
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
    <div className="w-full min-h-full bg-[#F8FAFC] flex flex-col items-center overflow-y-auto no-scrollbar p-4 lg:p-6 relative">
      <div className="w-full max-w-5xl flex flex-col min-h-full gap-4">
        
        {/* Leaderboard Banner */}
        <div
          className="relative w-full rounded-3xl overflow-hidden shadow-md border border-white/60 shrink-0 lg:h-[24vh] max-h-[240px] min-h-[160px]"
          style={{
            backgroundImage: 'url("https://res.cloudinary.com/w7rytq0k/image/upload/v1785322525/img-to-link/sefmi9byh6dln0bcmonm.jpg")',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
          }}
        />

        {/* User Stats Row - compact */}
        <div className="flex gap-2 shrink-0">
          <div className="bg-white rounded-xl px-3 py-2 shadow-sm border border-gray-100 flex items-center gap-2 hover:shadow-md transition-shadow flex-1">
            <div className="w-7 h-7 bg-blue-100 rounded-lg flex items-center justify-center text-sm shadow-inner border border-blue-200 shrink-0">👑</div>
            <div className="flex flex-col">
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest leading-none">Rank</span>
              <span className="text-base font-black text-gray-800 leading-none mt-0.5">{currentRank}</span>
            </div>
          </div>
          <div className="bg-white rounded-xl px-3 py-2 shadow-sm border border-gray-100 flex items-center gap-2 hover:shadow-md transition-shadow flex-1">
            <div className="w-7 h-7 bg-yellow-100 rounded-lg flex items-center justify-center text-sm shadow-inner border border-yellow-200 shrink-0">⭐</div>
            <div className="flex flex-col">
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest leading-none">Stars</span>
              <span className="text-base font-black text-gray-800 leading-none mt-0.5">{stars || 0}</span>
            </div>
          </div>
          <div className="bg-white rounded-xl px-3 py-2 shadow-sm border border-gray-100 flex items-center gap-2 hover:shadow-md transition-shadow flex-1">
            <div className="w-7 h-7 bg-orange-100 rounded-lg flex items-center justify-center text-sm shadow-inner border border-orange-200 shrink-0">🔥</div>
            <div className="flex flex-col">
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest leading-none">Streak</span>
              <div className="flex items-baseline gap-0.5 mt-0.5">
                <span className="text-base font-black text-gray-800 leading-none">{currentStreak}</span>
                <span className="text-[9px] font-bold text-gray-500 uppercase">d</span>
              </div>
            </div>
          </div>
        </div>

        {/* Leaderboard Scope Settings */}
        {leaderboardScope === 'school' && (
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-blue-100 flex flex-col gap-3 shrink-0 transition-all">
            {!isChangingSchool ? (
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 shrink-0 border border-blue-100">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
                      <path d="M6 6h10" />
                      <path d="M6 10h10" />
                      <path d="M6 14h10" />
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Current School</p>
                    <h2 className="text-sm font-extrabold text-blue-900 truncate" title={user?.school || "No school selected"}>
                      {user?.school || "No school selected"}
                    </h2>
                  </div>
                </div>

                <button 
                  onClick={() => {
                    setLeaderboardSchool('');
                    setIsChangingSchool(true);
                    setShowSuggestions(true);
                  }}
                  className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-[#2563EB] font-black rounded-xl text-xs transition-all border border-blue-200 cursor-pointer shrink-0 flex items-center gap-1.5 shadow-sm active:scale-95 self-end sm:self-auto"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
                  </svg>
                  <span>{user?.school ? "Change School" : "Add School"}</span>
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2 w-full animate-in fade-in duration-200">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-xs font-black text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <circle cx="11" cy="11" r="8" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                    Search & Select School
                  </span>
                  <button 
                    type="button" 
                    onClick={() => {
                      setIsChangingSchool(false);
                      setShowSuggestions(false);
                    }} 
                    className="text-xs font-bold text-gray-500 hover:text-gray-800 px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>

                <div className="relative w-full">
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      autoFocus
                      placeholder="Type school name or locality..."
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl border-2 border-blue-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none font-bold text-xs sm:text-sm text-gray-800 transition-all bg-white"
                      value={leaderboardSchool}
                      onChange={(e) => {
                        setLeaderboardSchool(e.target.value);
                        setShowSuggestions(true);
                      }}
                      onFocus={() => setShowSuggestions(true)}
                    />
                    <div className="absolute left-3.5 text-gray-400 pointer-events-none">
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <circle cx="11" cy="11" r="8" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                      </svg>
                    </div>
                    {leaderboardSchool && (
                      <button
                        type="button"
                        onClick={() => setLeaderboardSchool('')}
                        className="absolute right-3 text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
                      >
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    )}
                  </div>

                  {showSuggestions && leaderboardSchool.trim().length >= 2 && (
                    <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl shadow-2xl border border-blue-100 z-[100] max-h-60 overflow-y-auto no-scrollbar divide-y divide-gray-100">
                      {schoolSuggestions.length > 0 ? (
                        schoolSuggestions.map((s, i) => (
                          <div 
                            key={i} 
                            className="px-4 py-3 hover:bg-blue-50 font-bold text-xs text-gray-700 hover:text-blue-900 cursor-pointer flex items-start gap-3 transition-colors group"
                            onClick={() => {
                              handleLeaderboardSearch(null, s);
                              setIsChangingSchool(false);
                            }}
                          >
                            <div className="w-6 h-6 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-blue-200">
                              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                                <circle cx="12" cy="9" r="2.5" />
                              </svg>
                            </div>
                            <span className="line-clamp-2 leading-relaxed">{s}</span>
                          </div>
                        ))
                      ) : (
                        <div className="px-4 py-4 text-center text-xs font-semibold text-gray-400">
                          No schools found. Try typing another keyword.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Main Leaderboard Table Container */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col">
          {/* Table Header / Time Filters */}
          <div className="flex flex-col sm:flex-row justify-between items-center p-4 border-b border-gray-50 gap-3 bg-gray-50/50 shrink-0">
             <h3 className="text-sm font-black text-gray-800 uppercase tracking-wider hidden sm:block">Rankings</h3>
             <div className="flex gap-2 w-full sm:w-auto overflow-x-auto no-scrollbar">
               <div className="flex bg-white p-1 rounded-xl border border-gray-200 shrink-0">
                <button 
                  onClick={() => {
                    setLeaderboardScope('school');
                    fetchLeaderboard(user?.school, null, 'school');
                  }}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${leaderboardScope === 'school' ? 'bg-[#2563EB] text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  🏫 My School
                </button>
                <button 
                  onClick={() => {
                    setLeaderboardScope('global');
                    fetchLeaderboard(null, null, 'global');
                  }}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${leaderboardScope === 'global' ? 'bg-[#2563EB] text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  🌎 Global
                </button>
              </div>

              <div className="flex bg-white p-1 rounded-xl border border-gray-200 shrink-0">
                <button 
                  onClick={() => {
                    setLeaderboardMetric('points');
                    const school = leaderboardScope === 'global' ? null : (user?.school);
                    fetchLeaderboard(school, leaderboardTimeframe, leaderboardScope, 'points');
                  }}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${leaderboardMetric === 'points' ? 'bg-orange-500 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  ⭐ Points
                </button>
                <button 
                  onClick={() => {
                    setLeaderboardMetric('streak');
                    const school = leaderboardScope === 'global' ? null : (user?.school);
                    fetchLeaderboard(school, leaderboardTimeframe, leaderboardScope, 'streak');
                  }}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${leaderboardMetric === 'streak' ? 'bg-orange-500 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  🔥 Streaks
                </button>
              </div>
              
              {leaderboardMetric === 'points' && (
                <div className="flex bg-white p-1 rounded-xl border border-gray-200 shrink-0">
                  <button 
                    onClick={() => {
                      setLeaderboardTimeframe('weekly');
                      const school = leaderboardScope === 'global' ? null : (user?.school);
                      fetchLeaderboard(school, 'weekly', leaderboardScope, leaderboardMetric);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${leaderboardTimeframe === 'weekly' ? 'bg-[#2563EB] text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    This Week
                  </button>
                  <button 
                    onClick={() => {
                      setLeaderboardTimeframe('total');
                      const school = leaderboardScope === 'global' ? null : (user?.school);
                      fetchLeaderboard(school, 'total', leaderboardScope, leaderboardMetric);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${leaderboardTimeframe === 'total' ? 'bg-[#2563EB] text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    All Time
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Table Body */}
          <div className="p-2 md:p-4 min-h-[300px]">
            {leaderboardError ? (
              <div className="flex flex-col items-center justify-center h-full gap-3 py-10">
                <NetworkError />
              </div>
            ) : leaderboardLoading ? (
              <div className="flex flex-col items-center justify-center h-full gap-3 py-10">
                <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                <span className="font-bold text-xs text-gray-500 uppercase tracking-widest">Loading rankings...</span>
              </div>
            ) : leaderboardData.length > 0 ? (
              <div className="space-y-2">
                {/* Table Headers */}
                <div className="flex items-center px-4 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 mb-2">
                  <div className="w-12">Rank</div>
                  <div className="flex-1">Student</div>
                  <div className="w-24 text-right">{leaderboardMetric === 'streak' ? 'Streak' : 'Stars'}</div>
                </div>

                {leaderboardData.map((entry, i) => {
                  const isMe = entry.username === user?.username;
                  const rank = i + 1;
                  
                  return (
                    <div 
                      key={i} 
                      className={`flex items-center px-4 py-2 rounded-xl transition-all ${
                        isMe ? 'bg-blue-50 border border-blue-200 shadow-sm' : 'hover:bg-gray-50 border border-transparent'
                      }`}
                    >
                      <div className="w-12 flex items-center">
                        <div className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-black ${
                            rank === 1 ? 'bg-yellow-400 text-white shadow-sm' : 
                            rank === 2 ? 'bg-gray-300 text-white shadow-sm' : 
                            rank === 3 ? 'bg-orange-400 text-white shadow-sm' : 
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {rank}
                        </div>
                      </div>
                      
                      <div className="flex-1 flex items-center gap-3">
                        <span className={`text-sm font-black truncate ${isMe ? 'text-blue-700' : 'text-gray-800'}`}>
                          {isMe ? 'You' : (entry.username || entry.name)}
                        </span>
                      </div>
                      
                      <div className="w-24 flex items-center justify-end gap-1.5">
                        <span className="text-sm font-black text-gray-800">
                          {leaderboardMetric === 'streak' ? (entry.currentStreak || 0) : (entry.totalPoints?.toLocaleString() || 0)}
                        </span>
                        <span className={`text-sm drop-shadow-sm ${leaderboardMetric === 'streak' ? 'text-orange-500' : 'text-yellow-400'}`}>
                          {leaderboardMetric === 'streak' ? '🔥' : '⭐'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                 <div className="text-4xl mb-2 opacity-50">🏆</div>
                 <p className="font-bold text-sm">No rankings found in this category.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default React.memo(DesktopLeaderboard);
