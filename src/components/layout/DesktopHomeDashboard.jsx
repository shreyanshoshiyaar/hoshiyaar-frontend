import React, { useEffect, useState } from 'react';
import curriculumService from '../../services/curriculumService';
import { useStars } from '../../context/StarsContext.jsx';
import heroChar from '../../assets/images/heroChar.png'; // Fallback image

const HexagonRankIcon = ({ rank }) => (
  <div className="relative w-full h-full flex items-center justify-center">
    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-sm">
      <polygon points="50 3, 93 25, 93 75, 50 97, 7 75, 7 25" fill="url(#hexGradientDesktop)" />
      <defs>
        <linearGradient id="hexGradientDesktop" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#A855F7" />
          <stop offset="100%" stopColor="#7E22CE" />
        </linearGradient>
      </defs>
    </svg>
    <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
      <svg className="w-[55%] h-[55%]" viewBox="0 0 24 24" fill="currentColor">
        <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z" />
      </svg>
    </div>
  </div>
);

const DesktopHomeDashboard = ({
  user,
  weeklyStars,
  leaderboardData,
  onNavigateToPractice,
  onNavigateToRanks,
}) => {
  const { stars, refresh } = useStars();
  const hasSchool = !!user?.school;

  React.useEffect(() => {
    refresh();
  }, []);
  React.useEffect(() => {
    if (user) refresh();
  }, [user]);

  const userIndex = leaderboardData?.findIndex(d => d.username === user?.username || d.userId === user?._id);
  const myRank = userIndex !== -1 ? userIndex + 1 : '-';
  const myStreak = localStorage.getItem('daily_streak_count') || user?.streak || 0;

  const [missionVideoUrl, setMissionVideoUrl] = useState('https://www.youtube.com/embed/uHDSRZK74Dk');

  useEffect(() => {
    const fetchMissionVideo = async () => {
      try {
        const resDesktop = await curriculumService.getSetting('mission_video_desktop_url');
        if (resDesktop.data && resDesktop.data.value) {
          setMissionVideoUrl(resDesktop.data.value);
          return; // Stop if desktop video is found
        }
        
        // Fallback to mobile video
        const resMobile = await curriculumService.getSetting('mission_video_url');
        if (resMobile.data && resMobile.data.value) {
          setMissionVideoUrl(resMobile.data.value);
        }
      } catch (err) {
        console.error('Failed to fetch mission video settings', err);
      }
    };
    fetchMissionVideo();
  }, []);

  // Prepare leaderboard subset (1 above, self, 1 below) just like mobile
  const lbItems = React.useMemo(() => {
    if (!leaderboardData || leaderboardData.length === 0 || !hasSchool) return [];

    if (userIndex === -1) {
      return leaderboardData.slice(0, 3).map((u, i) => ({ ...u, rank: i + 1, isMe: false }));
    }

    let start = Math.max(0, userIndex - 1);
    if (start + 3 > leaderboardData.length) {
      start = Math.max(0, leaderboardData.length - 3);
    }

    return leaderboardData.slice(start, start + 3).map((u, i) => ({
      ...u,
      rank: start + i + 1,
      isMe: u.username === user?.username || u.userId === user?._id
    }));
  }, [leaderboardData, user, userIndex, hasSchool]);

  return (
    <div className="w-full h-full bg-[#F0F6FF] font-sans flex flex-col overflow-y-hidden no-scrollbar relative p-4 lg:p-6">
      {/* Seamless Top Background */}
      <div className="absolute top-0 left-0 right-0 h-48 bg-gradient-to-b from-[#D4E8FF] to-[#F0F6FF] z-0 pointer-events-none rounded-b-3xl">
        <div className="absolute top-8 left-12 text-yellow-400 text-xl animate-pulse">✨</div>
        <div className="absolute top-20 right-24 text-yellow-400 text-lg animate-pulse" style={{ animationDelay: '1s' }}>✨</div>
        <div className="absolute top-10 right-1/3 text-yellow-400 text-base animate-pulse" style={{ animationDelay: '0.5s' }}>⭐</div>
      </div>

      <div className="relative z-10 w-full max-w-6xl mx-auto flex flex-col h-full gap-4">
        
        {/* Desktop Hero Banner - full image */}
        <div
          className="relative w-full rounded-3xl overflow-hidden shadow-md border border-white/60 shrink-0 lg:h-[28vh] max-h-[280px] min-h-[180px]"
          style={{
            backgroundImage: 'url("https://res.cloudinary.com/dcxlzfyfp/image/upload/v1779361333/img-to-link/zqipv0kb0thnwni1knrm.jpg")',
            backgroundSize: 'contain',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            backgroundColor: '#D4E8FF',
          }}
        />


        {/* Stats Row - compact */}
        <div className="flex gap-2 shrink-0">
          <div className="bg-white rounded-xl px-3 py-2 shadow-sm border border-gray-100 flex items-center gap-2 hover:shadow-md transition-shadow flex-1">
            <div className="w-8 h-8 shrink-0">
              <HexagonRankIcon rank={myRank} />
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest leading-none">Rank</span>
              <span className="text-base font-black text-gray-800 leading-none mt-0.5">{myRank}</span>
            </div>
          </div>
          <div className="bg-white rounded-xl px-3 py-2 shadow-sm border border-gray-100 flex items-center gap-2 hover:shadow-md transition-shadow flex-1">
            <div className="w-7 h-7 bg-yellow-100 rounded-lg flex items-center justify-center text-sm shadow-inner border border-yellow-200 shrink-0">⭐</div>
            <div className="flex flex-col">
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest leading-none">Stars</span>
              <span className="text-base font-black text-gray-800 leading-none mt-0.5">{stars}</span>
            </div>
          </div>
          <div className="bg-white rounded-xl px-3 py-2 shadow-sm border border-gray-100 flex items-center gap-2 hover:shadow-md transition-shadow flex-1">
            <div className="w-7 h-7 bg-orange-100 rounded-lg flex items-center justify-center text-sm shadow-inner border border-orange-200 shrink-0">🔥</div>
            <div className="flex flex-col">
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest leading-none">Streak</span>
              <div className="flex items-baseline gap-0.5 mt-0.5">
                <span className="text-base font-black text-gray-800 leading-none">{myStreak}</span>
                <span className="text-[9px] font-bold text-gray-500 uppercase">d</span>
              </div>
            </div>
          </div>
        </div>

        {/* Content Grid (Fills remaining height) — video | extras | leaderboard */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-[2fr_1fr_1fr] gap-4 min-h-0">
          {/* Mission Video */}
          <div className="bg-[#3B82F6] rounded-2xl p-2 shadow-sm border border-blue-400 flex flex-col h-full min-h-[150px]">
             <div className="flex justify-center items-center py-2 text-white text-[11px] font-black tracking-widest uppercase shrink-0">
              <span className="mr-2 text-yellow-300">⭐</span> TODAY'S MISSION <span className="ml-2 text-yellow-300">⭐</span>
            </div>
            <div className="bg-white rounded-xl overflow-hidden flex-1 relative shadow-inner">
              <iframe 
                className="absolute inset-0 w-full h-full"
                src={`${missionVideoUrl}${missionVideoUrl.includes('?') ? '&' : '?'}autoplay=1&mute=1&loop=1&playlist=${missionVideoUrl.split('/').pop().split('?')[0]}&controls=1&showinfo=0&rel=0&modestbranding=1&iv_load_policy=3`} 
                title="Today's Mission" 
                frameBorder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowFullScreen
              ></iframe>
            </div>
          </div>

          {/* Side Stack - middle column */}
          <div className="flex flex-col gap-4 h-full">
            <div className="bg-[#F9F8FF] rounded-2xl p-4 shadow-sm border border-[#E9D8FF] flex-1 flex flex-col items-center justify-center relative hover:shadow-md transition-shadow">
              <div className="text-4xl drop-shadow-sm mb-2">📅</div>
              <p className="text-[#4A5568] font-bold text-center text-xs leading-tight mb-2">
                Fresh mysteries every
              </p>
              <div className="flex items-center gap-1.5 text-[#8B5CF6] font-black text-sm bg-purple-100 px-3 py-1.5 rounded-lg">
                <span className="opacity-50">≽</span> Tues &amp; Fri <span className="opacity-50">≼</span>
              </div>
            </div>

            <div className="bg-[#EBF5FF] rounded-2xl p-4 shadow-sm border border-[#D6E4FF] flex-1 flex flex-col items-center justify-center hover:shadow-md transition-shadow">
               <h3 className="text-[#2C4A86] font-black text-[10px] uppercase tracking-widest mb-3">Stay Connected</h3>
               <div className="flex gap-2 w-full">
                <a href="https://www.instagram.com/hoshiyaar_club/" target="_blank" rel="noopener noreferrer" className="flex-1 bg-white rounded-xl p-2 flex flex-col items-center justify-center shadow-sm border border-gray-100 hover:scale-105 transition-transform group">
                  <img src="https://upload.wikimedia.org/wikipedia/commons/9/95/Instagram_logo_2022.svg" alt="Instagram" className="w-8 h-8 mb-1.5 drop-shadow-sm group-hover:drop-shadow-md transition-all" />
                  <span className="text-[10px] font-bold text-gray-600">Instagram</span>
                </a>
                <a href="https://www.youtube.com/@Hoshi-yaar" target="_blank" rel="noopener noreferrer" className="flex-1 bg-white rounded-xl p-2 flex flex-col items-center justify-center shadow-sm border border-gray-100 hover:scale-105 transition-transform group">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white shadow-sm bg-[#FF0000] mb-1.5 group-hover:shadow-md transition-all">
                    <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg>
                  </div>
                  <span className="text-[10px] font-bold text-gray-600">YouTube</span>
                </a>
              </div>
            </div>
          </div>

          {/* Mini Leaderboard Column - extreme right */}
          <div className="bg-[#F8FAFF] rounded-2xl p-4 shadow-sm border border-white/60 flex flex-col h-full overflow-hidden hover:shadow-md transition-shadow relative">
            <div className="flex justify-between items-center mb-3 shrink-0">
              <h3 className="text-xs font-black text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                <span className="text-lg text-yellow-500">⭐</span> Leaderboard
              </h3>
              <button onClick={onNavigateToRanks} className="text-[10px] font-bold text-blue-500 hover:text-blue-700 uppercase tracking-widest transition-colors">View</button>
            </div>
            
            <div className={`flex-1 overflow-y-auto no-scrollbar space-y-2 pr-1 transition-all duration-500 ${!hasSchool ? 'blur-sm grayscale opacity-50 select-none' : ''}`}>
              {lbItems && lbItems.length > 0 ? (
                lbItems.map((item, i) => (
                  <div key={i} className={`flex items-center px-3 py-2.5 rounded-xl border transition-colors ${item.isMe ? 'bg-white border-blue-200 shadow-sm' : 'bg-white/60 border-gray-100 hover:bg-white'}`}>
                    <div className={`w-6 h-6 flex items-center justify-center rounded-full text-[10px] font-black shrink-0 ${item.rank === 1 ? 'bg-[#2563EB] text-white shadow-sm' : item.isMe ? 'bg-[#2563EB] text-white shadow-sm' : 'bg-[#7C3AED] text-white'}`}>
                      {item.rank}
                    </div>
                    <span className={`ml-3 text-xs font-black truncate flex-1 ${item.isMe ? 'text-[#1E40AF]' : 'text-gray-900'}`}>
                      {item.isMe ? 'You' : (item.username || '—')}
                    </span>
                    <div className="flex items-center gap-1 shrink-0 ml-2 bg-gray-50 rounded-full px-2 py-0.5 border border-gray-100">
                      <span className="text-[10px] drop-shadow-sm">⭐</span>
                      <span className="text-[10px] font-black text-gray-700">{item.totalPoints?.toLocaleString() || 0}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-center">No Rankings Yet</p>
                </div>
              )}
            </div>

            {/* Locked Overlay for No School */}
            {!hasSchool && (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-blue-50/10 backdrop-blur-[2px] p-2">
                <div className="bg-white/95 p-4 rounded-2xl shadow-lg border border-white flex flex-col items-center gap-2 text-center w-full max-w-[200px]">
                  <div className="text-xl">🏫</div>
                  <div className="text-[10px] font-black text-blue-900 uppercase leading-none mb-1">Leaderboard Locked</div>
                  <button
                    onClick={onNavigateToRanks}
                    className="mt-1 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-sm transition-all"
                  >
                    Enable Now
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default DesktopHomeDashboard;

