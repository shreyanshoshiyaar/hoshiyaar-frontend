import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useReview } from '../../../context/ReviewContext.jsx';
import { useAuth } from '../../../context/AuthContext.jsx';
import { useStars } from '../../../context/StarsContext.jsx';
import image07 from '../../../assets/images/image-07.png';
import reattemptImg from '../../../assets/images/reattempt.png';
import finishImg from '../../../assets/images/finish.png';
import victorySound from '../../../assets/sounds/victory.mp3';
 
const LessonComplete = () => {
  const navigate = useNavigate();
  const { moduleNumber } = useParams();
  const [isChecking, setIsChecking] = useState(true);
  const { hasItems } = useReview();
  const { user } = useAuth();
  const { stars } = useStars();
  const [scores, setScores] = useState({ best: 0, last: 0 });
  const isNewBest = Math.max(0, Number(scores.last || 0)) >= Math.max(0, Number(scores.best || 0)) && (scores.last || 0) > 0;
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    (async () => {
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
          navigate('/learn?go=dashboard');
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [hasItems, navigate]);

  

  const handleContinue = () => {
    navigate('/learn?go=dashboard');
  };

  const handleGoToDashboard = () => {
    navigate('/learn?go=dashboard');
  };

  if (isChecking) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-16 py-2 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="mt-4 text-lg text-gray-600">Checking for review questions...</p>
      </div>
    );
  }

  return (
    <div className="h-screen bg-white relative flex flex-col items-center justify-between px-6 sm:px-10 md:px-12 py-4 text-center overflow-hidden">
      
      {hasItems ? (
        <>
          {/* Character + speech bubble */}
          <div className="mt-6 w-full max-w-3xl flex flex-col items-center">
            <img src={reattemptImg} alt="Reattempt" className="w-56 h-56 md:w-64 md:h-64 object-contain select-none" />
            <p className="mt-4 text-2xl md:text-4xl text-gray-900 font-extrabold">Let's correct the exercises you missed!</p>
          </div>
          <div className="mt-10 w-full max-w-2xl">
            <button
              onClick={() => navigate('/review-round')}
              className="w-full py-5 rounded-2xl bg-green-600 hover:bg-green-700 text-white font-extrabold text-2xl tracking-wide shadow-[0_8px_0_0_rgba(0,0,0,0.15)]"
            >
              RE-ATTEMPT
            </button>
          </div>
        </>
      ) : (
        <>
          {/* Finish character above sentence (Duolingo-style) */}
          <img src={finishImg} alt="Finish" className="max-h-[28vh] w-auto object-contain select-none mt-2" />
          {showConfetti && (
            <div className="pointer-events-none absolute top-10 right-10 w-36 h-36">
              <div className="absolute text-3xl animate-bounce" style={{ top: 0, right: 8 }}>🎉</div>
              <div className="absolute text-3xl animate-bounce" style={{ top: 26, right: 56, animationDelay: '0.15s' }}>✨</div>
              <div className="absolute text-3xl animate-bounce" style={{ top: 10, right: 86, animationDelay: '0.3s' }}>🎊</div>
              <div className="absolute text-3xl animate-bounce" style={{ top: 46, right: 24, animationDelay: '0.45s' }}>⭐</div>
            </div>
          )}
          <p className="mt-4 text-2xl md:text-3xl text-gray-900 font-extrabold max-w-4xl px-2">You rocked this lesson. Ready for the next adventure?</p>
          {/* Total Stars card moved here (replaces bottom yellow box) */}
          <div className="mt-6 w-full max-w-xl">
            <div className="bg-gradient-to-br from-yellow-50 to-orange-50 border-4 border-yellow-400 rounded-2xl px-4 py-6 shadow-[0_8px_0_0_rgba(0,0,0,0.10)]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">⭐</span>
                  <div>
                    <div className="text-xs font-extrabold text-yellow-700">Total Stars</div>
                    <div className="text-lg font-extrabold text-yellow-600">{stars} stars</div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-sm">✨</span>
                  <span className="text-xs font-bold text-yellow-600">Earned!</span>
                </div>
              </div>
            </div>
          </div>
          <div className="mb-2 mt-3">
            <button onClick={handleContinue} className="py-4 px-6 rounded-2xl bg-blue-600 text-white font-extrabold text-xl hover:bg-blue-700 transition-colors shadow-[0_6px_0_0_rgba(0,0,0,0.15)] whitespace-nowrap">Continue Learning</button>
          </div>
        </>
      )}
    </div>
  );
};

export default LessonComplete;