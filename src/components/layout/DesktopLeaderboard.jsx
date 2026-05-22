import React from 'react';
import heroChar from '../../assets/images/heroChar.png';

const DesktopLeaderboard = ({ 
  user, 
  leaderboardData, 
  leaderboardLoading, 
  leaderboardTimeframe, 
  setLeaderboardTimeframe, 
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
            backgroundImage: 'url("https://res.cloudinary.com/dcxlzfyfp/image/upload/v1779449764/img-to-link/sefmi9byh6dln0bcmonm.jpg")',
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
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-blue-100 flex flex-col md:flex-row justify-between items-center gap-4 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-xl">🏫</div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Current School</p>
                <h2 className="text-sm font-black text-blue-900">{user?.school || "No school selected"}</h2>
              </div>
            </div>
            
            <div className="flex items-center gap-3 w-full md:w-auto">
              {isChangingSchool ? (
                <form onSubmit={handleLeaderboardSearch} className="flex gap-2 w-full">
                  <div className="relative flex-grow">
                    <input
                      type="text"
                      placeholder="Search school..."
                      className="w-full px-3 py-1.5 rounded-lg border-2 border-blue-100 focus:border-blue-500 outline-none font-bold text-xs"
                      value={leaderboardSchool}
                      onChange={(e) => {
                        setLeaderboardSchool(e.target.value);
                        setShowSuggestions(true);
                      }}
                    />
                    {showSuggestions && schoolSuggestions.length > 0 && (
                      <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-xl shadow-xl border border-gray-100 z-50 max-h-40 overflow-y-auto">
                        {schoolSuggestions.map((s, i) => (
                          <div 
                            key={i} 
                            className="px-3 py-2 border-b border-gray-50 last:border-0 hover:bg-blue-50 font-bold text-xs cursor-pointer"
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
                  <button className="bg-blue-600 text-white px-4 rounded-lg font-black text-xs hover:bg-blue-700 transition-colors">Join</button>
                  <button type="button" onClick={() => setIsChangingSchool(false)} className="text-gray-400 hover:text-gray-600 px-1 font-bold text-xs">Cancel</button>
                </form>
              ) : (
                <button 
                  onClick={() => setIsChangingSchool(true)}
                  className="px-4 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-xs transition-colors"
                >
                  Change School
                </button>
              )}
            </div>
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
                    setLeaderboardTimeframe('weekly');
                    const school = leaderboardScope === 'global' ? null : (user?.school);
                    fetchLeaderboard(school, 'weekly', leaderboardScope);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${leaderboardTimeframe === 'weekly' ? 'bg-[#2563EB] text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  This Week
                </button>
                <button 
                  onClick={() => {
                    setLeaderboardTimeframe('total');
                    const school = leaderboardScope === 'global' ? null : (user?.school);
                    fetchLeaderboard(school, 'total', leaderboardScope);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${leaderboardTimeframe === 'total' ? 'bg-[#2563EB] text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  All Time
                </button>
              </div>
            </div>
          </div>

          {/* Table Body */}
          <div className="p-2 md:p-4">
            {leaderboardLoading ? (
              <div className="flex flex-col items-center justify-center h-full gap-3">
                <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                <span className="font-bold text-xs text-gray-500 uppercase tracking-widest">Loading rankings...</span>
              </div>
            ) : leaderboardData.length > 0 ? (
              <div className="space-y-2">
                {/* Table Headers */}
                <div className="flex items-center px-4 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 mb-2">
                  <div className="w-12">Rank</div>
                  <div className="flex-1">Student</div>
                  {leaderboardScope === 'global' && <div className="flex-1 hidden md:block">School</div>}
                  <div className="w-24 text-right">Stars</div>
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
                          {isMe ? 'You' : (entry.name || entry.username)}
                        </span>
                      </div>

                      {leaderboardScope === 'global' && (
                        <div className="flex-1 hidden md:block text-xs text-gray-500 font-bold truncate">
                          {entry.school || '—'}
                        </div>
                      )}
                      
                      <div className="w-24 flex items-center justify-end gap-1.5">
                        <span className="text-sm font-black text-gray-800">{entry.totalPoints?.toLocaleString() || 0}</span>
                        <span className="text-yellow-400 text-sm drop-shadow-sm">⭐</span>
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
