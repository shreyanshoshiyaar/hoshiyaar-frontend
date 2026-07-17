import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import curriculumService from '../../../services/curriculumService';
import SimpleLoading from '../../ui/SimpleLoading';
import ParticleBackground from './ParticleBackground';

import { useAuth } from '../../../context/AuthContext';
import api from '../../../services/apiClient';

const ExamDashboard = ({ chapterId, chapterTitle, subjectName, chaptersList = [], onChangeChapter }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [examConfig, setExamConfig] = useState(null);
  const [latestScore, setLatestScore] = useState(null);
  const [examModeLive, setExamModeLive] = useState(false);
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    const fetchExamConfigAndScore = async () => {
      if (!chapterId) return;
      setLoading(true);
      try {
        const response = await curriculumService.getSetting(`exam_config_${chapterId}`);
        if (response.data && response.data.value) {
          setExamConfig(response.data.value);
        } else {
          setExamConfig(null);
        }
        
        try {
          const liveRes = await curriculumService.getSetting('exam_mode_live');
          if (liveRes.data && liveRes.data.value === true) {
            setExamModeLive(true);
          }
        } catch(e) {
          console.error("Failed to fetch exam_mode_live", e);
        }

        // Fetch latest score if user is logged in
        if (user && user._id) {
           const progRes = await api.get(`/api/auth/progress/${user._id}`);
           const progressData = progRes.data || [];
           // Match chapter progress (subject match is ideal but chapterId or order is safer if we know chapterTitle)
           // For robust matching, we look for 'ExamMode' in stats for any progress matching this subject/chapter
           const chapterProgress = progressData.find(p => p.subject === subjectName && (String(p.chapter) === String(chapterId) || p.lessonTitle === `ExamMode_${chapterId}` || p.stats?.['ExamMode'] || p.stats?.[`ExamMode_${chapterId}`]));
           
           let foundScore = null;
           if (chapterProgress && chapterProgress.stats) {
              const examStats = chapterProgress.stats[`ExamMode_${chapterId}`] || chapterProgress.stats['ExamMode'];
              if (examStats && examStats.lastScore !== undefined) {
                 foundScore = examStats.lastScore;
              }
           }
           // Fallback to local storage if API didn't have it yet
           const localScore = localStorage.getItem(`hoshiyaar_exam_score_${chapterId}`);
           if (foundScore !== null) {
              setLatestScore(foundScore);
           } else if (localScore !== null) {
              setLatestScore(Number(localScore));
           } else {
              setLatestScore(null);
           }
        }
      } catch (err) {
        console.error('Failed to fetch exam config', err);
        setExamConfig(null);
      }
      setLoading(false);
    };

    fetchExamConfigAndScore();
  }, [chapterId, user, subjectName]);

  if (!loading && !isAdmin && !examModeLive) {
    return (
      <div className="relative min-h-screen w-full flex flex-col items-center justify-center py-12 px-4 md:px-8 overflow-hidden bg-gradient-to-b from-[#0F204C] to-[#1A3673]">
        <ParticleBackground />
        <div className="bg-gradient-to-b from-[#1A2C5B] to-[#0F204C] rounded-2xl p-8 max-w-md w-full border border-white/10 shadow-2xl text-center relative overflow-hidden z-10 animate-fade-in">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-400 to-purple-500"></div>
          <h3 className="text-2xl font-black text-white mb-2 tracking-wide mt-4">Coming Soon!</h3>
          <p className="text-gray-300 mb-8 leading-relaxed">
            Hoshi is currently curating the best exam questions for you! Exam Mode is in beta testing and will be rolling out very soon. Stay tuned!
          </p>
          <button
            onClick={() => navigate('/')}
            className="w-full bg-white/10 hover:bg-white/20 border border-white/20 text-white py-3 rounded-xl font-bold tracking-wider transition-all"
          >
            BACK TO HOME
          </button>
        </div>
      </div>
    );
  }

  if (!chapterId) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] px-6 text-center relative z-10 overflow-hidden bg-gradient-to-b from-[#0F204C] to-[#1A3673]">
        <ParticleBackground />
        <div className="bg-black/30 backdrop-blur-xl border border-white/10 p-10 rounded-3xl shadow-2xl relative z-10">
          <h3 className="text-3xl font-black text-white mb-3 tracking-wide">No Chapter Selected</h3>
          <p className="text-gray-300 max-w-md text-lg">
            Please select a chapter from the dropdown below to access its exam.
          </p>
          {onChangeChapter && chaptersList.length > 0 && (
             <div className="mt-6 flex justify-center relative">
               <select 
                 value=""
                 onChange={(e) => {
                   const sel = chaptersList.find(c => String(c._id) === e.target.value);
                   if (sel) onChangeChapter(sel._id, sel.title);
                 }}
                 className="px-6 py-2 bg-blue-500/20 hover:bg-blue-500/40 text-blue-200 border border-blue-500/50 rounded-xl transition-all cursor-pointer outline-none appearance-none text-center"
               >
                 <option value="" disabled className="text-black">Change Topic</option>
                 {chaptersList.map(ch => (
                   <option key={ch._id} value={ch._id} className="text-black">{ch.title}</option>
                 ))}
               </select>
               <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-blue-200 text-xs">
                 ▼
               </div>
             </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center py-12 px-4 md:px-8 overflow-hidden bg-gradient-to-b from-[#0F204C] to-[#1A3673]">
      <ParticleBackground />
      
      <div className="w-full max-w-4xl relative z-10">
        {/* Header Card */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 text-white rounded-[1.5rem] p-5 md:p-6 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] w-full relative overflow-hidden mb-6 transition-transform hover:scale-[1.01] duration-500">
          <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-400/20 rounded-full -mr-20 -mt-20 blur-3xl mix-blend-screen"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/20 rounded-full -ml-10 -mb-10 blur-3xl mix-blend-screen"></div>
          
          <div className="relative z-10 text-center flex flex-col items-center justify-center">
            <h2 className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-purple-400 drop-shadow-sm mb-2">
              Exam Mode
            </h2>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 mt-1">
              {onChangeChapter && chaptersList.length > 0 ? (
                <div className="relative flex flex-col sm:flex-row items-center gap-2 group cursor-pointer">
                  <p className="text-white font-semibold text-lg tracking-wide text-center group-hover:text-cyan-200 transition-colors">
                    {chapterTitle || 'Loading...'}
                  </p>
                  <div className="relative flex items-center justify-center bg-white/10 hover:bg-white/20 border border-white/20 rounded-full px-2 py-0.5 transition-colors overflow-hidden">
                    <span className="text-[9px] text-white uppercase tracking-widest font-bold flex items-center gap-1">
                      Change Topic <span className="text-[7px] opacity-70">▼</span>
                    </span>
                    <select 
                      value=""
                      onChange={(e) => {
                        const sel = chaptersList.find(c => String(c._id) === e.target.value);
                        if (sel) onChangeChapter(sel._id, sel.title);
                      }}
                      className="absolute inset-0 opacity-0 cursor-pointer text-black"
                    >
                      <option value="" disabled>Change Topic</option>
                      {chaptersList.map(ch => (
                        <option key={ch._id} value={ch._id}>{ch.title}</option>
                      ))}
                    </select>
                  </div>
                </div>
              ) : (
                <p className="text-white font-semibold text-lg tracking-wide">{chapterTitle || 'Loading...'}</p>
              )}
            </div>
            <p className="text-cyan-200/80 text-xs mt-2 uppercase tracking-widest">{subjectName}</p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center my-8 bg-black/20 p-6 rounded-[1.5rem] backdrop-blur-md border border-white/10">
            <div className="flex flex-col items-center p-8">
              <div className="w-12 h-12 border-4 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin mb-4"></div>
              <p className="text-cyan-200/80 tracking-wide font-medium animate-pulse">Loading exam configuration...</p>
            </div>
          </div>
        ) : examConfig && examConfig.questions && examConfig.questions.length > 0 ? (
          <div className="bg-black/30 backdrop-blur-xl rounded-[1.5rem] p-6 sm:p-8 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] border border-white/10 w-full max-w-3xl mx-auto text-center flex flex-col items-center transform transition-all hover:-translate-y-1 duration-300 relative">
            <div className="flex items-center justify-center gap-6 mb-4 mt-2 bg-gradient-to-r from-white/5 to-white/10 border border-white/10 rounded-2xl px-6 py-4 shadow-[inset_0_0_20px_rgba(255,255,255,0.02)] backdrop-blur-md">
              <div className="text-4xl sm:text-5xl filter drop-shadow-lg animate-pulse">📝</div>
              <div className="flex flex-col items-start border-l-2 border-white/10 pl-5">
                 <span className="text-[10px] sm:text-xs text-cyan-300/80 uppercase tracking-[0.2em] font-bold mb-1 leading-none">Last Attempt</span>
                 <div className="flex items-baseline gap-1">
                   <span className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-yellow-300 to-orange-500 drop-shadow-sm leading-none">
                      {latestScore !== null ? latestScore : '--'}
                   </span>
                   {latestScore !== null && <span className="text-sm font-bold text-white/30 tracking-widest">/100</span>}
                 </div>
              </div>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-white mb-2 sm:mb-3 tracking-wide">Ready to test your knowledge?</h3>
            <p className="text-gray-300 mb-6 max-w-lg text-sm sm:text-base leading-relaxed px-2">
              This exam contains descriptive questions. The AI will evaluate your answers based on the specific subject context.
            </p>
            
            <button
              onClick={() => {
                navigate('/exam/play', { 
                  state: { 
                    questions: examConfig.questions,
                    subjectKnowledge: examConfig.subjectKnowledge,
                    chapterTitle,
                    chapterId 
                  } 
                });
              }}
              className="group relative w-full sm:w-auto overflow-hidden bg-gradient-to-r from-cyan-500 to-purple-600 text-white text-sm font-bold uppercase tracking-widest py-3 px-10 rounded-xl shadow-[0_0_20px_rgba(0,255,204,0.3)] hover:shadow-[0_0_30px_rgba(112,0,255,0.5)] transition-all duration-300 transform active:scale-95"
            >
              <span className="relative z-10">Start Exam</span>
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></div>
            </button>
          </div>
        ) : (
          <div className="bg-black/20 backdrop-blur-xl rounded-[2rem] p-10 shadow-[0_8px_32px_0_rgba(0,0,0,0.2)] border border-white/10 w-full max-w-2xl mx-auto text-center flex flex-col items-center">
            <div className="text-6xl mb-5 opacity-70 filter grayscale">⏳</div>
            <h3 className="text-2xl font-bold text-gray-200 mb-3 tracking-wide">No Exam Available</h3>
            <p className="text-gray-400 text-lg">
              An exam has not been configured for this chapter yet. <br/> Please check back later.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExamDashboard;
