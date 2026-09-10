import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import curriculumService from '../../../services/curriculumService';
import SimpleLoading from '../../ui/SimpleLoading';
import ParticleBackground from './ParticleBackground';
import { getApiBase } from '../../../utils/apiBase';

import { useAuth } from '../../../context/AuthContext';
import api from '../../../services/apiClient';

const ExamDashboard = ({ 
  chapterId, 
  chapterTitle, 
  subjectName, 
  chaptersList = [], 
  userClass: propUserClass, 
  onChangeChapter 
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [examConfig, setExamConfig] = useState(null);
  const [latestScore, setLatestScore] = useState(null);
  const [examModeLive, setExamModeLive] = useState(false);
  const [showRevisionPrompt, setShowRevisionPrompt] = useState(false);
  const [examLimits, setExamLimits] = useState(null);
  const [latestSession, setLatestSession] = useState(null);
  const [pastExamSessions, setPastExamSessions] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [availableChapters, setAvailableChapters] = useState([]);
  const [subjectExamChapters, setSubjectExamChapters] = useState([]);
  const [examChaptersLoaded, setExamChaptersLoaded] = useState(false);
  const [chaptersLoading, setChaptersLoading] = useState(false);
  const [chaptersLoadError, setChaptersLoadError] = useState(false);
  const [showChapterModal, setShowChapterModal] = useState(false);
  const [showOtherClasses, setShowOtherClasses] = useState(false);
  const cleanPhone = String(user?.phone || '').replace(/\D/g, '');
  const isAdmin = user?.role === 'admin' || 
                  ['9867735936', '7021970672', '9820277252'].some(p => cleanPhone.endsWith(p)) || 
                  ['Host', 'hostcbse', 'AKSHITRAVULA', 'AKSHIT', 'SB10', 'Nidhi sekhri'].includes(user?.username) ||
                  sessionStorage.getItem('isAdmin') === 'true';

  const fetchAvailableExamChapters = async () => {
    setChaptersLoading(true);
    setChaptersLoadError(false);
    try {
      let res = null;

      // 1. First try direct native fetch to avoid header/preflight interceptor issues
      try {
        const apiBase = getApiBase();
        const directResp = await fetch(`${apiBase}/api/curriculum/exam-chapters?_t=${Date.now()}`, {
          method: 'GET',
          cache: 'no-store'
        });
        if (directResp.ok) {
          const directData = await directResp.json();
          res = { data: directData };
        }
      } catch (directErr) {
        console.warn('[ExamDashboard] Direct fetch failed, trying curriculumService...', directErr);
      }

      // 2. Try curriculumService if direct fetch didn't return data
      if (!res?.data?.success) {
        try {
          res = await curriculumService.getExamAvailableChapters({ bypassCache: true });
        } catch (err1) {
          try {
            res = await curriculumService.getExamAvailableChapters();
          } catch (err2) {
            console.warn('[ExamDashboard] curriculumService fetch failed:', err2);
          }
        }
      }

      const payload = res?.data?.success ? res.data : (res?.data || res);
      let allExamChapters = [];
      if (Array.isArray(payload)) {
        allExamChapters = payload;
      } else if (payload?.chapters && Array.isArray(payload.chapters)) {
        allExamChapters = payload.chapters;
      }

      setAvailableChapters(allExamChapters);
      setChaptersLoadError(false);
    } catch (err) {
      console.error('Failed to fetch available exam chapters:', err);
      setChaptersLoadError(true);
    } finally {
      setChaptersLoading(false);
      setExamChaptersLoaded(true);
    }
  };

  useEffect(() => {
    fetchAvailableExamChapters();
  }, [chaptersList, chapterId]);

  useEffect(() => {
    if (showChapterModal) {
      fetchAvailableExamChapters();
    }
  }, [showChapterModal]);

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

           // Immediately populate exam history with loaded progressData and latest score
           await fetchUserExamHistory(progressData, foundScore ?? (localScore ? Number(localScore) : null));
        }
      } catch (err) {
        console.error('Failed to fetch exam config', err);
        setExamConfig(null);
      }
      setLoading(false);
    };

    fetchExamConfigAndScore();
  }, [chapterId, user, subjectName]);

  const fetchUserExamHistory = async (currentProgData = null, currentScore = null) => {
    if (!user?._id) return;
    setLoadingHistory(true);
    try {
      let sessions = [];
      try {
        const res = await api.get('/api/ai/history', {
          params: { userId: user._id }
        });
        if (res.data?.sessions && Array.isArray(res.data.sessions)) {
          sessions = res.data.sessions;
        }
      } catch (apiErr) {
        console.warn('Failed to fetch /api/ai/history:', apiErr);
      }

      // 1. Merge any local sessions stored in browser
      try {
        const localKeyPrefix = 'hoshiyaar_last_exam_session_';
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && k.startsWith(localKeyPrefix)) {
            const raw = localStorage.getItem(k);
            if (raw) {
              const parsed = JSON.parse(raw);
              if (parsed && parsed.chapterId && !sessions.some(s => String(s.chapterId) === String(parsed.chapterId) && s.createdAt === parsed.createdAt)) {
                sessions.push(parsed);
              }
            }
          }
        }
      } catch (locErr) {}

      // 2. Merge from user progress records (from DB User.chaptersProgress)
      if (currentProgData && Array.isArray(currentProgData)) {
        currentProgData.forEach(p => {
          if (!p.stats) return;
          const statsObj = p.stats;
          const examKey = Object.keys(statsObj).find(k => k.toLowerCase().includes('exam'));
          if (examKey) {
            const stat = statsObj[examKey];
            const cId = String(p.chapter);
            const score = stat?.lastScore !== undefined ? stat.lastScore : stat?.bestScore;
            if (score !== undefined && score !== null) {
              const exists = sessions.some(s => String(s.chapterId) === cId);
              if (!exists) {
                const matchChap = availableChapters.find(c => String(c.id || c.chapterNumber || c._id) === cId);
                sessions.push({
                  chapterId: cId,
                  chapterTitle: matchChap?.name || matchChap?.title || (cId === String(chapterId) ? chapterTitle : `Chapter ${cId}`),
                  finalScore: Number(score),
                  subject: p.subject || 'Science',
                  timeSpentSeconds: 0,
                  createdAt: stat?.lastReviewedAt || p.updatedAt || new Date().toISOString()
                });
              }
            }
          }
        });
      }

      // 3. If current chapter has a score, ensure it's displayed in previous analyses
      const effectiveScore = currentScore !== null ? currentScore : latestScore;
      if (effectiveScore !== null && chapterId) {
        const exists = sessions.some(s => String(s.chapterId) === String(chapterId));
        if (!exists) {
          sessions.unshift({
            chapterId: String(chapterId),
            chapterTitle: chapterTitle || `Chapter ${chapterId}`,
            finalScore: Number(effectiveScore),
            subject: subjectName || 'Science',
            timeSpentSeconds: 0,
            createdAt: new Date().toISOString()
          });
        }
      }

      sessions.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      setPastExamSessions(sessions);
    } catch (err) {
      console.warn('Failed to fetch user exam history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (user?._id) {
      fetchUserExamHistory();
    }
  }, [user?._id, chapterId]);

  const openPastReview = async (sessionToPass) => {
    if (!sessionToPass) return;
    let configForSession = examConfig;
    if (String(sessionToPass.chapterId) !== String(chapterId)) {
      try {
        const resp = await curriculumService.getSetting(`exam_config_${sessionToPass.chapterId}`);
        if (resp.data?.value) {
          configForSession = resp.data.value;
        }
      } catch (e) {}
    }

    let sessionQuestions = sessionToPass.questions;
    if (!sessionQuestions || sessionQuestions.length === 0) {
      const localSaved = localStorage.getItem(`hoshiyaar_last_exam_session_${sessionToPass.chapterId}`);
      if (localSaved) {
        try {
          const parsed = JSON.parse(localSaved);
          if (parsed?.questions?.length > 0) {
            sessionQuestions = parsed.questions;
          }
        } catch (e) {}
      }
    }

    navigate('/exam/flow', {
      state: {
        pastSession: { ...sessionToPass, questions: sessionQuestions },
        isPastReview: true,
        startScreen: 'ANALYSIS',
        chapterTitle: sessionToPass.chapterTitle || configForSession?.chapterTitle || chapterTitle,
        chapterId: sessionToPass.chapterId || chapterId,
        subjectKnowledge: sessionToPass.subject || configForSession?.subjectKnowledge || subjectName,
        flowItems: (sessionQuestions && sessionQuestions.length > 0) ? sessionQuestions : (configForSession?.flowItems || []),
        revisionCards: configForSession?.revisionCards,
        questions: configForSession?.questions,
        mcqs: configForSession?.mcqs
      }
    });
  };

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

  const normalizeClass = (c) => String(c || '').replace(/^class\s*/i, '').replace(/(?:st|nd|rd|th)$/i, '').trim();

  const currentChapterObj = availableChapters.find(c => String(c._id) === String(chapterId));
  const displaySubjectName = currentChapterObj?.subjectId?.name || subjectName;

  const activeClass = normalizeClass(
    propUserClass ||
    user?.classLevel || 
    user?.class || 
    user?.classTitle || 
    currentChapterObj?.subjectId?.classId?.name || 
    ''
  );

  const isMatchingClass = (ch) => {
    if (!activeClass) return true;
    const chClass = normalizeClass(ch?.subjectId?.classId?.name || ch?.classLevel || ch?.classTitle || '');
    if (chClass) return String(chClass) === String(activeClass);
    if (chaptersList && chaptersList.some(c => String(c._id) === String(ch._id))) return true;
    return false;
  };

  const classExamChapters = availableChapters.filter(isMatchingClass);

  if (!chapterId) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] px-6 text-center relative z-10 overflow-hidden bg-gradient-to-b from-[#0F204C] to-[#1A3673]">
        <ParticleBackground />
        <div className="bg-black/30 backdrop-blur-xl border border-white/10 p-10 rounded-3xl shadow-2xl relative z-10">
          <h3 className="text-3xl font-black text-white mb-3 tracking-wide">No Chapter Selected</h3>
          <p className="text-gray-300 max-w-md text-lg">
            Please select a chapter from the dropdown below to access its exam.
          </p>
          {onChangeChapter && availableChapters.length > 0 && (
             <div className="mt-6 flex justify-center relative w-full max-w-md mx-auto">
               <div className="relative w-full">
                 <select 
                   value=""
                   onChange={(e) => {
                     const sel = availableChapters.find(c => String(c._id) === e.target.value);
                     if (sel) onChangeChapter(sel._id, sel.title);
                   }}
                   className="w-full appearance-none bg-blue-500/20 hover:bg-blue-500/40 text-blue-200 border border-blue-500/50 py-3 pl-4 pr-10 rounded-xl transition-all cursor-pointer outline-none text-center font-bold"
                 >
                   <option value="" disabled className="text-black bg-white">Select a Chapter with Exam</option>
                   {classExamChapters.length > 0 ? (
                     <optgroup label={activeClass ? `Class ${activeClass} Exams` : "Available Exams"} className="text-gray-700 font-bold">
                       {classExamChapters.map(ch => (
                         <option key={ch._id} value={ch._id} className="text-black bg-white font-medium">
                           {ch.title}
                         </option>
                       ))}
                     </optgroup>
                   ) : (
                     availableChapters.map(ch => (
                       <option key={ch._id} value={ch._id} className="text-black bg-white font-medium">
                         {ch.title}{ch.subjectId?.name && ch.subjectId?.name !== subjectName ? ` (${ch.subjectId.name})` : ''}
                       </option>
                     ))
                   )}
                 </select>
                 <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-blue-200 text-xs">
                   ▼
                 </div>
               </div>
             </div>
          )}
        </div>
      </div>
    );
  }

  const renderChapterButton = (ch) => {
    const isSelected = String(ch._id) === String(chapterId);
    const chClassName = ch.subjectId?.classId?.name || ch.classLevel || '';
    return (
      <button
        key={ch._id}
        onClick={() => {
          if (onChangeChapter) onChangeChapter(ch._id, ch.title);
          setShowChapterModal(false);
        }}
        className={`w-full text-left p-3 rounded-xl border transition-all duration-200 flex items-center justify-between gap-2.5 cursor-pointer ${
          isSelected
            ? 'bg-gradient-to-r from-cyan-500/25 to-blue-600/25 border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.25)]'
            : 'bg-white/5 hover:bg-white/10 border-white/10 hover:border-cyan-400/40'
        }`}
      >
        <div className="flex-1 min-w-0">
          <p className={`font-bold text-xs sm:text-sm leading-snug truncate ${isSelected ? 'text-cyan-200' : 'text-white'}`}>
            {ch.title}
          </p>
          <p className="text-[10px] text-gray-400 mt-0.5 uppercase tracking-wider font-semibold">
            {ch.subjectId?.name || subjectName} {chClassName ? `• Class ${chClassName}` : ''}
          </p>
        </div>
        <div className="shrink-0 flex items-center gap-1.5">
          {isSelected && (
            <span className="w-5 h-5 rounded-full bg-cyan-400 text-slate-900 flex items-center justify-center text-[10px] font-black">
              ✓
            </span>
          )}
        </div>
      </button>
    );
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] md:min-h-screen w-full flex flex-col items-center justify-start py-5 px-3 sm:px-6 overflow-hidden bg-gradient-to-b from-[#0F204C] to-[#1A3673]">
      <ParticleBackground />
      
      <div className="w-full max-w-2xl relative z-10 flex flex-col items-center">
        {/* Header Card */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 text-white rounded-2xl p-3.5 sm:p-4 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] w-full relative overflow-hidden mb-3 transition-transform hover:scale-[1.005] duration-300">
          <div className="absolute top-0 right-0 w-48 h-48 bg-cyan-400/20 rounded-full -mr-16 -mt-16 blur-3xl mix-blend-screen pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-36 h-36 bg-purple-500/20 rounded-full -ml-8 -mb-8 blur-3xl mix-blend-screen pointer-events-none"></div>
          
          <div className="relative z-10 text-center flex flex-col items-center justify-center">
            <h2 className="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-purple-400 drop-shadow-sm mb-0.5 tracking-wide">
              Exam Mode
            </h2>
            <div className="flex flex-col items-center justify-center gap-1.5 mt-1 w-full max-w-lg mx-auto">
              <p className="text-white font-extrabold text-sm sm:text-base tracking-wide text-center leading-snug">
                {chapterTitle || 'Loading...'}
              </p>
              {onChangeChapter && (
                <button
                  onClick={() => {
                    setShowChapterModal(true);
                    fetchAvailableExamChapters();
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/50 hover:border-cyan-300 text-cyan-200 hover:text-white text-xs font-black tracking-wider uppercase transition-all shadow-sm active:scale-95 cursor-pointer"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                  <span>Change Chapter</span>
                  <span className="text-[10px] opacity-75">▼</span>
                </button>
              )}
            </div>
            <p className="text-cyan-200/80 text-[10px] sm:text-xs mt-1 uppercase tracking-widest font-semibold">{displaySubjectName}</p>
          </div>
        </div>

        {loading || !examChaptersLoaded ? (
          <div className="flex justify-center my-4 bg-black/20 p-5 rounded-2xl backdrop-blur-md border border-white/10 w-full">
            <div className="flex flex-col items-center p-4">
              <div className="w-8 h-8 border-3 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin mb-3"></div>
              <p className="text-cyan-200/80 text-xs tracking-wide font-medium animate-pulse">Loading exam configuration...</p>
            </div>
          </div>
        ) : examConfig && ((examConfig.questions && examConfig.questions.length > 0) || (examConfig.flowItems && examConfig.flowItems.length > 0)) ? (
          <div className="bg-black/30 backdrop-blur-xl rounded-2xl p-4 sm:p-5 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] border border-white/10 w-full text-center flex flex-col items-center relative">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-3 bg-gradient-to-r from-white/5 to-white/10 border border-white/10 rounded-xl px-4 py-2.5 shadow-[inset_0_0_20px_rgba(255,255,255,0.02)] backdrop-blur-md w-full max-w-sm">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-400/20 text-amber-300 flex items-center justify-center text-base font-bold">
                  📝
                </div>
                <div className="flex flex-col items-start border-l-2 border-white/10 pl-2.5">
                   <span className="text-[9px] text-cyan-300/80 uppercase tracking-[0.15em] font-bold mb-0.5 leading-none">Last Score</span>
                   <div className="flex items-baseline gap-1">
                     <span className="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-br from-yellow-300 to-orange-500 drop-shadow-sm leading-none">
                        {latestScore !== null ? latestScore : '--'}
                     </span>
                     {latestScore !== null && <span className="text-[10px] font-bold text-white/30 tracking-widest">/100</span>}
                   </div>
                </div>
              </div>
            </div>

            {/* Live Attempts Left Pill */}
            {examLimits && (
              <div className={`flex items-center justify-center gap-1.5 px-3 py-1 rounded-full mb-2.5 text-[11px] font-black tracking-wide border shadow-sm ${
                examLimits.exhausted 
                  ? 'bg-rose-500/20 text-rose-200 border-rose-500/40' 
                  : 'bg-cyan-500/20 text-cyan-200 border-cyan-400/30'
              }`}>
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                <span>{examLimits.attemptsLeftMessage || '3 of 3 attempts remaining this week'}</span>
              </div>
            )}

            <h3 className="text-base sm:text-lg font-extrabold text-white mb-1 tracking-wide">Ready to test your knowledge?</h3>
            <p className="text-gray-300 mb-3 max-w-md text-xs leading-relaxed px-2">
              This exam evaluates your descriptive and MCQ answers with strict AI scoring and concept feedback.
            </p>

            {/* Limit Exhaustion Alert Banner */}
            {examLimits?.exhausted && (
              <div className="w-full max-w-md p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-200 text-xs font-semibold mb-3 flex items-start gap-2.5 text-left animate-in fade-in">
                <svg className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <p className="font-extrabold text-white mb-0.5">Attempt Limit Reached</p>
                  <p className="text-[11px] text-rose-200/90 leading-relaxed">
                    {examLimits.exhaustedMessage || 'You have reached your weekly limit for Exam Mode. Your attempts will reset on Monday!'}
                  </p>
                </div>
              </div>
            )}
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 w-full max-w-lg mx-auto mt-1">
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
                className={`group relative flex-1 w-full min-h-[44px] overflow-hidden text-xs font-black uppercase tracking-wider px-5 py-2.5 rounded-xl transition-all duration-300 transform flex items-center justify-center gap-2 ${
                  examLimits?.exhausted
                    ? 'bg-gray-700/60 text-gray-400 border border-gray-600 cursor-not-allowed'
                    : 'bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 text-white shadow-[0_4px_16px_rgba(6,182,212,0.35)] hover:shadow-[0_4px_20px_rgba(6,182,212,0.55)] active:scale-95 cursor-pointer border border-cyan-400/30'
                }`}
              >
                <svg className="w-3.5 h-3.5 text-cyan-200 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                    let sessionToPass = latestSession;
                    if (!sessionToPass || !sessionToPass.questions || sessionToPass.questions.length === 0) {
                      const localSaved = localStorage.getItem(`hoshiyaar_last_exam_session_${chapterId}`);
                      if (localSaved) {
                        try {
                          const parsed = JSON.parse(localSaved);
                          if (parsed && parsed.questions && parsed.questions.length > 0) {
                            sessionToPass = parsed;
                          }
                        } catch (e) {
                          console.error("Failed to parse local session", e);
                        }
                      }
                    }

                    if (!sessionToPass) {
                      sessionToPass = {
                        finalScore: latestScore !== null ? latestScore : 0,
                        chapterTitle,
                        chapterId,
                        questions: (examConfig?.flowItems || []).filter(i => i.type !== 'revision_card').map((item, idx) => ({
                          id: `item_${idx}`,
                          type: item.type,
                          question: item.text || item.question || item.content?.text || '',
                          expectedAnswer: item.expected || item.expectedAnswer || item.content?.expected || '',
                          userAnswer: '',
                          score: 0,
                          isCorrect: false,
                          options: item.options || item.content?.options || []
                        }))
                      };
                    }
                    openPastReview(sessionToPass);
                  }}
                  className="flex-1 w-full min-h-[44px] px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-700 hover:from-purple-500 hover:to-indigo-600 text-white border border-purple-400/40 shadow-[0_4px_16px_rgba(147,51,234,0.35)] hover:shadow-[0_4px_20px_rgba(147,51,234,0.55)] transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 whitespace-nowrap"
                >
                  <svg className="w-3.5 h-3.5 text-purple-200 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <span className="whitespace-nowrap">Review Analysis</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-black/20 backdrop-blur-xl rounded-2xl p-6 sm:p-8 shadow-[0_8px_32px_0_rgba(0,0,0,0.2)] border border-white/10 w-full text-center flex flex-col items-center">
            <div className="text-4xl sm:text-5xl mb-3 opacity-70 filter grayscale">⏳</div>
            <h3 className="text-lg sm:text-xl font-bold text-gray-200 mb-1.5 tracking-wide">No Exam Available</h3>
            <p className="text-gray-400 text-xs sm:text-sm max-w-md mb-4">
              An exam has not been configured for this chapter yet. <br/>
              Please check back later or choose an available chapter below.
            </p>
            {onChangeChapter && (
              <button
                onClick={() => {
                  setShowChapterModal(true);
                  fetchAvailableExamChapters();
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-cyan-500/25 transition-all active:scale-95 cursor-pointer"
              >
                <span>Select Available Chapter</span>
                <span className="text-xs">→</span>
              </button>
            )}
          </div>
        )}

        {/* --- DEDICATED PREVIOUS EXAM ANALYSES SECTION --- */}
        <div className="w-full mt-6 mb-6">
          <div className="flex items-center justify-between mb-3 px-1">
            <div className="flex items-center gap-2">
              <span className="text-base sm:text-lg">📜</span>
              <h3 className="text-sm sm:text-base font-black text-white tracking-wide">
                Previous Exam Analyses
              </h3>
            </div>
            {pastExamSessions.length > 0 && (
              <span className="text-[11px] font-bold text-cyan-200/70 bg-white/10 px-2.5 py-0.5 rounded-full border border-white/10">
                {pastExamSessions.length} {pastExamSessions.length === 1 ? 'attempt' : 'attempts'}
              </span>
            )}
          </div>

          {loadingHistory ? (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center text-cyan-200/70 text-xs backdrop-blur-md">
              <div className="w-5 h-5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              Loading your past exam analyses...
            </div>
          ) : pastExamSessions.length === 0 ? (
            <div className="bg-black/25 backdrop-blur-md border border-white/10 rounded-2xl p-5 text-center text-gray-300 text-xs">
              <p className="font-semibold text-white/90 mb-1">No Past Exam Analyses Found</p>
              <p className="text-[11px] text-gray-400 max-w-sm mx-auto">
                When you complete an exam, your detailed question-by-question analysis and AI feedback will appear here so you can review anytime.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {pastExamSessions.map((session, sIdx) => {
                const score = session.finalScore !== undefined ? session.finalScore : 0;
                const isPassed = score >= 70;
                const isAverage = score >= 50 && score < 70;
                const dateStr = session.createdAt ? new Date(session.createdAt).toLocaleDateString(undefined, {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                }) : 'Recent';

                return (
                  <div
                    key={session._id || sIdx}
                    className="bg-black/35 hover:bg-black/50 backdrop-blur-md border border-white/10 hover:border-cyan-400/40 rounded-2xl p-3.5 sm:p-4 transition-all shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div
                        className={`w-11 h-11 rounded-xl flex items-center justify-center font-black text-sm shrink-0 border shadow-inner ${
                          isPassed
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            : isAverage
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                        }`}
                      >
                        {score}%
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs sm:text-sm font-black text-white truncate group-hover:text-cyan-200 transition-colors">
                          {session.chapterTitle || 'Chapter Exam'}
                        </h4>
                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-[10px] sm:text-[11px] text-cyan-200/70 mt-1">
                          <span>📅 {dateStr}</span>
                          {session.timeSpentSeconds > 0 && (
                            <>
                              <span>•</span>
                              <span>⏱ {Math.floor(session.timeSpentSeconds / 60)}m {session.timeSpentSeconds % 60}s</span>
                            </>
                          )}
                          {session.questions && (
                            <>
                              <span>•</span>
                              <span>{session.questions.length} questions</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => openPastReview(session)}
                      className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white border border-purple-400/30 shadow-md transition-all flex items-center justify-center gap-1.5 shrink-0 active:scale-95 cursor-pointer"
                    >
                      <span>Review Analysis</span>
                      <span>➔</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Chapter Selection Modal */}
      {showChapterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-gradient-to-b from-[#1A2C5B] to-[#0F204C] border border-cyan-400/30 rounded-2xl p-4 sm:p-5 w-full max-w-md shadow-2xl relative text-white flex flex-col max-h-[82vh]">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
              <div>
                <h3 className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-purple-400">
                  Select Exam Chapter
                </h3>
                <p className="text-[11px] text-cyan-200/70 mt-0.5">
                  {activeClass ? `Available exams for Class ${activeClass}` : 'Only chapters with active exams are available'}
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => fetchAvailableExamChapters()}
                  className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-cyan-200 hover:text-white flex items-center justify-center text-xs font-bold transition-all cursor-pointer"
                  title="Refresh exams"
                >
                  🔄
                </button>
                <button
                  onClick={() => setShowChapterModal(false)}
                  className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white flex items-center justify-center text-sm font-bold transition-all cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Chapters List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {chaptersLoading && availableChapters.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-cyan-200/80 gap-2">
                  <div className="w-6 h-6 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin"></div>
                  <p className="text-xs font-medium animate-pulse">Loading available exam chapters...</p>
                </div>
              ) : chaptersLoadError && availableChapters.length === 0 ? (
                <div className="text-center py-6 text-rose-300 space-y-2">
                  <p className="text-xs">Failed to load exam chapters.</p>
                  <button
                    onClick={() => fetchAvailableExamChapters()}
                    className="px-3 py-1 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-200 text-xs font-bold rounded-lg border border-cyan-400/30 transition-all cursor-pointer"
                  >
                    🔄 Retry
                  </button>
                </div>
              ) : classExamChapters.length === 0 ? (
                <div className="py-3 space-y-3">
                  <div className="text-center bg-white/5 border border-white/10 rounded-xl p-4">
                    <div className="text-2xl mb-1 opacity-80">📖</div>
                    <p className="text-xs font-bold text-white">
                      No exams configured for Class {activeClass || 'this class'} yet
                    </p>
                    <p className="text-[11px] text-cyan-200/70 mt-1 max-w-xs mx-auto">
                      Exams for Class {activeClass || 'your class'} are being prepared. Check back soon!
                    </p>
                    <button
                      onClick={() => fetchAvailableExamChapters()}
                      className="mt-3 px-3 py-1 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-200 text-xs font-bold rounded-lg border border-cyan-400/30 transition-all cursor-pointer"
                    >
                      🔄 Refresh
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between px-1 mb-1">
                    <span className="text-[10px] uppercase tracking-wider font-bold text-cyan-300">
                      {activeClass ? `Class ${activeClass} Exams` : 'Available Exams'}
                    </span>
                    <span className="text-[9px] bg-cyan-500/20 text-cyan-200 px-2 py-0.5 rounded-full border border-cyan-400/30 font-bold">
                      {classExamChapters.length}
                    </span>
                  </div>

                  {classExamChapters.map(ch => renderChapterButton(ch))}
                </>
              )}
            </div>

            {/* Footer */}
            <div className="pt-3 mt-3 border-t border-white/10 text-center">
              <button
                onClick={() => setShowChapterModal(false)}
                className="w-full py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExamDashboard;
