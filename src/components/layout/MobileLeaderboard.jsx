import React from 'react';
import heroChar from '../../assets/images/heroChar.png';

const MobileLeaderboard = ({ 
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
    <div className="fixed inset-0 bg-white overflow-y-auto no-scrollbar pb-32">
      {/* Full Width Hero Banner with Logo Overlay */}
      <div className="relative w-full overflow-hidden">
        <img 
          src="https://res.cloudinary.com/dcxlzfyfp/image/upload/v1778246958/img-to-link/r2bkh4ou7qxpl8nsekj6.webp" 
          alt="Rank Banner" 
          className="w-full h-auto object-cover"
        />
        
        {/* Logo Overlay */}
        <div className="absolute top-0 left-0 right-0 z-20 px-6 pt-5 flex items-center justify-between w-full">
          <div className="flex items-center">
            <img 
              src="https://res.cloudinary.com/dcxlzfyfp/image/upload/v1777997560/img-to-link/mfaw5t09dlayxlunzfas.png" 
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
          <>
            <div className="bg-[#1E65FA] rounded-[16px] p-2.5 shadow-[0_6px_15px_-5px_rgba(30,101,250,0.3)] mb-3 flex justify-between items-center border border-white/20 gap-2">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center text-base shrink-0">🏫</div>
                <div className="w-px h-6 bg-white/20 shrink-0"></div>
                <h2 className="text-white font-black text-[14px] tracking-tight truncate">{user?.school || "Select your school"}</h2>
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
          </>
        )}

        {/* Time Filters */}
        <div className="flex gap-2 mb-4 px-1">
          <button 
            onClick={() => {
              setLeaderboardTimeframe('weekly');
              const school = leaderboardScope === 'global' ? null : (user?.school);
              fetchLeaderboard(school, 'weekly', leaderboardScope);
            }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[10px] font-black transition-all ${leaderboardTimeframe === 'weekly' ? 'bg-[#2563EB] text-white shadow-md' : 'bg-gray-100 text-gray-500'}`}
          >
            📅 Week
          </button>
          <button 
             onClick={() => {
               setLeaderboardTimeframe('total');
               const school = leaderboardScope === 'global' ? null : (user?.school);
               fetchLeaderboard(school, 'total', leaderboardScope);
             }}
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
                    

                    
                    <div className="flex flex-col min-w-0">
                      <span className={`text-[13px] font-black truncate ${isMe ? 'text-[#1E40AF]' : 'text-gray-800'}`}>
                        {isMe ? 'You' : (entry.name || entry.username)}
                      </span>
                      {leaderboardScope === 'global' && entry.school && (
                        <span className="text-[9px] text-gray-400 font-bold truncate">
                          {entry.school}
                        </span>
                      )}
                    </div>
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

export default React.memo(MobileLeaderboard);
