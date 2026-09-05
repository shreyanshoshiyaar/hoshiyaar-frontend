import React, { useEffect, useState } from 'react';
import WeeklyGoalCard from '../../common/WeeklyGoalCard.jsx';
import { useAuth } from '../../../context/AuthContext.jsx';
import { StarCounter } from '../../../context/StarsContext.jsx';
import authService from '../../../services/authService.js';
import curriculumService from '../../../services/curriculumService.js';
import { useNavigate } from 'react-router-dom';

const ChallengesPage = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [goalData, setGoalData] = useState(() => user?.weeklyGoal || null);
  const [loading, setLoading] = useState(false);
  const [challengesLive, setChallengesLive] = useState(false);

  const cleanPhone = (user?.phone || '').replace(/\D/g, '');
  const isAdmin = user?.role === 'admin' || 
                  cleanPhone.endsWith('9867735936') || 
                  ['Host', 'hostcbse'].includes(user?.username) ||
                  sessionStorage.getItem('isAdmin') === 'true';

  const fetchFreshProgress = () => {
    if (user?._id) {
      setLoading(true);
      authService.getUser(user._id)
        .then(res => {
          const freshUser = res?.data || res;
          if (freshUser) {
            updateUser(freshUser);
            if (freshUser.weeklyGoal) {
              setGoalData(freshUser.weeklyGoal);
            }
          }
        })
        .catch(err => console.error('Error fetching latest user for challenges:', err))
        .finally(() => setLoading(false));
    }
  };

  useEffect(() => {
    if (user?.weeklyGoal) {
      setGoalData(user.weeklyGoal);
    }
    fetchFreshProgress();

    // Check if Challenges are live for non-admin students
    curriculumService.getSetting('challenges_live')
      .then(res => {
        if (res?.data && (res.data.value === true || res.data.value === 'true')) {
          setChallengesLive(true);
        }
      })
      .catch(err => console.error('Error fetching challenges_live:', err));
  }, [user?._id]);

  if (!isAdmin && !challengesLive) {
    return (
      <div className="w-full h-full bg-[#F0F6FF] font-sans flex flex-col items-center justify-center p-6 relative overflow-y-auto no-scrollbar pb-28 md:pb-8">
        <div className="absolute top-0 left-0 right-0 h-48 bg-gradient-to-b from-[#D4E8FF] to-[#F0F6FF] z-0 pointer-events-none rounded-b-3xl" />
        <div className="relative z-10 bg-white rounded-3xl p-8 max-w-md w-full border border-blue-100 shadow-xl text-center">
          <div className="w-16 h-16 rounded-3xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4 border border-blue-100 shadow-sm">
            <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
          </div>
          <span className="inline-block text-[11px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-3 py-1 rounded-full mb-3 border border-blue-100">
            Beta Testing
          </span>
          <h3 className="text-2xl font-black text-gray-900 mb-2 tracking-tight">Challenges Coming Soon!</h3>
          <p className="text-sm font-semibold text-gray-500 mb-6 leading-relaxed">
            Hoshi is curating exciting weekly challenges, streaks, and star rewards for you! This feature is in beta and rolling out very soon.
          </p>
          <button
            onClick={() => navigate('/learn')}
            className="w-full bg-[#2563EB] hover:bg-blue-700 text-white py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider transition-all shadow-md shadow-blue-200 cursor-pointer active:scale-95"
          >
            Go to Syllabus
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-[#F0F6FF] font-sans flex flex-col overflow-y-auto no-scrollbar relative p-4 lg:p-6 pb-28 md:pb-8">
      {/* Background decorations */}
      <div className="absolute top-0 left-0 right-0 h-48 bg-gradient-to-b from-[#D4E8FF] to-[#F0F6FF] z-0 pointer-events-none rounded-b-3xl" />

      <div className="relative z-10 w-full max-w-4xl mx-auto flex flex-col gap-6 pt-2">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-blue-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-blue-600 shrink-0 border border-blue-100">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-black text-gray-800 uppercase tracking-tight">Challenges & Goals</h2>
              <p className="text-xs font-semibold text-blue-600">Complete challenges to earn bonus stars and climb ranks!</p>
            </div>
          </div>
          
          <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
            <div className="px-3.5 py-1.5 rounded-full bg-white border border-amber-200 shadow-sm flex items-center">
              <StarCounter />
            </div>
            <button
              onClick={() => navigate('/learn')}
              className="px-4 sm:px-5 py-2 rounded-full bg-white hover:bg-blue-50 text-[#2563EB] border border-blue-200 text-xs font-black uppercase tracking-wider transition-all shadow-sm flex items-center gap-2 cursor-pointer"
            >
              <span>Go to Syllabus</span>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* Active Weekly Challenge */}
        <div>
          <div className="flex items-center justify-between mb-3 px-1">
            <span className="text-xs font-black uppercase tracking-widest text-gray-400">Current Challenge</span>
            <span className="text-[11px] font-bold text-gray-400 flex items-center gap-1">
              <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              Resets Every Monday
            </span>
          </div>
          <WeeklyGoalCard 
            goalData={goalData || user?.weeklyGoal} 
            showStartButton={true}
            onClaimSuccess={(updatedUser) => {
              if (updatedUser?.weeklyGoal) {
                setGoalData(updatedUser.weeklyGoal);
              }
              fetchFreshProgress();
            }}
          />
        </div>

        {/* Future / Locked Challenges */}
        <div className="flex flex-col gap-3">
          <span className="text-xs font-black uppercase tracking-widest text-gray-400 px-1">Upcoming Challenges</span>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white/70 rounded-3xl p-5 border border-dashed border-blue-200 flex items-center gap-4 shadow-sm opacity-80">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center shrink-0 border border-amber-100">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19.48 12.35c-1.57-4.08-7.16-4.3-5.81-10.23C10.1 3.5 6 7.6 6 12c0 3.31 2.69 6 6 6 1.48 0 2.85-.54 3.91-1.44 2.1-1.78 3.57-4.21 3.57-4.21z" />
                </svg>
              </div>
              <div className="flex-1">
                <h4 className="font-extrabold text-sm text-gray-700">7-Day Streak Master</h4>
                <p className="text-xs text-gray-500">Practice every day for a full week.</p>
                <span className="inline-block mt-2 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-700">
                  Coming Soon • +100 Stars
                </span>
              </div>
            </div>

            <div className="bg-white/70 rounded-3xl p-5 border border-dashed border-blue-200 flex items-center gap-4 shadow-sm opacity-80">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-500 flex items-center justify-center shrink-0 border border-purple-100">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                </svg>
              </div>
              <div className="flex-1">
                <h4 className="font-extrabold text-sm text-gray-700">Accuracy Champion</h4>
                <p className="text-xs text-gray-500">Score 100% on 3 revision rounds.</p>
                <span className="inline-block mt-2 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-700">
                  Coming Soon • +75 Stars
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChallengesPage;
