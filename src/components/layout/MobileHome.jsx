import React from 'react';
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
  stars,
  weeklyStars,
  leaderboardData,
  onNavigateToPractice,
  onNavigateToRanks
}) => {
  const hasSchool = !!user?.school;
  const userIndex = leaderboardData?.findIndex(d => d.username === user?.username || d.userId === user?._id);
  const myRank = userIndex !== -1 ? userIndex + 1 : '-';
  const myStreak = localStorage.getItem('daily_streak_count') || user?.streak || 0;
  const [isMuted, setIsMuted] = React.useState(true);
  const videoRef = React.useRef(null);

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
        <div className="flex items-center justify-between w-full z-20 mb-4">
          <div className="flex items-center">
            <img 
              src="https://res.cloudinary.com/dcxlzfyfp/image/upload/v1777997560/img-to-link/mfaw5t09dlayxlunzfas.png" 
              alt="HoshiYaar Logo" 
              className="h-12 w-auto drop-shadow-sm" 
            />
          </div>
          <div className="w-10 h-10"></div> {/* Bell icon removed */}
        </div>

        {/* Hero Section (Responsive & Immersive) */}
        <div className="relative w-full min-h-[140px] mt-2 mb-4 flex items-center">
          <div className="relative z-10 w-[65%] pl-2">
            <h1 className="text-[18px] sm:text-[21px] font-black text-gray-900 leading-[0.95] tracking-tighter">
              Don't memorize <span className="text-blue-600">science.</span><br />
              Solve it. Remember it.
            </h1>
          </div>
          <div className="absolute bottom-[-10px] right-[-10px] w-[60%] h-[120%] z-0 flex items-end justify-end pointer-events-none">
            <img src={heroChar} alt="Characters" className="object-contain h-full w-full object-bottom drop-shadow-[0_12px_16px_rgba(0,0,0,0.15)] scale-115 origin-bottom" />
          </div>
        </div>

        {/* Stats Row (X-Large Text) */}
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
              <span className="text-[17px] font-black text-gray-800 leading-none">{stars}</span>
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
              {/* Mission Video with Sound Toggle */}
              <div className="absolute inset-0 z-0">
                <video
                  ref={videoRef}
                  autoPlay
                  loop
                  muted={isMuted}
                  playsInline
                  className="w-full h-full object-cover"
                >
                  <source src="https://res.cloudinary.com/dcxlzfyfp/video/upload/v1777997560/video/mission_v1.mp4" type="video/mp4" />
                </video>
              </div>

              {/* Mute Toggle Overlay */}
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMuted(!isMuted);
                }}
                className="absolute top-2 right-2 z-20 w-8 h-8 bg-black/20 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/20 active:scale-90 transition-all"
              >
                <span className="text-xs">{isMuted ? '🔇' : '🔊'}</span>
              </button>
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
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white mb-1 shadow-sm" style={{ background: 'linear-gradient(45deg, #f09433 0%, #dc2743 50%, #bc1888 100%)' }}>
                    <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.333 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm3.98-10.169a1.44 1.44 0 11-2.88 0 1.44 1.44 0 012.88 0z" /></svg>
                  </div>
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
        <div className="fixed bottom-[80px] left-0 right-0 px-10 z-[100] pb-2 pointer-events-none">
          <button
            onClick={onNavigateToPractice}
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-black text-[15px] shadow-lg active:scale-95 transition-all pointer-events-auto flex items-center justify-center gap-3"
          >
            <div className="w-7 h-7 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
               <span className="text-white text-[12px] ml-0.5">▶</span>
            </div>
            Continue Adventure
            <span className="ml-1 text-[18px] font-bold">›</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default MobileHome;
