import React, { useEffect, useState, useRef } from 'react';
import curriculumService from '../../services/curriculumService';
import { useStars } from '../../context/StarsContext.jsx';
import heroChar from '../../assets/images/heroChar.png'; // Fallback image

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
        <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z" />
      </svg>
    </div>
  </div>
);

const MobileHome = ({
  user,
  weeklyStars,
  leaderboardData,
  onNavigateToPractice,
  onNavigateToRanks,
}) => {
  const { stars, refresh } = useStars();
  const hasSchool = !!user?.school;

  // Custom Video Controls
  const mobileVideoIframeRef = useRef(null);
  const [isMobileVideoMuted, setIsMobileVideoMuted] = useState(true);
  const [isMobileVideoPlaying, setIsMobileVideoPlaying] = useState(true);

  const toggleMobileVideoMute = (e) => {
    e.stopPropagation();
    const newMuted = !isMobileVideoMuted;
    setIsMobileVideoMuted(newMuted);
    if (mobileVideoIframeRef.current) {
      mobileVideoIframeRef.current.contentWindow.postMessage(
        JSON.stringify({ event: "command", func: newMuted ? "mute" : "unMute", args: [] }),
        "*"
      );
    }
  };

  const toggleMobileVideoPlay = (e) => {
    e.stopPropagation();
    const newPlaying = !isMobileVideoPlaying;
    setIsMobileVideoPlaying(newPlaying);
    if (mobileVideoIframeRef.current) {
      mobileVideoIframeRef.current.contentWindow.postMessage(
        JSON.stringify({ event: "command", func: newPlaying ? "playVideo" : "pauseVideo", args: [] }),
        "*"
      );
    }
  };

  // Ensure stars data is refreshed when MobileHome mounts (e.g., after login or navigation)
  React.useEffect(() => {
    refresh();
  }, []);
  React.useEffect(() => {
    if (user) refresh();
  }, [user]);
  const userIndex = leaderboardData?.findIndex(d => d.username === user?.username || d.userId === user?._id);
  const myRank = userIndex !== -1 ? userIndex + 1 : '-';
  const myStreak = localStorage.getItem('daily_streak_count') || user?.streak || 0;

  // Prepare leaderboard subset (1 above, self, 1 below)
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
      isMe: u.username === user?.username
    }));
  }, [leaderboardData, user?.username, userIndex, hasSchool]);

  const [missionVideoUrl, setMissionVideoUrl] = useState('https://www.youtube.com/embed/uHDSRZK74Dk');

  useEffect(() => {
    const fetchMissionVideo = async () => {
      try {
        const res = await curriculumService.getSetting('mission_video_url');
        if (res.data && res.data.value) {
          setMissionVideoUrl(res.data.value);
        }
      } catch (err) {
        console.error('Failed to fetch mission video settings', err);
      }
    };
    fetchMissionVideo();
  }, []);

  return (
    <div className="w-full min-h-screen bg-[#F0F6FF] font-sans flex flex-col overflow-y-auto block md:hidden relative pb-[180px]">

      {/* Seamless Top Background (Reduced Height) */}
      <div className="absolute top-0 left-0 right-0 h-[30vh] bg-gradient-to-b from-[#D4E8FF] to-[#F0F6FF] z-0 pointer-events-none">
        <div className="absolute top-12 left-12 text-yellow-400 text-lg animate-pulse">✨</div>
        <div className="absolute top-32 right-12 text-yellow-400 text-base animate-pulse" style={{ animationDelay: '1s' }}>✨</div>
        <div className="absolute top-24 right-1/3 text-yellow-400 text-sm animate-pulse" style={{ animationDelay: '0.5s' }}>⭐</div>
      </div>

      <div className="relative z-10 w-full flex flex-col px-4 pt-4">
        {/* Header - Transparent */}
        <div className="flex items-center justify-between w-full z-20 mb-1">
          <div className="flex items-center">
            <img 
              src="https://res.cloudinary.com/dcxlzfyfp/image/upload/v1778743597/img-to-link/bihseec7aigbmau4amnd.png" 
              alt="HoshiYaar Logo" 
              className="h-12 w-auto drop-shadow-sm" 
            />
          </div>
          <div className="w-10 h-10"></div>
        </div>

        {/* Hero Banner Section */}
        <div className="relative w-full mt-0 mb-4 overflow-hidden rounded-[24px] shadow-md border border-white/50">
          <img 
            src="https://res.cloudinary.com/dcxlzfyfp/image/upload/v1778245600/img-to-link/rqhpzqnjvb7lwofkj3v7.webp" 
            alt="Hero Banner" 
            className="w-full h-auto object-cover"
          />
        </div>
        <div className="w-full bg-white/95 rounded-[20px] p-2 shadow-[0_4px_12px_rgba(0,0,0,0.03)] flex justify-between items-center border border-white/60 backdrop-blur-md mb-2">
          {/* Rank */}
          <div className="flex items-center gap-1.5 w-1/3 justify-center">
            <HexagonRankIcon rank={myRank} />
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Rank</span>
              <span className="text-[17px] font-black text-gray-800 leading-none">{myRank}</span>
              <div className="w-6 h-0.5 rounded-full bg-purple-500 mt-0.5"></div>
            </div>
          </div>

          <div className="w-px h-8 bg-gray-100"></div>

          {/* Stars */}
          <div className="flex items-center gap-1.5 w-1/3 justify-center">
            <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center text-[14px] drop-shadow-sm">⭐</div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Stars</span>
              <span className="text-[17px] font-black text-gray-800 leading-none">
                {stars === null ? (
                  <span className="animate-pulse">...</span>
                ) : (
                  stars
                )}
              </span>
            </div>
          </div>

          <div className="w-px h-8 bg-gray-100"></div>

          {/* Streak */}
          <div className="flex items-center gap-1.5 w-1/3 justify-center">
            <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center text-[14px] drop-shadow-sm">🔥</div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Streak</span>
              <div className="flex items-baseline gap-1">
                <span className="text-[17px] font-black text-gray-800 leading-none">{myStreak}</span>
                <span className="text-[10px] font-bold text-gray-500">Days</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bento Grid (Compact) */}
        <div className="grid grid-cols-12 gap-2 mb-3">

          {/* Today's Mission (Left Col) */}
          <div className="col-span-7 bg-[#3B82F6] rounded-[32px] p-1 overflow-hidden relative shadow-md flex flex-col h-[260px] border border-blue-400">
            <div className="flex justify-center items-center py-2.5 text-white text-[10px] font-black tracking-widest uppercase">
              <span className="mr-1 text-yellow-300 text-[11px]">⭐</span> TODAY'S MISSION <span className="ml-1 text-yellow-300 text-[11px]">⭐</span>
            </div>

            <div className="bg-white rounded-[28px] overflow-hidden flex-1 flex flex-col items-center justify-center relative shadow-inner">
              {/* Mission YouTube Video */}
              <div className="absolute inset-0 z-0 overflow-hidden">
                <iframe 
                  ref={mobileVideoIframeRef}
                  className="w-full h-full scale-[1.05] pointer-events-none"
                  src={`${missionVideoUrl}${missionVideoUrl.includes('?') ? '&' : '?'}autoplay=1&mute=1&loop=1&playlist=${missionVideoUrl.split('/').pop().split('?')[0]}&controls=0&showinfo=0&rel=0&modestbranding=1&iv_load_policy=3&enablejsapi=1`} 
                  title="Today's Mission" 
                  frameBorder="0" 
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                  allowFullScreen
                ></iframe>

                {/* Custom Controls Overlay */}
                <div className="absolute inset-0 z-10 flex flex-col justify-end p-2 pointer-events-none">
                   <div className="flex justify-between items-center bg-black/40 backdrop-blur-sm rounded-full px-3 py-1.5 pointer-events-auto shadow-md border border-white/10">
                      <button 
                        onClick={toggleMobileVideoPlay} 
                        className="text-white text-[15px] hover:scale-110 transition-transform flex items-center justify-center w-6 h-6"
                      >
                         {isMobileVideoPlaying ? '⏸' : '▶'}
                      </button>
                      <button 
                        onClick={toggleMobileVideoMute} 
                        className="text-white text-[15px] hover:scale-110 transition-transform flex items-center justify-center w-6 h-6"
                      >
                         {isMobileVideoMuted ? '🔇' : '🔊'}
                      </button>
                   </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column Stack */}
          <div className="col-span-5 flex flex-col gap-3 h-[260px]">

            {/* Calendar Card (Exact Match) */}
            <div className="bg-[#F9F8FF] rounded-[32px] p-2 shadow-sm border border-[#E9D8FF] flex-1 flex flex-col items-center justify-center relative">
              <div className="absolute top-2 left-2 text-[#C084FC] text-lg opacity-30">✦</div>
              <div className="absolute top-3 right-3 text-yellow-400 text-sm opacity-30">✦</div>

              <div className="relative mb-1">
                <div className="text-[38px] drop-shadow-md">📅</div>
                <div className="absolute -bottom-1 -right-1.5 text-xl drop-shadow-md">⭐</div>
              </div>

              <p className="text-[#4A5568] font-bold text-center text-[9px] leading-tight mb-1">
                Fresh mysteries <br />every
              </p>

              <div className="flex items-center gap-1 text-[#8B5CF6] font-black text-[11px]">
                <span className="opacity-50 text-sm">≽</span> Tues & Fri <span className="opacity-50 text-sm">≼</span>
              </div>
            </div>

            {/* Social Card (Exact Match) */}
            <div className="bg-[#EBF5FF] rounded-[24px] p-2 shadow-sm border border-[#D6E4FF] flex-1 flex flex-col items-center justify-center">
              <div className="flex items-center justify-center mb-2 bg-white/50 px-3 py-1 rounded-full border border-white/40 shadow-sm">
                <h3 className="text-[#2C4A86] font-black text-[8px] whitespace-nowrap">Stay Connected</h3>
              </div>

              <div className="flex gap-2 w-full px-1">
                <a href="https://www.instagram.com/hoshiyaar_club/" target="_blank" rel="noopener noreferrer" className="flex-1 bg-white rounded-2xl p-2 flex flex-col items-center justify-center shadow-md border border-white hover:bg-gray-50 transition-all">
                  <img src="https://upload.wikimedia.org/wikipedia/commons/9/95/Instagram_logo_2022.svg" alt="Instagram" className="w-8 h-8 mb-1" />
                  <span className="text-[7px] font-bold text-gray-600">Instagram</span>
                </a>
                <a href="https://www.youtube.com/@Hoshi-yaar" target="_blank" rel="noopener noreferrer" className="flex-1 bg-white rounded-2xl p-2 flex flex-col items-center justify-center shadow-md border border-white hover:bg-gray-50 transition-all">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-sm bg-[#FF0000] mb-1">
                    <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg>
                  </div>
                  <span className="text-[7px] font-bold text-gray-600">YouTube</span>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* High-Fidelity Leaderboard Section (X-Large Text) */}
        <div className="w-full bg-[#F8FAFF] rounded-[32px] p-4 pt-5 pb-6 mb-4 shadow-inner border border-white/40 relative overflow-hidden">
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="text-yellow-400 text-[13px]">⭐</span>
            <h2 className="text-[15px] font-black text-gray-800 tracking-tight">Weekly Leaderboard</h2>
            <span className="text-yellow-400 text-[13px]">⭐</span>
          </div>

          <div className={`flex gap-3 w-full justify-center transition-all duration-500 ${!hasSchool ? 'blur-md grayscale opacity-50 select-none' : ''}`}>
            {lbItems.length > 0 ? (
              lbItems.map((item, idx) => (
                <div
                  key={idx}
                  className={`flex-1 min-w-[90px] rounded-[24px] p-3 pt-5 pb-3 flex flex-col items-center justify-center relative shadow-md border ${item.isMe ? 'border-[#2563EB] border-2 bg-white' : 'border-gray-100 bg-white'
                    }`}
                >
                  {/* Rank Badge */}
                  <div className={`absolute -top-2 -left-2 w-6 h-6 rounded-full text-white font-black flex items-center justify-center text-[11px] shadow-lg ${item.isMe ? 'bg-[#2563EB]' : 'bg-[#7C3AED]'
                    }`}>
                    {item.rank}
                  </div>

                  <div className={`font-black text-[13px] truncate w-full text-center mb-1.5 ${item.isMe ? 'text-[#1E40AF]' : 'text-gray-900'
                    }`}>
                    {item.isMe ? 'You' : (item.username || '—')}
                  </div>

                  <div className="flex items-center gap-1 bg-white rounded-full px-3 py-1 shadow-[inset_0_1px_3px_rgba(0,0,0,0.06)] border border-gray-50">
                    <span className="text-sm drop-shadow-sm">⭐</span>
                    <span className="text-[11px] font-black text-gray-700">{item.totalPoints || 0}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center py-6 opacity-40">
                <span className="text-[10px] font-black text-blue-900 uppercase">No Rankings yet</span>
              </div>
            )}
          </div>

          {/* Locked Overlay for No School */}
          {!hasSchool && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-blue-50/10 backdrop-blur-[2px] p-4">
              <div className="bg-white/90 p-4 rounded-[24px] shadow-xl border border-white flex flex-col items-center gap-3 animate-in zoom-in-95 duration-300">
                <div className="text-3xl">🏫</div>
                <div className="text-center">
                  <div className="text-[14px] font-black text-blue-900 uppercase leading-none mb-1">Leaderboard Locked</div>
                  <div className="text-[10px] font-bold text-gray-500">Join your school to compete!</div>
                </div>
                <button
                  onClick={onNavigateToRanks}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-[12px] font-black rounded-full shadow-[0_4px_0_0_#1D4ED8] active:translate-y-1 active:shadow-none transition-all"
                >
                  ENABLE NOW
                </button>
              </div>
            </div>
          )}
        </div>


        {/* Sticky Bottom CTA (X-Large Text) */}
        <div className="fixed bottom-[80px] left-0 right-0 px-10 z-[100] pb-2 pt-3 pointer-events-none">
          <button
            onClick={onNavigateToPractice}
            className="w-full py-2.5 bg-[#FFC107] hover:bg-[#FFD54F] text-gray-900 rounded-full font-black text-[14px] shadow-[0_4px_0_0_#F57F17] active:translate-y-1 active:shadow-none flex items-center justify-center gap-2 transition-all pointer-events-auto group"
          >
            <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform shrink-0">
               <span className="text-[#2563EB] text-[10px] ml-0.5">▶</span>
            </div>
            Continue Adventure
            <span className="ml-1 text-[17px] font-bold">›</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default MobileHome;
