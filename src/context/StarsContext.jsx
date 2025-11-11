import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import pointsService from '../services/pointsService.js';

const StarsContext = createContext(null);

export const useStars = () => {
  const ctx = useContext(StarsContext);
  if (!ctx) throw new Error('useStars must be used within StarsProvider');
  return ctx;
};

const STORAGE_KEY = 'hs_stars_total_v1';
const STORAGE_PER_MODULE_KEY = 'hs_stars_per_module_v1';
const STORAGE_PER_QUESTION_KEY = 'hs_stars_per_question_v1';

export const StarsProvider = ({ children }) => {
  const getUserId = () => {
    try {
      const raw = localStorage.getItem('user');
      const parsed = raw ? JSON.parse(raw) : null;
      return parsed?._id || null;
    } catch (_) { return null; }
  };
  const [stars, setStars] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const n = Number(raw);
      return Number.isFinite(n) ? n : 0;
    } catch (_) {
      return 0;
    }
  });
  const [delta, setDelta] = useState(0); // for +5 / -2 flyout
  const timerRef = useRef(null);
  // Track cumulative per-module stars
  const [moduleStars, setModuleStars] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_PER_MODULE_KEY) || '{}') || {}; } catch (_) { return {}; }
  });
  // Track per-question attempts to make scoring idempotent
  // Structure: { [questionId]: { correct: boolean, penalized: boolean, pointsAwarded: number, moduleId: string } }
  const [questionLedger, setQuestionLedger] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_PER_QUESTION_KEY) || '{}') || {}; } catch (_) { return {}; }
  });

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, String(stars)); } catch (_) {}
  }, [stars]);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_PER_MODULE_KEY, JSON.stringify(moduleStars)); } catch (_) {}
  }, [moduleStars]);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_PER_QUESTION_KEY, JSON.stringify(questionLedger)); } catch (_) {}
  }, [questionLedger]);

  const addStars = (amount) => {
    if (!Number.isFinite(amount) || amount === 0) return;
    setStars((s) => Math.max(0, s + amount));
    setDelta(amount);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setDelta(0), 1200);
  };

  // Allow consumers to explicitly set total points (used when backend returns new totals)
  const setTotal = (next) => {
    const n = Number(next);
    if (!Number.isFinite(n)) return;
    setStars(Math.max(0, n));
    setDelta(0);
  };

  // Idempotent scoring helpers per question
  const awardCorrect = async (moduleId, questionId, points, { type = 'curriculum' } = {}) => {
    if (!moduleId || !questionId || !Number.isFinite(points) || points <= 0) return;
    // Optimistic UI will be applied after server confirms delta
    setQuestionLedger((prev) => {
      const entry = prev[questionId] || { correct: false, penalized: false, pointsAwarded: 0, moduleId };
      return { ...prev, [questionId]: { ...entry, correct: true, pointsAwarded: Math.max(entry.pointsAwarded || 0, points) } };
    });
    try {
      const uid = getUserId();
      if (uid) {
        const { data } = await pointsService.award({ userId: uid, questionId, moduleId: String(moduleId), type, result: 'correct' });
        const serverDelta = Number(data?.delta || 0);
        const serverTotal = Number(data?.totalPoints || 0);
        if (Number.isFinite(serverDelta) && serverDelta !== 0) {
          setStars((s) => Math.max(0, s + serverDelta));
          setModuleStars((m) => ({ ...m, [moduleId]: (m[moduleId] || 0) + serverDelta }));
          setDelta(serverDelta);
          if (timerRef.current) clearTimeout(timerRef.current);
          timerRef.current = setTimeout(() => setDelta(0), 1200);
        } else if (Number.isFinite(serverTotal)) {
          setStars(serverTotal);
        }
      }
    } catch (_) { /* ignore UI sync errors */ }
  };

  const awardWrong = async (moduleId, questionId, penalty, { isRetry = false, type = 'curriculum' } = {}) => {
    if (!moduleId || !questionId || !Number.isFinite(penalty) || penalty >= 0) return;
    setQuestionLedger((prev) => {
      const entry = prev[questionId] || { correct: false, penalized: false, pointsAwarded: 0, moduleId };
      // Do not penalize on retry, and only penalize once on the first wrong attempt
      if (isRetry || entry.penalized || entry.correct) return prev;
      const next = { ...prev, [questionId]: { ...entry, penalized: true } };
      return next;
    });
    try {
      const uid = getUserId();
      if (uid) {
        const { data } = await pointsService.award({ userId: uid, questionId, moduleId: String(moduleId), type, result: 'incorrect' });
        const serverDelta = Number(data?.delta || 0);
        if (Number.isFinite(serverDelta) && serverDelta !== 0) {
          setStars((s) => Math.max(0, s + serverDelta));
          setModuleStars((m) => ({ ...m, [moduleId]: Math.max(0, (m[moduleId] || 0) + serverDelta) }));
          setDelta(serverDelta);
          if (timerRef.current) clearTimeout(timerRef.current);
          timerRef.current = setTimeout(() => setDelta(0), 1200);
        }
      }
    } catch (_) { /* ignore UI sync errors */ }
  };

  const getModuleStars = (moduleId) => moduleStars[moduleId] || 0;

  const resetModuleLedger = (moduleId) => {
    if (!moduleId) return;
    setModuleStars((m) => ({ ...m, [moduleId]: 0 }));
    setQuestionLedger((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((qid) => { if (next[qid]?.moduleId === moduleId) delete next[qid]; });
      return next;
    });
  };

  const resetAllStars = () => {
    setStars(0);
    setModuleStars({});
    setQuestionLedger({});
    setDelta(0);
  };

  // Function to sync stars from server data
  const syncFromServer = (serverStars, serverModuleStars = {}) => {
    try {
      const totalStars = Number(serverStars);
      const moduleStarsData = typeof serverModuleStars === 'object' ? serverModuleStars : {};
      
      if (Number.isFinite(totalStars) && totalStars >= 0) {
        setStars(totalStars);
        setModuleStars(moduleStarsData);
      }
    } catch (error) {
      console.warn('[StarsContext] Failed to sync from server:', error);
    }
  };

  const value = useMemo(() => ({ stars, addStars, setTotal, delta, awardCorrect, awardWrong, getModuleStars, resetModuleLedger, resetAllStars, syncFromServer }), [stars, delta, moduleStars, questionLedger]);
  return <StarsContext.Provider value={value}>{children}</StarsContext.Provider>;
};

