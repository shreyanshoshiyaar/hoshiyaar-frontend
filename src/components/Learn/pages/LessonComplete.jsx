import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useReview } from '../../../context/ReviewContext.jsx';
import { useAuth } from '../../../context/AuthContext.jsx';
import { useStars } from '../../../context/StarsContext.jsx';
import lessonCompleteCharacters from '../../../assets/images/lesson_complete_characters.png';
import victorySound from '../../../assets/sounds/victory.mp3';
import SimpleLoading from '../../ui/SimpleLoading.jsx';
import { trackLevelEnd, trackFirstModuleCompleted } from '../../../utils/analytics.js';
import { getLearningParams } from '../../../utils/analyticsHelpers.js';
import { useModuleItems } from '../../../hooks/useModuleItems';
import ConfettiAnimation from '../../ui/ConfettiAnimation.jsx';
import curriculumService from '../../../services/curriculumService.js';
import { isMissionCompleteItem, parseCaseClosedText } from '../../../utils/missionCompleteHelper.js';
import { markModuleAsCompleted } from '../../../utils/progressSyncService.js';
import { getApiBase } from '../../../utils/apiBase.js';
import { stopAllAudio } from '../../../utils/audioPreloadService.js';
import TrialTimerBar from '../../features/Subscription/TrialTimerBar.jsx';
import { vibrateSuccess } from '../../../utils/vibrationService.js';

// Sound synthesis for points tally animation
const playPointTick = (pitch = 800) => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(pitch, ctx.currentTime);
    gain.gain.setValueAtTime(0.06, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.07);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.07);
  } catch (_) {}
};

const playPointFinish = () => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.08);
      gain.gain.setValueAtTime(0.12, ctx.currentTime + i * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.08 + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + i * 0.08);
      osc.stop(ctx.currentTime + i * 0.08 + 0.35);
    });
  } catch (_) {}
};

