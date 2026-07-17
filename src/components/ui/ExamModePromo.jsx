import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import curriculumService from '../../services/curriculumService';

export default function ExamModePromo() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPromo, setShowPromo] = useState(false);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    // Only fetch if user is logged in
    if (!user) return;

    const checkExamMode = async () => {
      try {
        const liveRes = await curriculumService.getSetting('exam_mode_live');
        if (liveRes.data && liveRes.data.value === true) {
          setIsLive(true);
        }
      } catch (err) {
        console.error("Failed to check if exam mode is live", err);
      }
    };

    checkExamMode();
  }, [user]);

  useEffect(() => {
    if (!isLive) return;

    // Show popup every 15 minutes (900000 ms)
    const interval = setInterval(() => {
      // Don't show if they are already on the exam page
      if (!window.location.pathname.includes('/exam')) {
        setShowPromo(true);
      }
    }, 15 * 60 * 1000);

    return () => clearInterval(interval);
  }, [isLive]);

  if (!showPromo) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-gradient-to-b from-[#1A2C5B] to-[#0F204C] rounded-3xl p-8 max-w-sm w-full border border-cyan-500/30 shadow-[0_0_40px_rgba(0,255,204,0.15)] text-center relative overflow-hidden">
        <button 
          onClick={() => setShowPromo(false)}
          className="absolute top-4 right-4 text-white/50 hover:text-white bg-white/5 rounded-full w-8 h-8 flex items-center justify-center transition-colors z-20"
        >
          ✕
        </button>
        
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-400 to-purple-500"></div>
        
        <h3 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-purple-400 mb-2 tracking-wide mt-6">
          Exam Mode is LIVE!
        </h3>
        <p className="text-gray-300 text-sm mb-6 leading-relaxed px-2">
          Ready to test your knowledge? Jump into Exam Mode and see how you score!
        </p>
        
        <div className="flex flex-col gap-3">
          <button 
            onClick={() => {
              setShowPromo(false);
              navigate('/exam');
            }}
            className="w-full bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-bold py-3.5 rounded-xl shadow-[0_0_20px_rgba(0,255,204,0.3)] hover:shadow-[0_0_30px_rgba(112,0,255,0.5)] transition-all active:scale-95 uppercase tracking-wider text-sm"
          >
            Play Now
          </button>
          <button 
            onClick={() => setShowPromo(false)}
            className="w-full bg-white/5 hover:bg-white/10 text-white/70 py-3 rounded-xl font-bold transition-all text-sm"
          >
            Maybe Later
          </button>
        </div>
      </div>
    </div>
  );
}
