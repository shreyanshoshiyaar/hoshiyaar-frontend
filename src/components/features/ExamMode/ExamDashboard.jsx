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
  const [showRevisionPrompt, setShowRevisionPrompt] = useState(false);
  const [examLimits, setExamLimits] = useState(null);
  const [latestSession, setLatestSession] = useState(null);
  const cleanPhone = (user?.phone || '').replace(/\D/g, '');
  const isAdmin = user?.role === 'admin' || 
                  cleanPhone.endsWith('9867735936') || 
                  ['Host', 'hostcbse'].includes(user?.username) ||
                  sessionStorage.getItem('isAdmin') === 'true';

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

        // Fetch latest score and session if user is logged in
        if (user && user._id) {
           const progRes = await api.get(`/api/auth/progress/${user._id}`);
           const progressData = progRes.data || [];
           const chapterProgress = progressData.find(p => p.subject === subjectName && (String(p.chapter) === String(chapterId) || p.lessonTitle === `ExamMode_${chapterId}` || p.stats?.['ExamMode'] || p.stats?.[`ExamMode_${chapterId}`]));
           
           let foundScore = null;
           if (chapterProgress && chapterProgress.stats) {
              const examStats = chapterProgress.stats[`ExamMode_${chapterId}`] || chapterProgress.stats['ExamMode'];
              if (examStats && examStats.lastScore !== undefined) {
                 foundScore = examStats.lastScore;
              }
           }
           const localScore = localStorage.getItem(`hoshiyaar_exam_score_${chapterId}`);
           const localSessionStr = localStorage.getItem(`hoshiyaar_last_exam_session_${chapterId}`);
           let localSession = null;
           if (localSessionStr) {
              try {
                 localSession = JSON.parse(localSessionStr);
              } catch(e) {}
           }
           
           if (foundScore !== null) {
              setLatestScore(foundScore);
           } else if (localScore !== null) {
              setLatestScore(Number(localScore));
           } else if (localSession && localSession.finalScore !== undefined) {
              setLatestScore(Number(localSession.finalScore));
           } else {
              setLatestScore(null);
           }

           // Fetch latest exam session for past review
           try {
             const sessionRes = await api.get('/api/ai/latest-session', {
               params: { userId: user._id, chapterId }
             });
             if (sessionRes.data?.session) {
               setLatestSession(sessionRes.data.session);
               if (foundScore === null && sessionRes.data.session.finalScore !== undefined) {
                 setLatestScore(sessionRes.data.session.finalScore);
               }
             } else if (localSession) {
               setLatestSession(localSession);
             } else {
               setLatestSession(null);
             }
           } catch (sErr) {
             console.warn('Failed to fetch latest session:', sErr);
             if (localSession) setLatestSession(localSession);
             else setLatestSession(null);
           }

           // Fetch live attempt limits from backend
           try {
             const limitsRes = await api.get('/api/ai/limits', {
               params: { userId: user._id, chapterId }
             });
             if (limitsRes.data) {
               setExamLimits(limitsRes.data);
             }
           } catch (lErr) {
             console.warn('Failed to fetch exam limits', lErr);
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

  // Show Coming Soon immediately for non-admins to avoid long loading screen, 
  // it will automatically update if examModeLive is fetched as true
  if (!isAdmin && !examModeLive) {
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
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 mb-4 mt-2 bg-gradient-to-r from-white/5 to-white/10 border border-white/10 rounded-2xl px-6 py-4 shadow-[inset_0_0_20px_rgba(255,255,255,0.02)] backdrop-blur-md w-full max-w-md">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center text-xl font-bold">
                  📝
                </div>
                <div className="flex flex-col items-start border-l-2 border-white/10 pl-3">
                   <span className="text-[10px] text-cyan-300/80 uppercase tracking-[0.2em] font-bold mb-1 leading-none">Last Score</span>
                   <div className="flex items-baseline gap-1">
                     <span className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-br from-yellow-300 to-orange-500 drop-shadow-sm leading-none">
                        {latestScore !== null ? latestScore : '--'}
                     </span>
                     {latestScore !== null && <span className="text-xs font-bold text-white/30 tracking-widest">/100</span>}
                   </div>
                </div>
              </div>
            </div>

            {/* Live Attempts Left Pill */}
            {examLimits && (
              <div className={`flex items-center justify-center gap-2 px-4 py-1.5 rounded-full mb-3 text-xs font-black tracking-wide border shadow-sm ${
                examLimits.exhausted 
                  ? 'bg-rose-500/20 text-rose-200 border-rose-500/40' 
                  : 'bg-cyan-500/20 text-cyan-200 border-cyan-400/30'
              }`}>
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                <span>{examLimits.attemptsLeftMessage || '3 of 3 attempts remaining this week'}</span>
              </div>
            )}

            <h3 className="text-xl sm:text-2xl font-black text-white mb-2 tracking-wide">Ready to test your knowledge?</h3>
            <p className="text-gray-300 mb-4 max-w-lg text-xs sm:text-sm leading-relaxed px-2">
              This exam evaluates your descriptive and MCQ answers with strict AI scoring and concept feedback.
            </p>

            {/* Limit Exhaustion Alert Banner */}
            {examLimits?.exhausted && (
              <div className="w-full max-w-md p-4 rounded-2xl bg-rose-950/60 border border-rose-500/40 text-rose-200 text-xs sm:text-sm font-semibold mb-6 flex items-start gap-3 text-left animate-in fade-in">
                <svg className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <p className="font-extrabold text-white mb-0.5">Attempt Limit Reached</p>
                  <p className="text-xs text-rose-200/90 leading-relaxed">
                    {examLimits.exhaustedMessage || 'You have reached your weekly limit for Exam Mode. Your attempts will reset on Monday!'}
                  </p>
                </div>
              </div>
            )}
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 w-full max-w-xl mx-auto mt-2">
              <button
                onClick={() => {
                  if (examLimits?.exhausted) return;
                  navigate('/exam/flow', { 
                    state: { 
                      flowItems: examConfig.flowItems,
                      revisionCards: examConfig.revisionCards,
                      questions: examConfig.questions,
                      mcqs: examConfig.mcqs,
                      subjectKnowledge: examConfig.subjectKnowledge,
                      chapterTitle,
                      chapterId 
                    } 
                  });
                }}
                disabled={examLimits?.exhausted}
                className={`group relative flex-1 w-full min-h-[52px] overflow-hidden text-xs sm:text-sm font-black uppercase tracking-wider px-6 rounded-2xl transition-all duration-300 transform flex items-center justify-center gap-2.5 ${
                  examLimits?.exhausted
                    ? 'bg-gray-700/60 text-gray-400 border border-gray-600 cursor-not-allowed'
                    : 'bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 text-white shadow-[0_4px_20px_rgba(6,182,212,0.35)] hover:shadow-[0_4px_25px_rgba(6,182,212,0.55)] active:scale-95 cursor-pointer border border-cyan-400/30'
                }`}
              >
                <svg className="w-4 h-4 text-cyan-200 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="relative z-10 whitespace-nowrap">
                  {examLimits?.exhausted 
                    ? 'Limit Exhausted' 
                    : (latestScore !== null ? 'Re-attempt Exam' : 'Start Exam')}
                </span>
                {!examLimits?.exhausted && (
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></div>
                )}
              </button>

              {(latestSession || latestScore !== null) && (
                <button
                  onClick={() => {
                    const sessionToPass = latestSession || {
                      finalScore: latestScore,
                      questions: (examConfig?.flowItems || []).filter(i => i.type !== 'revision_card').map((item, idx) => ({
                        id: `item_${idx}`,
                        type: item.type,
                        question: item.text || item.question || item.content?.text || '',
                        expectedAnswer: item.expected || item.expectedAnswer || item.content?.expected || '',
                        userAnswer: '',
                        score: item.type === 'mcq' ? 100 : 50,
                        isCorrect: true,
                        options: item.options || item.content?.options || []
                      }))
                    };
                    navigate('/exam/flow', {
                      state: {
                        pastSession: sessionToPass,
                        isPastReview: true,
                        startScreen: 'ANALYSIS',
                        chapterTitle,
                        chapterId,
                        subjectKnowledge: examConfig?.subjectKnowledge || subjectName,
                        flowItems: examConfig?.flowItems,
                        revisionCards: examConfig?.revisionCards,
                        questions: examConfig?.questions,
                        mcqs: examConfig?.mcqs
                      }
                    });
                  }}
                  className="flex-1 w-full min-h-[52px] px-6 rounded-2xl font-black text-xs sm:text-sm uppercase tracking-wider bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-700 hover:from-purple-500 hover:to-indigo-600 text-white border border-purple-400/40 shadow-[0_4px_20px_rgba(147,51,234,0.35)] hover:shadow-[0_4px_25px_rgba(147,51,234,0.55)] transition-all flex items-center justify-center gap-2.5 cursor-pointer active:scale-95 whitespace-nowrap"
                >
                  <svg className="w-4 h-4 text-purple-200 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <span className="whitespace-nowrap">Review Analysis</span>
                </button>
              )}
            </div>
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