const LessonComplete = () => {
  const navigate = useNavigate();
  const { moduleNumber: paramModuleNumber } = useParams();

  const searchParams = new URLSearchParams(window.location.search);
  const currentModuleId = searchParams.get('moduleId') || searchParams.get('chapter') || paramModuleNumber;
  const currentChapterId = searchParams.get('chapterId');
  const currentUnitId = searchParams.get('unitId');
  const passedTitle = searchParams.get('title');

  const { items } = useModuleItems(currentModuleId);
  const [isChecking, setIsChecking] = useState(true);
  const { getStagedForModule, clearStagedForModule } = useReview();
  const { user, updateUser } = useAuth();
  const { stars, moduleStars } = useStars();
  const [scores, setScores] = useState({ best: 0, last: 0 });
  const [showConfetti, setShowConfetti] = useState(false);
  const [, setCurrentStreakCount] = useState(() => Math.max(1, Number(user?.streak) || 1));

  const [nextModule, setNextModule] = useState(null);
  const [currentModuleData, setCurrentModuleData] = useState(null);

  // Case Closed summary extraction
  const caseClosedItem = React.useMemo(() => {
    return items?.find(isMissionCompleteItem);
  }, [items]);

  const { summary: caseSummary, nextCase: caseNextCase } = React.useMemo(() => {
    return parseCaseClosedText(caseClosedItem?.text);
  }, [caseClosedItem]);

  const [isPlayingCaseAudio, setIsPlayingCaseAudio] = useState(false);
  const caseAudioRef = useRef(null);

  const handleToggleCaseAudio = (e) => {
    e.stopPropagation();
    if (isPlayingCaseAudio && caseAudioRef.current) {
      caseAudioRef.current.pause();
      setIsPlayingCaseAudio(false);
      return;
    }

    if (!caseClosedItem?.text) return;

    // Silence any background/celebration sounds before playing summary audio
    stopAllAudio();

    if (caseAudioRef.current) {
      caseAudioRef.current.pause();
      caseAudioRef.current = null;
    }

    const ttsText = (caseSummary || '') + (caseNextCase ? ` Next case: ${caseNextCase}` : '');
    const apiBase = getApiBase();
    const audioUrl = `${apiBase}/api/ai/tts-card?text=${encodeURIComponent(ttsText)}&voice=hoshi&v=15`;
    const audio = new Audio(audioUrl);
    caseAudioRef.current = audio;
    audio.onended = () => setIsPlayingCaseAudio(false);
    audio.onerror = () => setIsPlayingCaseAudio(false);
    setIsPlayingCaseAudio(true);
    audio.play().catch(() => setIsPlayingCaseAudio(false));
  };

  // Celebration buzz once when the lesson-complete screen opens
  useEffect(() => { vibrateSuccess(); }, []);

  useEffect(() => {
    return () => {
      if (caseAudioRef.current) {
        caseAudioRef.current.pause();
        caseAudioRef.current = null;
      }
    };
  }, []);

  // Points addition animation states
  const [animationPhase, setAnimationPhase] = useState('idle'); // 'idle' | 'adding' | 'done'
  const [displayPoints, setDisplayPoints] = useState(0);
  const animationRanRef = useRef(false);

  // Mark module as completed in localStorage and database immediately
  useEffect(() => {
    if (currentModuleId) {
      markModuleAsCompleted({
        userId: user?._id,
        subject: user?.subject || 'Science',
        chapterId: currentChapterId,
        unitId: currentUnitId,
        moduleId: currentModuleId
      });
    }
  }, [currentModuleId, currentChapterId, currentUnitId, user?._id]);

  // Sync user streak on completion in background
  useEffect(() => {
    if (user?._id) {
      import('../../../services/authService.js').then(({ default: authService }) => {
        authService.syncStreak(user._id).then(res => {
          const data = res?.data || res;
          if (data && data.success && data.currentStreak) {
            setCurrentStreakCount(data.currentStreak);
            if (updateUser) {
              updateUser({ ...user, streak: data.currentStreak, lastStreakDate: data.lastStreakDate });
            }
          }
        }).catch(err => console.warn('[LessonComplete] Failed to sync streak:', err));
      });
    }
  }, [user?._id]);

  const fireLevelEnd = (score) => {
    if (typeof window.hyTrack !== 'function' || !currentModuleId) return;

    const endKey = `level_end_${currentModuleId}`;
    if (sessionStorage.getItem(endKey)) return;

    const title = passedTitle || `Module ${currentModuleId}`;
    const startTime = Number(sessionStorage.getItem(`module_start_time_${currentModuleId}`));
    const timeSpentSeconds = startTime ? Math.round((Date.now() - startTime) / 1000) : 0;

    const totalQuestions = Array.isArray(items) 
      ? items.filter(item => ['mcq', 'fillups', 'rearrange', 'descriptive'].includes(item.type)).length 
      : 0;

    window.hyTrack("level_end", {
      ...getLearningParams({
        user,
        module: { id: currentModuleId, levelName: title, moduleName: title, chapter: currentChapterId, unit: currentUnitId },
        source: searchParams.get('source') || "lesson_complete"
      }),
      score: score || 0,
      time_spent_seconds: timeSpentSeconds,
      total_questions: totalQuestions
    });

    trackFirstModuleCompleted(user?.classLevel || "unknown_class", currentModuleId, currentChapterId, {
      score: score || 0,
      time_spent_seconds: timeSpentSeconds,
      total_questions: totalQuestions
    });

    sessionStorage.setItem(endKey, "true");
  };

  useEffect(() => {
    (async () => {
      // Flush any staged incorrects for this module
      try {
        const staged = getStagedForModule(currentModuleId);
        if (Array.isArray(staged) && staged.length > 0) {
          const reviewSvc = (await import('../../../services/reviewService.js')).default;
          const unique = Array.from(new Set(staged));
          const userId = user?._id;
          for (const qid of unique) {
            if (!userId) break;
            await reviewSvc.saveIncorrect({ userId, questionId: qid, moduleId: String(currentModuleId) });
          }
          clearStagedForModule(currentModuleId);
        }
      } catch (_) {}

      try {
        if (user?._id) {
          const auth = (await import('../../../services/authService.js')).default;
          const resp = await auth.getProgress(user._id);
          const arr = resp?.data || [];
          const chapParam = searchParams.get('chapter');
          const np = Number(chapParam);
          const chapterToShow = Number.isFinite(np) && np > 0 ? np : 1;
          const entry = arr.find((e) => Number(e.chapter) === Number(chapterToShow));
          if (entry) {
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
            fireLevelEnd(last);
          } else {
            fireLevelEnd(0);
          }
        } else {
          fireLevelEnd(0);
        }
      } catch (_) {
        fireLevelEnd(0);
      }
      setIsChecking(false);
    })();
  }, [user, currentModuleId, items]);

  // Clean local resume state on completion
  useEffect(() => {
    if (currentModuleId) {
      localStorage.removeItem(`resume_lesson_${currentModuleId}`);
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(`resume_lesson_comic_${currentModuleId}_`)) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(k => localStorage.removeItem(k));
    }
  }, [currentModuleId]);

  // Play celebration confetti & victory sound
  useEffect(() => {
    // Instantly silence all audio from chapter/module before playing victory sound
    stopAllAudio();

    setShowConfetti(true);
    const audio = new Audio(victorySound);
    audio.volume = 0.6;
    audio.play().catch(() => {});
    return () => {
      audio.pause();
      audio.currentTime = 0;
    };
  }, []);

  // Fetch next module for "UP NEXT" card
  useEffect(() => {
    let isMounted = true;
    const fetchNext = async () => {
      try {
        let targetChapterId = currentChapterId;
        let targetUnitId = currentUnitId;

        if (!targetChapterId && currentModuleId) {
          try {
            const mRes = await curriculumService.getModule(currentModuleId);
            if (mRes?.data) {
              if (isMounted) setCurrentModuleData(mRes.data);
              targetChapterId = mRes.data.chapterId;
              targetUnitId = mRes.data.unitId;
            }
          } catch (_) {}
        }

        let modulesList = [];
        if (targetUnitId) {
          const uRes = await curriculumService.listModulesByUnit(targetUnitId);
          modulesList = uRes?.data || [];
        } else if (targetChapterId) {
          const cRes = await curriculumService.listModules(targetChapterId);
          modulesList = cRes?.data || [];
        }

        let foundNext = null;
        if (Array.isArray(modulesList) && modulesList.length > 0 && currentModuleId) {
          const idx = modulesList.findIndex(
            (m) => String(m.moduleNumber) === String(currentModuleId) || String(m._id) === String(currentModuleId)
          );
          if (idx !== -1 && idx + 1 < modulesList.length) {
            foundNext = modulesList[idx + 1];
          }
        }

        // If not found in current unit, check whole chapter to cross over to next unit
        if (!foundNext && targetChapterId) {
          const allChapRes = await curriculumService.listModules(targetChapterId);
          const allChapModules = allChapRes?.data || [];
          if (Array.isArray(allChapModules) && allChapModules.length > 0) {
            const cIdx = allChapModules.findIndex(
              (m) => String(m.moduleNumber) === String(currentModuleId) || String(m._id) === String(currentModuleId)
            );
            if (cIdx !== -1 && cIdx + 1 < allChapModules.length) {
              foundNext = allChapModules[cIdx + 1];
            }
          }
        }

        if (foundNext && isMounted) {
          setNextModule(foundNext);
        }
      } catch (err) {
        console.warn('[LessonComplete] Error resolving next module:', err);
      }
    };
    fetchNext();
    return () => { isMounted = false; };
  }, [currentModuleId, currentChapterId, currentUnitId]);

  // Points calculation
  const pointsEarned = Number(scores.last) > 0 ? scores.last : (moduleStars?.[String(currentModuleId)] || 30);
  const totalUserPoints = (stars !== null && Number.isFinite(stars)) ? stars : (scores.best || 150);
  const originalPoints = Math.max(0, totalUserPoints - pointsEarned);

  // Set initial points on mount
  useEffect(() => {
    if (!isChecking && !animationRanRef.current) {
      setDisplayPoints(originalPoints);
    }
  }, [isChecking, originalPoints]);

  // Points adding animation runner
  useEffect(() => {
    if (isChecking || animationRanRef.current) return;
    animationRanRef.current = true;

    const startTimer = setTimeout(() => {
      setAnimationPhase('adding');

      const startTime = performance.now();
      const duration = 1400; // 1.4s smooth ease-out count-up
      let lastTickStep = 0;

      const animate = (now) => {
        const elapsed = now - startTime;
        const progress = Math.min(1, elapsed / duration);
        // Ease-out cubic: 1 - (1 - t)^3
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const currentVal = Math.round(originalPoints + easeOut * pointsEarned);
        
        setDisplayPoints(currentVal);

        // Sound tick every ~5 points incremented
        if (currentVal - lastTickStep >= 5) {
          playPointTick(600 + (progress * 500));
          lastTickStep = currentVal;
        }

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          setDisplayPoints(totalUserPoints);
          setAnimationPhase('done');
          playPointFinish();
        }
      };

      requestAnimationFrame(animate);
    }, 450);

    return () => clearTimeout(startTimer);
  }, [isChecking, originalPoints, pointsEarned, totalUserPoints]);

  // Navigation handlers
  const handleNext = () => {
    if (nextModule) {
      const nextModNum = nextModule.moduleNumber || nextModule._id;
      const navParams = new URLSearchParams();
      const targetChapId = currentChapterId || nextModule.chapterId;
      if (targetChapId) navParams.set('chapterId', targetChapId);
      if (nextModule.unitId || currentUnitId) navParams.set('unitId', nextModule.unitId || currentUnitId);
      if (nextModule.title) navParams.set('title', nextModule.title);
      navigate(`/learn/module/${nextModNum}?${navParams.toString()}`);
    } else {
      // Auto-advance to the next sequential module unless backed
      const currentNum = parseInt(currentModuleId, 10);
      if (!isNaN(currentNum) && currentNum > 0) {
        const nextModNum = currentNum + 1;
        const navParams = new URLSearchParams();
        if (currentChapterId) navParams.set('chapterId', currentChapterId);
        if (currentUnitId) navParams.set('unitId', currentUnitId);
        navigate(`/learn/module/${nextModNum}?${navParams.toString()}`);
      } else {
        handleBackToMap();
      }
    }
  };

  const handleBackToMap = () => {
    const navParams = new URLSearchParams();
    if (currentChapterId) navParams.set('chapterId', currentChapterId);
    navigate(`/learn${navParams.toString() ? '?' + navParams.toString() : ''}`);
  };

  // Keyboard shortcut: Enter triggers Next
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Enter') {
        handleNext();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [nextModule]);

  if (isChecking) {
    return <SimpleLoading text="Loading completion..." />;
  }

  // Titles
  const currentLessonTitle = 
    passedTitle || 
    currentModuleData?.title || 
    items?.[0]?.lessonTitle || 
    items?.[0]?.batchTitle || 
    items?.[0]?.cardTitle || 
    "Lock it in";

  const nextModuleTitle = 
    nextModule?.title || 
    nextModule?.name || 
    nextModule?.lessonTitle || 
    (nextModule?.moduleNumber ? `Lesson ${nextModule.moduleNumber}` : "Sweet chapati: teeth");

  return (
    <div className="min-h-screen w-full bg-[#F4FBF6] flex flex-col items-center justify-between lg:justify-center px-5 sm:px-6 py-6 sm:py-8 overflow-y-auto select-none">
      {showConfetti && <ConfettiAnimation />}

      <div className="w-full max-w-sm sm:max-w-md flex flex-col items-center justify-between flex-1 my-auto lg:max-w-5xl lg:grid lg:grid-cols-2 lg:gap-x-14 lg:gap-y-5 lg:items-center lg:flex-none">
        {/* Top Area: Character, Title, Subtitle, Points Animation, Up Next */}
        {/* Desktop (lg+): two columns so the whole screen fits without scrolling. The column wrappers
            are display:contents below lg, so the phone layout is unchanged. */}
        <div className="w-full flex flex-col items-center text-center lg:contents">
          <div className="contents lg:flex lg:flex-col lg:items-center lg:text-center lg:col-start-1 lg:row-start-1 lg:row-span-2 lg:self-center">
          {/* Characters Illustration */}
          <div className="w-full flex justify-center mt-2 sm:mt-4 mb-2">
            <img 
              src={lessonCompleteCharacters} 
              alt="Well done" 
              className="w-44 sm:w-52 lg:w-60 h-auto object-contain drop-shadow-sm pointer-events-none select-none" 
            />
          </div>

          {/* Heading */}
          <h1 
            style={{ fontFamily: "var(--f-display, 'Fredoka', sans-serif)" }}
            className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#101F33] tracking-tight mb-1"
          >
            Well done!
          </h1>

          {/* Subtitle */}
          <p className="text-[#64748B] font-semibold text-sm sm:text-base mb-4">
            {currentLessonTitle}
          </p>

          {/* ── ACTUAL POINTS ADDING TO ORIGINAL POINTS ANIMATION (NO STARS) ── */}
          <div className="w-full flex flex-col items-center justify-center my-2 relative">
            {/* Points Earned Pill */}
            <div className={`relative px-7 py-2 rounded-full font-black text-lg sm:text-xl transition-all duration-400 ${
              animationPhase === 'adding' 
                ? 'bg-[#FEF3C7] text-[#92400E] scale-110 shadow-lg ring-4 ring-[#FDE68A]/60' 
                : animationPhase === 'done'
                  ? 'bg-[#D1FADF] text-[#027A48] shadow-sm scale-100'
                  : 'bg-[#FEF3C7] text-[#92400E] shadow-2xs scale-100'
            }`}>
              {animationPhase === 'done' ? `+${pointsEarned} added!` : `+${pointsEarned} points`}
              
              {/* Pulse ripple when adding */}
              {animationPhase === 'adding' && (
                <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-amber-500"></span>
                </span>
              )}
            </div>

            {/* Connecting Arc / Flow Indicator */}
            <div className="flex flex-col items-center my-1.5">
              <div className={`transition-all duration-300 flex items-center justify-center ${
                animationPhase === 'adding' ? 'text-amber-500 scale-125 animate-bounce' : 'text-slate-300 opacity-60'
              }`}>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </div>
            </div>

            {/* Original Points Counter Rolling Up to Total Points */}
            <div className={`w-full max-w-[280px] sm:max-w-xs bg-white rounded-2xl border-2 px-4 py-3 flex items-center justify-between shadow-xs transition-all duration-500 ${
              animationPhase === 'adding'
                ? 'border-amber-400 shadow-[0_6px_24px_rgba(245,158,11,0.22)] scale-105'
                : animationPhase === 'done'
                  ? 'border-emerald-400 shadow-[0_4px_16px_rgba(16,185,129,0.18)] scale-100'
                  : 'border-[#EDF0F4]'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl transition-all duration-300 shadow-2xs ${
                  animationPhase === 'adding' ? 'scale-115 rotate-12 bg-amber-100' : 'bg-amber-50'
                }`}>
                  ⭐
                </div>
                <div className="text-left">
                  <div className="text-[10px] sm:text-xs font-black tracking-wider uppercase text-slate-400">
                    Total Score
                  </div>
                  <div 
                    style={{ fontFamily: "var(--f-display, 'Fredoka', sans-serif)" }}
                    className="text-2xl sm:text-3xl font-black text-[#101F33] tabular-nums tracking-tight leading-none mt-0.5"
                  >
                    {displayPoints} <span className="text-xs sm:text-sm font-bold text-slate-400">pts</span>
                  </div>
                </div>
              </div>

              {/* Progress status tag */}
              <div className={`px-2.5 py-1 rounded-full text-xs font-black transition-all duration-300 ${
                animationPhase === 'adding'
                  ? 'bg-amber-100 text-amber-700 animate-pulse'
                  : animationPhase === 'done'
                    ? 'bg-emerald-100 text-emerald-700 font-extrabold'
                    : 'bg-slate-100 text-slate-400'
              }`}>
                {animationPhase === 'done' ? '✓ Added' : `+${pointsEarned}`}
              </div>
            </div>
          </div>
          </div>

          <div className="contents lg:flex lg:flex-col lg:w-full lg:col-start-2 lg:row-start-1 lg:self-end">
          {/* CASE CLOSED SUMMARY CARD */}
          {caseClosedItem && (
            <div className="w-full bg-white rounded-[24px] sm:rounded-[28px] border-2 border-[#E2E8F0] p-4 sm:p-5 text-left shadow-xs mt-3.5 mb-2 transition-all">
              {/* Header row: Badge + Speaker Audio + Status */}
              <div className="flex items-center justify-between gap-2 mb-2.5">
                <div className="flex items-center gap-2">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EFF6FF] border border-[#BFDBFE] text-[#1F6FE5] text-[11px] sm:text-xs font-black tracking-wide uppercase">
                    <span className="text-sm">🔍</span>
                    <span>Case Closed</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleToggleCaseAudio}
                    className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 active:scale-95 flex items-center justify-center text-xs text-slate-600 transition-all cursor-pointer shadow-2xs"
                    title={isPlayingCaseAudio ? "Pause summary" : "Listen to summary"}
                    aria-label="Listen to Case Closed summary"
                  >
                    {isPlayingCaseAudio ? '⏸' : '🔊'}
                  </button>
                </div>
                <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#ECFDF5] border border-[#A7F3D0] text-[#027A48] text-[10px] sm:text-[11px] font-black">
                  <span>✓</span>
                  <span>Solved</span>
                </div>
              </div>

              {/* Main Takeaway / Solved Mystery */}
              <p className="text-[#1E293B] font-semibold text-xs sm:text-sm leading-relaxed">
                {caseSummary}
              </p>

              {/* Next Case Teaser if present */}
              {caseNextCase && (
                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-start gap-2">
                  <span className="inline-block px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 font-black text-[10px] sm:text-[11px] uppercase tracking-wider shrink-0 mt-0.5">
                    Next Case
                  </span>
                  <p className="text-xs sm:text-sm text-[#475569] font-medium leading-snug">
                    {caseNextCase}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* UP NEXT Card */}
          <div className="w-full bg-white rounded-[24px] sm:rounded-[28px] border-2 border-[#EDF0F4] p-4 sm:p-5 text-center shadow-xs mt-1.5 mb-4">
            <div className="text-[11px] sm:text-xs font-black tracking-widest text-[#64748B] uppercase mb-1">
              UP NEXT
            </div>
            <div 
              style={{ fontFamily: "var(--f-display, 'Fredoka', sans-serif)" }}
              className="text-lg sm:text-xl font-black text-[#101F33] truncate px-2"
            >
              {nextModuleTitle}
            </div>
          </div>
          </div>
        </div>

        {/* Bottom Action Buttons */}
        <div className="w-full flex flex-col gap-3 mt-4 pt-2 lg:mt-0 lg:pt-0 lg:col-start-2 lg:row-start-2 lg:self-start">
          {/* Trial countdown and Go Pro, right above NEXT */}
          <TrialTimerBar variant="card" />

          {/* NEXT Button */}
          <button
            type="button"
            onClick={handleNext}
            className="w-full py-4 rounded-2xl sm:rounded-[22px] bg-[#1F9D63] hover:bg-[#198754] text-white font-black italic text-xl sm:text-2xl tracking-wider shadow-[0_5px_0_0_#16804F] active:shadow-none active:translate-y-1 transition-all flex items-center justify-center gap-3 cursor-pointer"
          >
            <span className="text-2xl leading-none font-bold">➔</span>
            <span className="tracking-wide">NEXT</span>
          </button>

          {/* Back to the map Button */}
          <button
            type="button"
            onClick={handleBackToMap}
            className="w-full py-3.5 rounded-2xl sm:rounded-[22px] bg-white hover:bg-slate-50 text-[#101F33] font-extrabold text-base sm:text-lg border-2 border-[#CBD5E1] shadow-xs active:scale-[0.99] transition-all cursor-pointer"
          >
            Back to the map
          </button>
        </div>
      </div>
    </div>
  );
};

export default LessonComplete;