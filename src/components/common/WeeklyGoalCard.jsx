import React, { useState } from 'react';
import Confetti from 'react-confetti';
import useWindowSize from 'react-use/lib/useWindowSize';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import { useAuth } from '../../context/AuthContext';
import { useStars } from '../../context/StarsContext';

const WeeklyGoalCard = ({ goalData, onClaimSuccess, showStartButton = true }) => {
  const { width, height } = useWindowSize();
  const { user, updateUser } = useAuth();
  const { addStars, syncFromServer } = useStars();
  const navigate = useNavigate();
  
  const [claiming, setClaiming] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const currentGoal = goalData || user?.weeklyGoal || {};
  const modulesCompleted = Number(currentGoal?.modulesCompleted || 0);
  const claimed = Boolean(currentGoal?.claimed);
  const progress = Math.min((modulesCompleted / 3) * 100, 100);
  const isGoalMet = modulesCompleted >= 3;

  const handleClaim = async () => {
    if (claiming) return;
    setClaiming(true);
    try {
      const res = await authService.claimWeeklyGoal(user._id);
      setShowConfetti(true);
      const updatedUser = res?.data || res;
      if (updatedUser) {
        updateUser(updatedUser);
        if (Number.isFinite(updatedUser.totalPoints)) {
          syncFromServer(updatedUser.totalPoints);
        } else {
          addStars(50);
        }
      } else {
        addStars(50);
      }
      setTimeout(() => setShowConfetti(false), 5000);
      if (onClaimSuccess) onClaimSuccess(updatedUser);
    } catch (err) {
      console.error('Error claiming weekly goal:', err);
    } finally {
      setClaiming(false);
    }
  };

  const handleStartChallenge = () => {
    navigate('/learn');
  };

  if (claimed) {
    return (
      <div className="mb-6 p-6 rounded-3xl bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 border border-green-400">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94A5.01 5.01 0 0011 15.9V19H7v2h10v-2h-4v-3.1c1.98-.44 3.49-2.14 3.61-4.16C19.08 11.63 21 9.55 21 7V5c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z" />
            </svg>
          </div>
          <div>
            <h3 className="font-extrabold text-lg">Weekly Goal Completed</h3>
            <p className="text-green-100 text-xs sm:text-sm">
              You reached this week's target (+50 Stars claimed). New challenges reset on Monday!
            </p>
          </div>
        </div>
        <button
          onClick={handleStartChallenge}
          className="px-6 py-2.5 rounded-full bg-white text-green-700 font-black text-xs uppercase tracking-wider hover:bg-green-50 active:scale-95 transition-all shadow-md shrink-0 cursor-pointer"
        >
          Keep Practicing
        </button>
      </div>
    );
  }

  if (isGoalMet) {
    return (
      <div className="mb-6 p-6 rounded-3xl bg-gradient-to-br from-amber-400 via-orange-500 to-amber-600 text-white shadow-2xl relative overflow-hidden flex flex-col items-center text-center gap-4 border-2 border-yellow-300">
        {showConfetti && <Confetti width={width} height={height} style={{ position: 'fixed', top: 0, left: 0, zIndex: 9999 }} />}
        
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94A5.01 5.01 0 0011 15.9V19H7v2h10v-2h-4v-3.1c1.98-.44 3.49-2.14 3.61-4.16C19.08 11.63 21 9.55 21 7V5c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z" />
            </svg>
          </div>
          <h3 className="text-2xl font-black uppercase tracking-wide drop-shadow-md">
            Challenge Completed!
          </h3>
        </div>
        
        <p className="text-sm font-semibold max-w-md text-amber-50">
          Awesome work! You completed 3 modules this week. Claim your 50 bonus stars right now!
        </p>
        
        <button
          onClick={handleClaim}
          disabled={claiming}
          className="bg-white text-orange-600 font-black px-10 py-3.5 rounded-full shadow-2xl hover:bg-yellow-50 hover:scale-105 active:scale-95 transition-all duration-200 uppercase tracking-widest text-sm flex items-center gap-2 border-2 border-orange-200 cursor-pointer"
        >
          <svg className="w-5 h-5 fill-amber-500 text-amber-500" viewBox="0 0 24 24">
            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
          </svg>
          <span>{claiming ? 'CLAIMING...' : 'CLAIM 50 STARS'}</span>
        </button>
      </div>
    );
  }

  return (
    <div className="mb-6 p-6 rounded-3xl bg-white dark:bg-gray-800 border-2 border-blue-100 dark:border-gray-700 shadow-md flex flex-col gap-4 relative overflow-hidden">
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-800">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <circle cx="12" cy="12" r="6" />
              <circle cx="12" cy="12" r="2" />
            </svg>
          </div>
          <div>
            <h4 className="font-extrabold text-gray-800 dark:text-gray-100 text-base sm:text-lg">
              Solve 3 Modules
            </h4>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Complete {Math.max(0, 3 - modulesCompleted)} more {3 - modulesCompleted === 1 ? 'module' : 'modules'} to earn 50 bonus stars!
            </p>
          </div>
        </div>
        
        <div className="text-right">
          <span className="inline-block px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-black text-xs">
            {modulesCompleted}/3 Done
          </span>
        </div>
      </div>

      <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-3.5 overflow-hidden p-0.5 border border-gray-200 dark:border-gray-600">
        <div 
          className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full rounded-full transition-all duration-700 ease-out shadow-sm" 
          style={{ width: `${progress}%` }}
        />
      </div>

      {showStartButton && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-gray-100 dark:border-gray-700/60">
          <span className="text-xs font-bold text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
            <svg className="w-4 h-4 text-amber-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
            </svg>
            Reward: <strong className="text-amber-500 font-extrabold">+50 Stars</strong>
          </span>
          <button
            onClick={handleStartChallenge}
            className="w-full sm:w-auto px-6 py-2.5 rounded-full bg-[#2563EB] hover:bg-blue-700 active:scale-95 text-white font-extrabold text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>{modulesCompleted === 0 ? 'Start Challenge' : 'Continue Challenge'}</span>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
};

export default WeeklyGoalCard;