export const StarCounter = () => {
  const { stars, delta } = useStars();
  return (
    <div className="relative flex items-center gap-1 sm:gap-2 text-gray-800 select-none">
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
        className="sm:w-5 sm:h-5"
        aria-hidden="true"
      >
        <path
          d="M12 2.75l2.95 5.98 6.6.96-4.78 4.66 1.13 6.58L12 18.77l-5.9 3.16 1.13-6.58L2.45 9.69l6.6-.96L12 2.75z"
          fill="#FACC15"
          stroke="#EAB308"
          strokeWidth="0.8"
        />
      </svg>
      <span className="font-extrabold text-sm sm:text-base tabular-nums">{stars}</span>
      {delta !== 0 && (
        <span
          className={`absolute -top-3 left-4 text-xs sm:text-sm font-bold transition-all duration-700 ease-out ${
            delta > 0 ? 'text-green-600' : 'text-red-600'
          } animate-[starDelta_1.2s_ease-out_forwards]`}
        >
          {delta > 0 ? `+${delta}` : `${delta}`}
        </span>
      )}
      <style>{`
        @keyframes starDelta {
          0% { opacity: 1; transform: translateY(0); }
          60% { opacity: 0.7; transform: translateY(-10px); }
          100% { opacity: 0.0; transform: translateY(-18px); color: #9ca3af; }
        }
      `}</style>
    </div>
  );
};


