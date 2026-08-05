import React, { useEffect, useState } from 'react';
import Lottie from 'lottie-react';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { useStars } from '../../../context/StarsContext';
import WeeklyStreak from '../../common/WeeklyStreak.jsx';

const fireballAnimation = null; // Removed missing asset import

export default function MidLessonStreakModal() {
  const { midLessonStreakEarned, dismissMidLessonStreak } = useStars();
  const [streakCount, setStreakCount] = useState(0);

  useEffect(() => {
    if (midLessonStreakEarned) {
      try {
        setStreakCount(Number(localStorage.getItem('daily_streak_count')) || 1);
        // Trigger haptics when shown
        Haptics.impact({ style: ImpactStyle.Heavy });
        setTimeout(() => Haptics.impact({ style: ImpactStyle.Heavy }), 200);
        setTimeout(() => Haptics.impact({ style: ImpactStyle.Medium }), 400);
      } catch (e) {
        // ignore if not available
      }
    }
  }, [midLessonStreakEarned]);

  if (!midLessonStreakEarned) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="relative w-full max-w-md bg-white rounded-3xl p-8 flex flex-col items-center justify-center text-center shadow-2xl animate-in zoom-in-95 duration-500 delay-100">
        
        {/* Fireball Animation */}
        <div className="w-48 h-48 -mt-16 mb-2 relative z-10 drop-shadow-xl">
          {fireballAnimation ? (
            <Lottie
              animationData={fireballAnimation}
              loop={true}
              autoPlay={true}
              style={{ width: '100%', height: '100%' }}
            />
          ) : (
            <div className="text-8xl animate-bounce">🔥</div>
          )}
        </div>

        {/* Text content */}
        <h2 className="text-2xl font-black text-gray-900 mb-2 font-display uppercase tracking-wider">
          Streak Extended!
        </h2>
        
        <p className="text-sm text-gray-500 font-medium mb-6 px-4">
          You've earned your daily streak by putting in the effort. Keep the fire alive tomorrow!
        </p>

        {/* Calendar */}
        <div className="w-full mb-8 transform scale-90 sm:scale-100">
          <WeeklyStreak streakCount={streakCount} currentDayCompleted={true} />
        </div>

        {/* Continue Button */}
        <button
          onClick={dismissMidLessonStreak}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold text-lg py-4 px-6 rounded-2xl shadow-lg shadow-orange-500/30 transform transition-all active:scale-95"
        >
          Continue Lesson
        </button>
      </div>
    </div>
  );
}
