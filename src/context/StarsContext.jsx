import React, { createContext, useContext, useEffect, useMemo, useRef, useState, useCallback } from 'react';
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
  const [stars, setStars] = useState(0);
  const [delta, setDelta] = useState(0); // for +5 / -2 flyout
  const [moduleStars, setModuleStars] = useState({});
  const [questionLedger, setQuestionLedger] = useState({});
  const timerRef = useRef(null);

  const getUserId = useCallback(() => {
    try {
      const raw = localStorage.getItem('user');
      const parsed = raw ? JSON.parse(raw) : null;
      return parsed?._id || null;
    } catch (_) { return null; }
  }, []);

  const getScopedKey = useCallback((base) => {
    const uid = getUserId();
    return uid ? `${base}__${uid}` : base;
  }, [getUserId]);

  // Initial load when user becomes available
  const reloadFromStorage = useCallback(() => {
    const uid = getUserId();
    if (!uid) return;
    try {
      const scopedTotal = localStorage.getItem(getScopedKey(STORAGE_KEY));
      const total = Number(scopedTotal);
      if (Number.isFinite(total)) setStars(total); else setStars(0);

      const scopedModules = localStorage.getItem(getScopedKey(STORAGE_PER_MODULE_KEY));
      setModuleStars(scopedModules ? JSON.parse(scopedModules) : {});

      const scopedLedger = localStorage.getItem(getScopedKey(STORAGE_PER_QUESTION_KEY));
      setQuestionLedger(scopedLedger ? JSON.parse(scopedLedger) : {});
    } catch (e) {
      console.warn('[StarsContext] Failed to load scoped storage:', e);
    }
  }, [getUserId, getScopedKey]);

  useEffect(() => {
    reloadFromStorage();
  }, [reloadFromStorage]);

  // Cross-tab sync
  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key === getScopedKey(STORAGE_KEY)) {
        const val = Number(e.newValue);
        if (Number.isFinite(val)) setStars(val);
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [getScopedKey]);

  // Persist changes
  useEffect(() => {
    const uid = getUserId();
    if (!uid) return;
    try { localStorage.setItem(getScopedKey(STORAGE_KEY), String(stars)); } catch (_) {}
  }, [stars, getScopedKey, getUserId]);

  useEffect(() => {
    const uid = getUserId();
    if (!uid) return;
    try { localStorage.setItem(getScopedKey(STORAGE_PER_MODULE_KEY), JSON.stringify(moduleStars)); } catch (_) {}
  }, [moduleStars, getScopedKey, getUserId]);

  useEffect(() => {
    const uid = getUserId();
    if (!uid) return;
    try { localStorage.setItem(getScopedKey(STORAGE_PER_QUESTION_KEY), JSON.stringify(questionLedger)); } catch (_) {}
  }, [questionLedger, getScopedKey, getUserId]);

  const addStars = (amount) => {
    if (!Number.isFinite(amount) || amount === 0) return;
    setStars((s) => Math.max(0, s + amount));
    setDelta(amount);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setDelta(0), 1200);
  };

  const setTotal = (next) => {
    const n = Number(next);
    if (!Number.isFinite(n)) return;
    setStars(Math.max(0, n));
    setDelta(0);
  };

  const awardCorrect = async (moduleId, questionId, points, { type = 'curriculum' } = {}) => {
    if (!moduleId || !questionId || !Number.isFinite(points)) return;
    
    // Optimistic local update for consistency
    setQuestionLedger((prev) => ({
      ...prev,
      [questionId]: { correct: true, pointsAwarded: points, moduleId: String(moduleId) }
    }));

    try {
      const uid = getUserId();
      if (!uid) return;

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
        // Even if delta is 0, ensure we are synced with server total
        setStars(serverTotal);
      }
    } catch (e) {
      console.warn('[StarsContext] awardCorrect failed:', e);
    }
  };

  const awardWrong = async (moduleId, questionId, penalty, { isRetry = false, type = 'curriculum' } = {}) => {
    if (!moduleId || !questionId || !Number.isFinite(penalty)) return;
    
    // If retry, don't award or penalize again locally
    if (isRetry) return;

    try {
      const uid = getUserId();
      if (!uid) return;

      const { data } = await pointsService.award({ userId: uid, questionId, moduleId: String(moduleId), type, result: 'incorrect' });
      const serverDelta = Number(data?.delta || 0);
      const serverTotal = Number(data?.totalPoints || 0);

      if (Number.isFinite(serverDelta) && serverDelta !== 0) {
        setStars((s) => Math.max(0, s + serverDelta));
        setModuleStars((m) => ({ ...m, [moduleId]: Math.max(0, (m[moduleId] || 0) + serverDelta) }));
        setDelta(serverDelta);
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => setDelta(0), 1200);
      } else if (Number.isFinite(serverTotal)) {
        setStars(serverTotal);
      }
    } catch (e) {
      console.warn('[StarsContext] awardWrong failed:', e);
    }
  };

  const getModuleStars = (moduleId) => moduleStars[moduleId] || 0;

  const resetModuleLedger = (moduleId) => {
    if (!moduleId) return;
    setModuleStars((m) => ({ ...m, [moduleId]: 0 }));
    setQuestionLedger((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((qid) => { if (next[qid]?.moduleId === String(moduleId)) delete next[qid]; });
      return next;
    });
  };

  const resetAllStars = () => {
    setStars(0);
    setModuleStars({});
    setQuestionLedger({});
    setDelta(0);
  };

  const syncFromServer = (serverStars, serverModuleStars = {}) => {
    const totalStars = Number(serverStars);
    if (Number.isFinite(totalStars)) {
      setStars(Math.max(0, totalStars));
      if (serverModuleStars && typeof serverModuleStars === 'object') {
        setModuleStars(serverModuleStars);
      }
    }
  };

  const value = useMemo(() => ({ 
    stars, 
    addStars, 
    setTotal, 
    delta, 
    awardCorrect, 
    awardWrong, 
    getModuleStars, 
    resetModuleLedger, 
    resetAllStars, 
    syncFromServer,
    refresh: reloadFromStorage
  }), [stars, delta, moduleStars, questionLedger, reloadFromStorage]);

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


