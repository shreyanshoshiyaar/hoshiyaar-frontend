import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useReview } from '../../../context/ReviewContext.jsx';
import { useAuth } from '../../../context/AuthContext.jsx';
import { useStars } from '../../../context/StarsContext.jsx';
import image07 from '../../../assets/images/image-07.png';
import reattemptImg from '../../../assets/images/reattempt.png';
import finishImg from '../../../assets/images/finish.png';
import victorySound from '../../../assets/sounds/victory.mp3';
import SimpleLoading from '../../ui/SimpleLoading.jsx';
 
const LessonComplete = () => {
  const navigate = useNavigate();
  const { moduleNumber } = useParams();
  const [isChecking, setIsChecking] = useState(true);
  const { hasItems, getStagedForModule, clearStagedForModule } = useReview();
  const { user } = useAuth();
  const { stars } = useStars();
  const [scores, setScores] = useState({ best: 0, last: 0 });
  const isNewBest = Math.max(0, Number(scores.last || 0)) >= Math.max(0, Number(scores.best || 0)) && (scores.last || 0) > 0;
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    (async () => {
      // Flush any staged incorrects for this module so Review screen shows them now
      try {
        const staged = getStagedForModule(moduleNumber);
        if (Array.isArray(staged) && staged.length > 0) {
          const reviewSvc = (await import('../../../services/reviewService.js')).default;
          const unique = Array.from(new Set(staged));
          const userId = user?._id;
          for (const qid of unique) {
            if (!userId) break;
            await reviewSvc.saveIncorrect({ userId, questionId: qid, moduleId: String(moduleNumber) });
          }
          clearStagedForModule(moduleNumber);
        }
      } catch (_) {}
      try {
        if (user?._id) {
          const auth = (await import('../../../services/authService.js')).default;
          const resp = await auth.getProgress(user._id);
          const arr = resp?.data || [];
          const params = new URLSearchParams(window.location.search);
          const chapParam = params.get('chapter');
          const np = Number(chapParam);
          const chapterToShow = Number.isFinite(np) && np > 0 ? np : 1;
          const entry = arr.find((e) => Number(e.chapter) === Number(chapterToShow));
          if (entry) {
            // Sum across all lesson stats in this chapter to avoid title mismatches
            const stats = entry.stats || {};
            const kv = typeof stats.entries === 'function' ? Array.from(stats.entries()) : Object.entries(stats);
            let best = 0, last = 0;
            for (const [, v] of kv) {
              const b = Number(v?.bestScore || 0);
              const l = Number(v?.lastScore || 0);
              if (Number.isFinite(b)) best += b;
              if (Number.isFinite(l)) last += l;
            }
            setScores({ best, last });
          }
        }
      } catch (_) {}
      setIsChecking(false);
    })();
  }, [user, moduleNumber]);

  useEffect(() => {
    if (isNewBest) {
      setShowConfetti(true);
      try { setTimeout(() => setShowConfetti(false), 1600); } catch (_) {}
    }
  }, [isNewBest]);

  // Play victory sound only when there are no review items (final page)
  useEffect(() => {
    if (hasItems) return; // queue not empty → don't play
    const audio = new Audio(victorySound);
    audio.volume = 0.6;
    audio.play().catch(() => { /* ignore autoplay restrictions */ });
    return () => {
      audio.pause();
      audio.currentTime = 0;
    };
  }, [hasItems]);

  // Allow pressing Enter to trigger main CTA: Re-attempt when available, otherwise Continue Learning
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Enter') {
        if (hasItems) {
          navigate('/review-round');
        } else {
          const urlParams = new URLSearchParams(window.location.search);
          const chapterId = urlParams.get('chapterId');
          const params = new URLSearchParams();
          params.set('go', 'dashboard');
          if (chapterId) params.set('chapterId', chapterId);
          navigate(`/learn?${params.toString()}`);
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [hasItems, navigate]);

  

  // Helper to get current chapterId from URL or module
  const getCurrentChapterId = () => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const chapterId = urlParams.get('chapterId');
      if (chapterId) return chapterId;
      
      // Fallback: try to get from module
      if (moduleNumber && user?._id) {
        // This is async but we'll handle it in the navigate call
        return null; // Will be handled by dashboard loading
      }
      return null;
    } catch (_) {
      return null;
    }
  };

  const handleContinue = () => {
    const chapterId = getCurrentChapterId();
    const params = new URLSearchParams();
    params.set('go', 'dashboard');
    if (chapterId) params.set('chapterId', chapterId);
    navigate(`/learn?${params.toString()}`);
  };

  const handleGoToDashboard = () => {
    const chapterId = getCurrentChapterId();
    const params = new URLSearchParams();
    params.set('go', 'dashboard');
    if (chapterId) params.set('chapterId', chapterId);
    navigate(`/learn?${params.toString()}`);
  };

  if (isChecking) {
    return <SimpleLoading text="Checking for review questions..." />;
  }

  return (
    <div 
      className="h-screen relative flex flex-col items-center justify-between px-6 sm:px-10 md:px-12 py-8 text-center overflow-hidden bg-center bg-cover bg-no-repeat"
      style={{ backgroundImage: 'url("https://res.cloudinary.com/dcxlzfyfp/image/upload/v1778580068/img-to-link/h22ceyd8qnmcxmvfmlsb.webp")' }}
    >
      {/* Overlay to ensure legibility if background is too busy */}
      <div className="absolute inset-0 bg-black/5 pointer-events-none" />
      
      <div className="relative z-10 flex flex-col items-center justify-center h-full w-full gap-8">
        {/* Success Content & Stars Box & Action Button Group - Stacked at the bottom */}
        <div className="w-full max-w-xl flex flex-col items-center gap-6 mt-auto mb-10">
          <div className="flex flex-col items-center">
            {showConfetti && (
              <div className="pointer-events-none absolute -top-40 right-0 w-36 h-36">
                <div className="absolute text-3xl animate-bounce" style={{ top: 0, right: 8 }}>🎉</div>
                <div className="absolute text-3xl animate-bounce" style={{ top: 26, right: 56, animationDelay: '0.15s' }}>✨</div>
                <div className="absolute text-3xl animate-bounce" style={{ top: 10, right: 86, animationDelay: '0.3s' }}>🎊</div>
                <div className="absolute text-3xl animate-bounce" style={{ top: 46, right: 24, animationDelay: '0.45s' }}>⭐</div>
              </div>
            )}
            
            <h1 className="text-3xl md:text-5xl text-gray-900 font-black drop-shadow-sm leading-tight">
              CONGRATULATIONS!
            </h1>
            <p className="mt-2 text-lg md:text-xl text-gray-800 font-extrabold px-4">
              You rocked this lesson. Ready for the next adventure?
            </p>
          </div>

          {/* Total Stars card - Horizontal Sleek Glassmorphic Design */}
          <div className="w-full max-w-xl animate-fade-in px-2">
            <div className="bg-white/80 backdrop-blur-md border-2 border-yellow-400/30 rounded-2xl px-6 py-4 shadow-[0_8px_32px_rgba(0,0,0,0.1)] flex items-center justify-between border-b-4 border-b-yellow-400/20">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center text-2xl shadow-lg animate-bounce shrink-0">
                  ⭐
                </div>
                <div className="text-left">
                  <div className="text-[10px] font-black text-yellow-800 uppercase tracking-widest leading-none mb-1.5">Total Stars Earned</div>
                  <div className="text-2xl font-black text-yellow-600 drop-shadow-sm leading-none">{stars} stars</div>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-black text-green-600 uppercase tracking-tighter">Lesson Mastered</span>
                <div className="flex gap-0.5 mt-1">
                  <span className="text-xs">✨</span>
                  <span className="text-xs animate-pulse">✨</span>
                </div>
              </div>
            </div>
          </div>

          <button 
            onClick={handleContinue} 
            className="w-full py-5 rounded-[2rem] bg-blue-600 text-white font-black text-xl hover:bg-blue-700 transition-all hover:scale-105 active:scale-95 shadow-[0_8px_0_0_#1D4ED8] hover:shadow-[0_10px_0_0_#1D4ED8]"
          >
            CONTINUE LEARNING
          </button>
        </div>
      </div>
    </div>
  );
};

export default LessonComplete;