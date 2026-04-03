import React, { useEffect, useState, useMemo, useLayoutEffect } from "react";
import { useAuth } from "../../../context/AuthContext.jsx";
import { useNavigate, useLocation } from "react-router-dom";
import heroChar from "../../../assets/images/heroChar.png";
import RevisionStar from "../quiz/RevisionStar.jsx";
import { ReviewProvider } from "../../../context/ReviewContext.jsx";
import { useStars } from '../../../context/StarsContext.jsx';
import chapterImg from "../../../assets/images/chapterImg.png";
import authService from "../../../services/authService.js";
import { progressKey } from "../../../utils/progressKey.js";

// --- SVG Icons for the Dashboard ---
const LearnIcon = () => (
  <svg
    className="w-7 h-7 md:w-8 md:h-8"
    viewBox="0 0 24 24"
    fill="currentColor"
  >
    <path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-3 2v5l-1-.75L15 9V4h2zm-3 0v5l-1-.75L12 9V4h2zm-3 0v5l-1-.75L9 9V4h2z"></path>
  </svg>
);
const ReviseIcon = () => (
  <svg
    className="w-7 h-7 md:w-8 md:h-8"
    viewBox="0 0 24 24"
    fill="currentColor"
  >
    <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5C21.27 7.61 17 4.5 12 4.5zm0 10c-2.48 0-4.5-2.02-4.5-4.5S9.52 5.5 12 5.5 16.5 7.52 16.5 10 14.48 14.5 12 14.5z"></path>
  </svg>
);
const ProfileIcon = () => (
  <svg
    className="w-7 h-7 md:w-8 md:h-8"
    viewBox="0 0 24 24"
    fill="currentColor"
  >
    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"></path>
  </svg>
);
const StarIcon = () => (
  <svg
    className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 lg:w-8 lg:h-8"
    viewBox="0 0 24 24"
    fill="currentColor"
  >
    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"></path>
  </svg>
);
const BookIcon = () => (
  <svg className="w-10 h-10" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z"></path>
  </svg>
);
const HamburgerIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
    <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"></path>
  </svg>
);

const CloseIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"></path>
  </svg>
);

const ChapterNavIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"></path>
  </svg>
);

// Cute bouncing "START" badge used above the active node
const StartBadge = ({ color = "#2C6DEF" }) => (
  <div className="absolute -top-12 left-1/2 -translate-x-1/2 z-30 select-none">
    <div className="relative">
      <div
        className="px-3 py-1.5 rounded-xl font-extrabold tracking-wider shadow-none animate-bounce"
        style={{
          color: color,
          background: "transparent",
          borderWidth: 2,
          borderStyle: "solid",
          borderColor: color,
        }}
      >
        START
      </div>
      <div
        className="absolute left-1/2 -translate-x-1/2 -bottom-2 w-0 h-0 border-l-6 border-r-6 border-t-8 border-l-transparent border-r-transparent"
        style={{ borderTopColor: color }}
      ></div>
    </div>
  </div>
);

const PathNode = ({ status, onClick, disabled, offset = 0, color = "#2C6DEF", lightenFn, darkenFn }) => {
  const isCompleted = status === "completed";
  const isActive = status === "active";
  const iconColor = "text-white";
  const activeFrom = color;
  const activeTo = darkenFn ? darkenFn(color, 0.15) : color;
  const lockedFrom = lightenFn ? lightenFn(color, 0.55) : color;
  const lockedTo = lightenFn ? lightenFn(color, 0.35) : color;
  const nodeStyle = isCompleted
    ? { background: "linear-gradient(135deg, #FACC15, #EAB308)" }
    : isActive
    ? { background: `linear-gradient(135deg, ${activeFrom}, ${activeTo})`, animation: "pulse 2s infinite" }
    : { background: `linear-gradient(135deg, ${lockedFrom}, ${lockedTo})` };
  const size = isActive
    ? "w-16 h-16 sm:w-18 sm:h-18 md:w-20 md:h-20 lg:w-24 lg:h-24"
    : "w-14 h-14 sm:w-16 sm:h-16 md:w-18 md:h-18 lg:w-20 lg:h-20";
  return (
    <div
      className="inline-flex items-center justify-center"
      style={{ transform: `translateX(${offset}px)` }}
    >
      <div
        onClick={disabled ? undefined : onClick}
        className={`${size} rounded-full flex items-center justify-center shadow-[0_4px_0_0_rgba(0,0,0,0.15)] sm:shadow-[0_6px_0_0_rgba(0,0,0,0.15)] md:shadow-[0_8px_0_0_rgba(0,0,0,0.15)] ${iconColor} ring-2 sm:ring-3 md:ring-4 ring-white/70 ${
          disabled
            ? "cursor-not-allowed"
            : "cursor-pointer hover:scale-110 transition-transform"
        }`}
        style={nodeStyle}
      >
        <StarIcon />
      </div>
    </div>
  );
};

const LearnDashboard = ({ onboardingData }) => {
  const { logout, user, loading: authLoading, updateUser } = useAuth();
  const { resetModuleLedger, stars, syncFromServer, setTotal } = useStars();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [progress, setProgress] = useState([]);
  const [chapterTitle, setChapterTitle] = useState("");
  const [chapterId, setChapterId] = useState("");
  const [chaptersList, setChaptersList] = useState([]);
  const [moduleTitle, setModuleTitle] = useState("");
  const [modulesList, setModulesList] = useState([]); // fetched modules for this chapter
  const [unitTitle, setUnitTitle] = useState("");
  const [unitsList, setUnitsList] = useState([]);
  const [unitModulesMap, setUnitModulesMap] = useState({}); // { unitId: Module[] }
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [showChapters, setShowChapters] = useState(false);
  const [chapterStats, setChapterStats] = useState({}); // { [chapterId]: { total, completed } }
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Simple scroll position preservation using sessionStorage
  const saveScrollPosition = () => {
    try {
      const scrollContainer = document.getElementById("tree-scroll-container");
      if (scrollContainer) {
        const scrollTop = scrollContainer.scrollTop;
        sessionStorage.setItem('dashboardScrollPos', scrollTop.toString());
        console.log('[Scroll Preservation] Saved scroll position:', scrollTop);
      }
    } catch (error) {
      console.warn('[Scroll Preservation] Failed to save scroll position:', error);
    }
  };
  const tips = [
    "Short lessons win! Finish one star, then take a mini break.",
    "Try to explain the concept to a friend or toy. Teaching helps!",
    "Stuck? Rewatch once and try again. Practice makes progress!",
    "Earn more stars to unlock revision power-ups.",
  ];
  const [tipIndex, setTipIndex] = useState(0);
  const [tipHidden, setTipHidden] = useState(false);
  const [streak, setStreak] = useState(1);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(false);
  // Track when the first fetch completes to avoid false "No units" while fetching
  const [hasFetched, setHasFetched] = useState(false);
  
  // Subject change functionality
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [subjectOptions, setSubjectOptions] = useState([]);
  const [subjectChanging, setSubjectChanging] = useState(false);

// Sync stars and progress when dashboard becomes visible
useEffect(() => {
  const handleVisibilityChange = () => {
    if (!document.hidden && user?._id) {
      console.log('[LearnDashboard] Tab visible, syncing...');
      
      // Sync progress from server
      authService.getProgress(user._id)
        .then(response => {
          if (response?.data) {
            const subjectProgress = response.data.filter(p => p.subject === subjectName);
            setProgress(subjectProgress);
            console.log('[LearnDashboard] Progress synced:', subjectProgress.length);
          }
        })
        .catch(error => console.warn('[LearnDashboard] Sync failed:', error));
    }
  };
  
  // Initial sync on mount
  handleVisibilityChange();
  
  // Listen for visibility changes
  document.addEventListener('visibilitychange', handleVisibilityChange);
  window.addEventListener('focus', handleVisibilityChange);
  
  return () => {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    window.removeEventListener('focus', handleVisibilityChange);
  };
}, [user?._id, subjectName]); // Note: removed syncFromServer from deps

  // Palette for per-unit theming
  const unitPalette = ["#2C6DEF", "#58CC02", "#CE82FF", "#00CD9C"];
  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
  const hexToRgb = (hex) => {
    const h = hex.replace('#','');
    const bigint = parseInt(h.length === 3 ? h.split('').map((c)=>c+c).join('') : h, 16);
    return { r: (bigint >> 16) & 255, g: (bigint >> 8) & 255, b: bigint & 255 };
  };
  const rgbToHex = ({r,g,b}) => {
    const toHex = (v) => v.toString(16).padStart(2,'0');
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  };
  const lighten = (hex, amount = 0.25) => {
    const { r, g, b } = hexToRgb(hex);
    const rr = clamp(Math.round(r + (255 - r) * amount), 0, 255);
    const gg = clamp(Math.round(g + (255 - g) * amount), 0, 255);
    const bb = clamp(Math.round(b + (255 - b) * amount), 0, 255);
    return rgbToHex({ r: rr, g: gg, b: bb });
  };
  const darken = (hex, amount = 0.15) => {
    const { r, g, b } = hexToRgb(hex);
    const rr = clamp(Math.round(r * (1 - amount)), 0, 255);
    const gg = clamp(Math.round(g * (1 - amount)), 0, 255);
    const bb = clamp(Math.round(b * (1 - amount)), 0, 255);
    return rgbToHex({ r: rr, g: gg, b: bb });
  };
  const withAlpha = (hex, alpha = 0.6) => {
    const { r, g, b } = hexToRgb(hex);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  // Session cache for per-chapter unit modules to reduce re-fetch latency
  const cacheKeyForChapter = (chapterId) => `unit_modules_cache_v1__${chapterId}`;
  const loadUnitModulesCache = (chapterId) => {
    try {
      return JSON.parse(sessionStorage.getItem(cacheKeyForChapter(chapterId)) || "{}") || {};
    } catch (_) {
      return {};
    }
  };
  const saveUnitModulesCache = (chapterId, map) => {
    try {
      sessionStorage.setItem(cacheKeyForChapter(chapterId), JSON.stringify(map || {}));
    } catch (_) {}
  };

  // Cache units list per chapter to hydrate UI immediately
  const unitsKeyForChapter = (chapterId) => `unit_list_cache_v1__${chapterId}`;
  const loadUnitsCache = (chapterId) => {
    try {
      return JSON.parse(sessionStorage.getItem(unitsKeyForChapter(chapterId)) || "[]") || [];
    } catch (_) {
      return [];
    }
  };
  const saveUnitsCache = (chapterId, units) => {
    try {
      sessionStorage.setItem(unitsKeyForChapter(chapterId), JSON.stringify(units || []));
    } catch (_) {}
  };

  // Pull subject/board from user or onboardingData - MOVED UP TO FIX INITIALIZATION ORDER
  const selectedBoard = onboardingData?.board || user?.board || "CBSE";
  const subjectName = onboardingData?.subject || user?.subject || "Science";
  // Get preferred chapter ID from URL, localStorage, onboardingData, or user
  const getPreferredChapterId = () => {
    const params = new URLSearchParams(location.search);
    const urlChapterId = params.get("chapterId");
    if (urlChapterId) return urlChapterId;
    
    // Check localStorage for last selected chapter ID
    try {
      const stored = localStorage.getItem(`last_selected_chapter_${user?._id || 'anon'}_${subjectName}`);
      if (stored) return stored;
    } catch (_) {}
    
    // Fall back to user chapter (title) or onboardingData chapter
    return onboardingData?.chapter || user?.chapter || null;
  };
  const preferredChapterId = getPreferredChapterId();

  // Helpers: local persistence for lesson completion - NOW USING COMPOSITE KEYS
  const userScopedKey = (base) => `${base}__${user?._id || 'anon'}__${subjectName || 'unknown'}`;
  const chapterScopedKey = (base, chapterId) => chapterId ? `${base}__${user?._id || 'anon'}__${subjectName || 'unknown'}__${chapterId}` : userScopedKey(base);
  const LS_KEY_BASE_V1 = "lesson_progress_v1"; // Old format (backward compatibility)
  const LS_KEY_BASE_V2 = "lesson_progress_v2"; // New format with composite keys
  const LS_IDS_KEY_BASE = "lesson_completed_ids_v1";
  const USE_LOCAL_PROGRESS = true; // enable client-side caching so stars shift immediately
  
  // Load completed composite keys (new format) - recalculate key each time to ensure user is available
  const loadCompletedCompositeKeys = () => {
    if (!USE_LOCAL_PROGRESS) return new Set();
    try {
      const LS_KEY_V2 = userScopedKey(LS_KEY_BASE_V2);
      const raw = localStorage.getItem(LS_KEY_V2);
      if (raw) {
        const store = JSON.parse(raw);
        return new Set(store.completedKeys || []);
      }
      return new Set();
    } catch (_) {
      return new Set();
    }
  };
  
  // Legacy loadLocalProgress for backward compatibility
  const loadLocalProgress = (chapterId = null) => {
    if (!USE_LOCAL_PROGRESS) return {};
    try {
      // Try chapter-specific key first if chapterId is provided
      if (chapterId) {
        const chapterKey = chapterScopedKey(LS_KEY_BASE_V1, chapterId);
        let raw = localStorage.getItem(chapterKey);
        if (raw) {
          return JSON.parse(raw);
        }
      }
      // Try user-scoped key (v1)
      const LS_KEY_V1 = userScopedKey(LS_KEY_BASE_V1);
      let raw = localStorage.getItem(LS_KEY_V1);
      if (raw) {
        return JSON.parse(raw);
      }
      // Fallback to non-scoped key for backward compatibility
      raw = localStorage.getItem(LS_KEY_BASE_V1);
      if (raw) {
        return JSON.parse(raw);
      }
      return {};
    } catch (_) {
      return {};
    }
  };
  const saveLocalProgress = (data, chapterId = null) => {
    if (!USE_LOCAL_PROGRESS) return;
    try {
      if (chapterId) {
        // Save to chapter-specific key
        const chapterKey = chapterScopedKey(LS_KEY_BASE, chapterId);
        localStorage.setItem(chapterKey, JSON.stringify(data));
      }
      // Also save to user-scoped key for backward compatibility
      localStorage.setItem(LS_KEY, JSON.stringify(data));
    } catch (_) {}
  };
  const markIndexCompletedLocal = (unitId, index, chapterId = null) => {
    if (!USE_LOCAL_PROGRESS) return;
    const store = loadLocalProgress(chapterId);
    // Use chapter-specific key if available, otherwise use unitId or default
    const key = chapterId ? `chapter_${chapterId}` : (unitId || "default");
    const set = new Set(store[key] || []);
    set.add(index);
    store[key] = Array.from(set);
    saveLocalProgress(store, chapterId);
    // Optimistically advance current progress state so UI updates immediately
    try {
      setProgress((prev) => {
        // clone to avoid mutation
        const next = Array.isArray(prev) ? [...prev] : [];
        const chapterIdx = typeof index === 'number' ? index + 1 : null;
        if (chapterIdx != null) {
          const exists = next.find((p) => p?.chapter === chapterIdx && p?.subject === subjectName);
          if (exists) {
            exists.conceptCompleted = true;
          } else {
            next.push({ chapter: chapterIdx, subject: subjectName, conceptCompleted: true });
          }
        }
        return next;
      });
    } catch (_) {}
  };
  // Track completion by moduleId as well for robustness across ordering - Module IDs are globally unique, so no chapter scoping needed
  const LS_IDS_KEY = userScopedKey(LS_IDS_KEY_BASE);
  const loadCompletedIds = () => {
    if (!USE_LOCAL_PROGRESS) return new Set();
    try {
      // Try user-scoped key first
      let raw = localStorage.getItem(LS_IDS_KEY);
      if (raw) {
        const arr = JSON.parse(raw);
        return new Set(arr);
      }
      // Fallback to non-scoped key for backward compatibility
      raw = localStorage.getItem(LS_IDS_KEY_BASE);
      if (raw) {
        const arr = JSON.parse(raw);
        return new Set(arr);
      }
      return new Set();
    } catch (_) {
      return new Set();
    }
  };
  const addCompletedId = (moduleId) => {
    if (!USE_LOCAL_PROGRESS) return;
    try {
      const set = loadCompletedIds();
      if (moduleId) set.add(String(moduleId));
      localStorage.setItem(LS_IDS_KEY, JSON.stringify(Array.from(set)));
    } catch (_) {}
  };

  // Function to clear false completions and reset progress
  const clearFalseCompletions = () => {
    if (!USE_LOCAL_PROGRESS) return;
    try {
      console.log('[Progress Reset] Clearing false completions...');
      
      // Clear all local storage progress
      localStorage.removeItem(LS_KEY);
      localStorage.removeItem(LS_IDS_KEY);
      localStorage.removeItem(LS_KEY_BASE);
      localStorage.removeItem(LS_IDS_KEY_BASE);
      
      // Reset progress state to only database data
      if (user?._id) {
        // Keep only database progress, clear local additions
        const serverCompletedSet = new Set(
          (progress || [])
            .filter((p) => p?.conceptCompleted)
            .map((p) => (p?.chapter ? p.chapter - 1 : -1))
            .filter((i) => i >= 0)
        );
        
        // Only keep server-verified completions in local storage
        const store = { default: Array.from(serverCompletedSet) };
        saveLocalProgress(store);
        
        // Only keep server-verified completed IDs
        const newCompletedIds = new Set();
        modulesList.forEach((mod, index) => {
          if (serverCompletedSet.has(index) && mod?._id) {
            newCompletedIds.add(String(mod._id));
          }
        });
        localStorage.setItem(LS_IDS_KEY, JSON.stringify(Array.from(newCompletedIds)));
        
        console.log('[Progress Reset] Reset to database-only progress:', {
          serverCompleted: Array.from(serverCompletedSet),
          completedIds: Array.from(newCompletedIds)
        });
      }
      
      // Force UI update
      setProgressUpdateTrigger(prev => prev + 1);
    } catch (error) {
      console.error('[Progress Reset] Error:', error);
    }
  };

  // Function to sync and fix progress discrepancies - Database is primary source
  const syncProgress = async () => {
    if (!USE_LOCAL_PROGRESS) return;
    try {
      // First, try to refresh progress from database
      if (user?._id) {
        try {
          const response = await authService.getProgress(user._id);
          if (response?.data) {
            // CRITICAL FIX: Filter progress by current subject to prevent collision
            const subjectProgress = response.data.filter(p => p.subject === subjectName);
            setProgress(subjectProgress);
            console.log('[Progress Sync] Refreshed from database for subject:', subjectName, subjectProgress);
          }
        } catch (error) {
          console.warn('[Progress Sync] Failed to refresh from database:', error);
        }
      }
      
      const serverCompletedSet = new Set(
        (progress || [])
          .filter((p) => p?.conceptCompleted && p?.subject === subjectName)
          .map((p) => (p?.chapter ? p.chapter - 1 : -1))
          .filter((i) => i >= 0)
      );
      
      const localProgress = loadLocalProgress();
      const completedIdSet = loadCompletedIds();
      
      // Sync local progress with server progress (database is source of truth)
      const store = { ...localProgress };
      const key = "default";
      const localSet = new Set(store[key] || []);
      
      // Add server-completed items to local storage
      serverCompletedSet.forEach(index => {
        localSet.add(index);
      });
      
      store[key] = Array.from(localSet);
      saveLocalProgress(store);
      
      // CRITICAL FIX: Use completedModules from backend instead of chapter-level completion
      // This prevents marking ALL modules in a chapter as completed when only some are done
      const newCompletedIds = new Set(completedIdSet);
      if (progress && Array.isArray(progress)) {
        progress.forEach((p) => {
          if (p?.subject === subjectName && Array.isArray(p?.completedModules)) {
            p.completedModules.forEach((moduleId) => {
              if (moduleId) newCompletedIds.add(String(moduleId));
            });
          }
        });
      }
      localStorage.setItem(LS_IDS_KEY, JSON.stringify(Array.from(newCompletedIds)));
      
      // Force UI update
      setProgressUpdateTrigger(prev => prev + 1);
      
      console.log('[Progress Sync] Synced progress:', {
        serverCompleted: Array.from(serverCompletedSet),
        localCompleted: Array.from(localSet),
        completedIds: Array.from(newCompletedIds)
      });
    } catch (error) {
      console.error('[Progress Sync] Error:', error);
    }
  };

  
  // State to track available boards/subjects for fallback
  const [availableBoards, setAvailableBoards] = useState([]);
  const [availableSubjects, setAvailableSubjects] = useState([]);
  
  // Immediate fallback for new users to prevent black page
  const isNewUser = !user?.board && !user?.subject && !onboardingData?.board && !onboardingData?.subject;
  const [showImmediateFallback, setShowImmediateFallback] = useState(false);

  // Immediate fallback for new users to prevent black page
  useEffect(() => {
    if (!authLoading && isNewUser && unitsList.length === 0 && modulesList.length === 0) {
      console.log('Dashboard: Showing immediate fallback for new user');
      setShowImmediateFallback(true);
      // Set immediate dummy content
      const dummyChapter = {
        _id: 'immediate-dummy-chapter',
        title: 'Welcome to Learning!',
        subjectId: null,
        order: 1
      };
      const dummyModules = [
        { _id: 'immediate-dummy-module-1', title: 'Getting Started', order: 1 },
        { _id: 'immediate-dummy-module-2', title: 'First Lesson', order: 2 },
        { _id: 'immediate-dummy-module-3', title: 'Practice Time', order: 3 }
      ];
      const dummyUnit = { _id: 'immediate-dummy-unit', title: 'Unit 1 (Welcome)', virtual: true };
      
      setChaptersList([dummyChapter]);
      setUnitsList([dummyUnit]);
      setModulesList(dummyModules);
      setUnitModulesMap({ [dummyUnit._id]: dummyModules });
      setChapterTitle(dummyChapter.title);
      setUnitTitle(dummyUnit.title);
      setModuleTitle(dummyModules[0].title);
      setIsLoading(false);
    }
  }, [authLoading, isNewUser, unitsList.length, modulesList.length]);

  useEffect(() => {
    // Defer data loading until auth state resolves to avoid fetching with wrong defaults
    if (authLoading) return;
    const load = async () => {
      try {
        setIsLoading(true);
        console.log('Dashboard: Starting load...', { 
          user: user?._id, 
          selectedBoard, 
          subjectName, 
          authLoading,
          onboardingData 
        });
        // Import services concurrently and fetch progress + chapters in parallel
        const [authMod, curMod] = await Promise.all([
          import("../../../services/authService.js"),
          import("../../../services/curriculumService.js"),
        ]);
        const svc = authMod.default;
        const cur = curMod.default;
        
        // For new users without preferences, fetch available boards and subjects first
        let finalBoard = selectedBoard;
        let finalSubject = subjectName;
        
        // Check if user has no preferences (new user)
        const isNewUser = !user?.board && !user?.subject && !onboardingData?.board && !onboardingData?.subject;
        console.log('Dashboard: User preference check', { 
          isNewUser, 
          userBoard: user?.board, 
          userSubject: user?.subject, 
          onboardingBoard: onboardingData?.board, 
          onboardingSubject: onboardingData?.subject 
        });
        
        if (isNewUser) {
          console.log('Dashboard: New user detected, fetching available options...');
          try {
            const ac = new AbortController();
            const [boardsResp, subjectsResp] = await Promise.all([
              cur.listBoards({ signal: ac.signal }),
              cur.listSubjects(selectedBoard, { signal: ac.signal })
            ]);
            const boards = boardsResp?.data || [];
            const subjects = subjectsResp?.data || [];
            console.log('Dashboard: Available options fetched', { boards: boards.length, subjects: subjects.length });
            setAvailableBoards(boards);
            setAvailableSubjects(subjects);
            
            // Use first available board and subject if defaults don't exist
            if (boards.length > 0 && subjects.length > 0) {
              finalBoard = boards[0].name;
              finalSubject = subjects[0].name;
              console.log('Dashboard: Using first available options', { finalBoard, finalSubject });
            } else {
              console.warn('Dashboard: No available boards or subjects found');
            }
          } catch (e) {
            console.warn('Dashboard: Failed to fetch available options, using defaults', e);
          }
        }
        
        const ac2 = new AbortController();
        const validUserId = typeof user?._id === 'string' && user._id.length >= 8 && user._id !== 'undefined' ? user._id : null;
        const extraChapterParams = user?._id
          ? { userId: user._id, classTitle: user?.classLevel || user?.classTitle || undefined }
          : {};
        const [progressResp, chaptersResp] = await Promise.all([
          validUserId ? svc.getProgress(validUserId, { signal: ac2.signal }) : Promise.resolve({ data: [] }),
          cur.listChapters(finalBoard, finalSubject, extraChapterParams, { signal: ac2.signal }),
        ]);
        console.log('Dashboard: API responses', { progressResp: progressResp?.data, chaptersResp: chaptersResp?.data });
        const progressData = progressResp?.data || [];
        setProgress(progressData);
        if (USE_LOCAL_PROGRESS) {
          try {
            // Load progress for current chapter if available
            const currentChapterId = params.get("chapterId") || preferredChapterId;
            const local = loadLocalProgress(currentChapterId);
            const completedIdx = (progressData || [])
              .filter((p) => p?.conceptCompleted && p?.subject === subjectName)
              .map((p) => (p?.chapter ? p.chapter - 1 : null))
              .filter((n) => Number.isInteger(n));
            const key = currentChapterId ? `chapter_${currentChapterId}` : "default";
            const set = new Set([...(local[key] || []), ...completedIdx]);
            local[key] = Array.from(set);
            saveLocalProgress(local, currentChapterId);
          } catch (_) {}
        }
        // Load chapter & module titles
        
        let listCh = chaptersResp?.data || [];
        console.log('Dashboard: Chapters found', listCh);
        
        // If no chapters found, try other available options (fetch them if not present)
        if (listCh.length === 0) {
          console.log('Dashboard: No chapters found, trying other available options...');
          let boardsToTry = availableBoards;
          let subjectsToTry = availableSubjects;
          try {
            if (!boardsToTry || boardsToTry.length === 0) {
              const br = await cur.listBoards();
              boardsToTry = br?.data || [];
              setAvailableBoards(boardsToTry);
            }
          } catch (_) {}
          try {
            if (!subjectsToTry || subjectsToTry.length === 0) {
              const sr = await cur.listSubjects(finalBoard);
              subjectsToTry = sr?.data || [];
              setAvailableSubjects(subjectsToTry);
            }
          } catch (_) {}
          for (const board of boardsToTry) {
            for (const subject of subjectsToTry) {
              try {
                const altChaptersResp = await cur.listChapters(board.name, subject.name);
                const altChapters = altChaptersResp?.data || [];
                if (altChapters.length > 0) {
                  console.log('Dashboard: Found chapters with alternative options', { board: board.name, subject: subject.name, count: altChapters.length });
                  listCh = altChapters;
                  finalBoard = board.name;
                  finalSubject = subject.name;
                  break;
                }
              } catch (e) {
                console.warn('Dashboard: Failed to fetch chapters for', board.name, subject.name, e);
              }
            }
            if (listCh.length > 0) break;
          }
          // Absolute fallback: fetch any known default pairing
          if (listCh.length === 0) {
            console.log('Dashboard: Still no chapters, trying default CBSE/Science as a last resort...');
            try {
              const allChaptersResp = await cur.listChapters('CBSE', 'Science', {}, { signal: (new AbortController()).signal });
              const allChapters = allChaptersResp?.data || [];
              if (allChapters.length > 0) {
                listCh = allChapters;
                finalBoard = 'CBSE';
                finalSubject = 'Science';
              }
            } catch (e) {
              console.warn('Dashboard: Fallback chapter fetch failed', e);
            }
          }
        }
        
        // If still no chapters, stop here without creating dummies
        if (listCh.length === 0) {
          console.warn('Dashboard: No chapters available after all attempts');
          setChaptersList([]);
          setUnitsList([]);
          setModulesList([]);
          setIsLoading(false);
          setHasFetched(true);
          return;
        }
        
        setChaptersList(listCh);
        const params = new URLSearchParams(location.search);
        // Prioritize URL chapterId over preferredChapterId to persist user selection
        const preferId = params.get("chapterId") || preferredChapterId;
        // Normalize chapter objects from API (support variants like id, _id, chapterId or even strings)
        const toChapter = (raw, index = 0) => {
          if (!raw) return null;
          if (typeof raw === 'string') {
            return { _id: `str-${index}`, title: String(raw), order: index + 1 };
          }
          const id = raw._id || raw.id || raw.chapterId;
          const title = raw.title || raw.name || `Chapter ${index + 1}`;
          return id ? { _id: String(id), title, order: raw.order ?? index + 1 } : null;
        };
        const normalizedChapters = (listCh || []).map((c, i) => toChapter(c, i)).filter(Boolean);
        listCh = normalizedChapters;
        setChaptersList(listCh);
        let ch;
        if (preferId) {
          ch = listCh.find((c) => c && (c._id === preferId || String(c.title) === String(preferId)));
        }
        if (!ch) ch = listCh[0];
        if (!ch || !ch._id) {
          console.warn('Dashboard: No valid chapter found after normalization');
          setIsLoading(false);
          setHasFetched(true);
          return;
        }
        console.log('Dashboard: Selected chapter', ch);
        // Track final units/map to avoid referencing out-of-scope variables later
        let finalUnitsArr = [];
        let finalModulesMapVar = {};
        if (ch) {
          setChapterTitle(ch.title);
          setChapterId(ch._id);
          // Resolve unit title (prefer last opened unit for this chapter)
          try {
            // Hydrate units from cache immediately to render skeleton rails
            let units = loadUnitsCache(ch._id);
            if (Array.isArray(units) && units.length > 0) {
              setUnitsList(units);
            }
            // Fetch units for the real chapter id
            const ac = new AbortController();
            const unitsPromise = cur.listUnits(ch._id, { signal: ac.signal }).catch(() => ({ data: units || [] }));
            const unitsResp = await unitsPromise;
            units = unitsResp?.data || [];
            if (units.length > 0) saveUnitsCache(ch._id, units);
            finalUnitsArr = units;
            console.log('Dashboard: Units found', units);
            // If chapter has no explicit units but has modules, create a virtual unit to display modules
            if (!units || units.length === 0) {
              console.log('Dashboard: No units found, checking for chapter modules...');
              const list = ((await cur.listModules(ch._id))?.data || []);
              console.log('Dashboard: Chapter modules found', list.length);
              if (list.length > 0) {
                const virtualUnit = { _id: `virtual-${ch._id}`, title: 'Unit 1 (Auto)', virtual: true };
                units = [virtualUnit];
                console.log('Dashboard: Created virtual unit', virtualUnit);
                setUnitModulesMap({ [virtualUnit._id]: list });
                console.log('Dashboard: Set unit modules map for virtual unit', { [virtualUnit._id]: list });
              } else if (ch._id === 'dummy-chapter') {
                // Create dummy modules for dummy chapter
                console.log('Dashboard: Creating dummy modules for dummy chapter');
                const dummyModules = [
                  { _id: 'dummy-module-1', title: 'Getting Started', order: 1 },
                  { _id: 'dummy-module-2', title: 'First Lesson', order: 2 },
                  { _id: 'dummy-module-3', title: 'Practice Time', order: 3 }
                ];
                const virtualUnit = { _id: `virtual-${ch._id}`, title: 'Unit 1 (Welcome)', virtual: true };
                units = [virtualUnit];
                setUnitModulesMap({ [virtualUnit._id]: dummyModules });
                setModulesList(dummyModules);
                console.log('Dashboard: Created dummy modules', dummyModules);
              }
            }
            setUnitsList(units);
            // Use session cache immediately for modules map
            const cachedMap = loadUnitModulesCache(ch._id);
            const nextMap = { ...cachedMap };
            finalModulesMapVar = nextMap;
            setUnitModulesMap((prev) => ({ ...nextMap }));

            // Fetch each unit's modules in parallel and update state as they arrive
            const fetchPerUnit = async (u) => {
              if (u.virtual) return; // already set when virtual
              try {
                const resp = await cur.listModulesByUnit(u._id, { signal: (new AbortController()).signal });
                const list = resp?.data || [];
                nextMap[u._id] = list;
                setUnitModulesMap((prev) => {
                  const updated = { ...(prev || {}), [u._id]: list };
                  saveUnitModulesCache(ch._id, updated);
                  return updated;
                });
              } catch (_) {
                // Keep cached value on error
              }
            };
            // Fire and forget; don't await all to allow progressive paint
            try {
              await Promise.allSettled(units.map(fetchPerUnit));
            } catch (_) {}
            // Ensure virtual unit modules are included in the final map
            units.forEach(u => {
              if (u.virtual && !nextMap[u._id]) {
                nextMap[u._id] = cachedMap[u._id] || [];
              }
            });
            console.log('Dashboard: Modules map', nextMap);
            finalModulesMapVar = { ...(finalModulesMapVar || {}), ...nextMap };
            setUnitModulesMap((prev) => ({ ...(prev || {}), ...nextMap }));
            let lastMap = {};
            try {
              lastMap = JSON.parse(
                localStorage.getItem("last_unit_by_chapter") || "{}"
              );
            } catch (_) {
              lastMap = {};
            }
            const preferredUnitId =
              new URLSearchParams(location.search).get("unitId") ||
              lastMap?.[ch._id];
            const preferredUnit = units.find((u) => u?._id === preferredUnitId);
            const chosenUnit = preferredUnit || units[0];
            console.log('Dashboard: Chosen unit', chosenUnit);
            if (chosenUnit?.title) setUnitTitle(chosenUnit.title);
            // Use cached modules for chosen unit when available; otherwise fallback to chapter modules
            const cachedChosen = chosenUnit ? nextMap[chosenUnit._id] || [] : [];
            console.log('Dashboard: Chosen unit modules', cachedChosen);
            if (cachedChosen.length > 0) {
              setModulesList(cachedChosen);
              if (cachedChosen[0]) setModuleTitle(cachedChosen[0].title);
              // Reset per-module ledger when opening a new module list
              try { const mid = cachedChosen[0]?._id; if (mid) resetModuleLedger(String(mid)); } catch (_) {}
            } else {
              const modules = await cur.listModules(ch._id, { signal: (new AbortController()).signal });
              const list = modules?.data || [];
              console.log('Dashboard: Fallback chapter modules', list);
              setModulesList(list);
              if (list[0]) setModuleTitle(list[0].title);
              try { const mid = list[0]?._id; if (mid) resetModuleLedger(String(mid)); } catch (_) {}
            }
            // Safety: if units exist but chosenList is empty and chapter modules are also empty, avoid blank state by picking any first non-empty unit list
            if (units.length > 0 && (!modulesList || modulesList.length === 0)) {
              const firstNonEmpty = units.map((u) => nextMap[u._id] || []).find((arr) => arr.length > 0) || [];
              console.log('Dashboard: Safety check - firstNonEmpty', firstNonEmpty);
              if (firstNonEmpty.length > 0) {
                setModulesList(firstNonEmpty);
                setModuleTitle(firstNonEmpty[0]?.title || "");
                console.log('Dashboard: Set modules list from safety check', firstNonEmpty);
              }
            }
            
            // Final safety: If we still have no modules but have units, try to get modules from the first unit
            if (units.length > 0 && (!modulesList || modulesList.length === 0)) {
              const firstUnit = units[0];
              const firstUnitModules = nextMap[firstUnit._id] || [];
              console.log('Dashboard: Final safety check - firstUnitModules', firstUnitModules);
              if (firstUnitModules.length > 0) {
                setModulesList(firstUnitModules);
                setModuleTitle(firstUnitModules[0]?.title || "");
                console.log('Dashboard: Set modules list from final safety check', firstUnitModules);
              }
            }
          } catch (_) {
            setUnitTitle("");
            const modules = await cur.listModules(ch._id);
            const list = modules?.data || [];
            setModulesList(list);
            if (list[0]) setModuleTitle(list[0].title);
          }
        }
        console.log('Dashboard: Load complete', { 
          unitsList: unitsList.length, 
          modulesList: modulesList.length,
          finalUnits: finalUnitsArr,
          finalModulesMap: finalModulesMapVar
        });
        
        // Clear immediate fallback if we loaded real data
        if (showImmediateFallback && ((finalUnitsArr && finalUnitsArr.length > 0) || modulesList.length > 0)) {
          console.log('Dashboard: Clearing immediate fallback, real data loaded');
          setShowImmediateFallback(false);
        }
        
        setIsLoading(false);
        setHasFetched(true);
      } catch (e) {
        console.error("Error loading dashboard data:", e);
        // Fallback: render a minimal dummy path so the UI is usable even on errors
        try {
          const dummyChapter = { _id: 'dummy-chapter', title: 'Welcome to Learning!', subjectId: null, order: 1 };
          const dummyUnit = { _id: 'dummy-unit', title: 'Unit 1 (Welcome)', virtual: true };
          const dummyModules = [
            { _id: 'dummy-module-1', title: 'Getting Started', order: 1 },
            { _id: 'dummy-module-2', title: 'First Lesson', order: 2 },
            { _id: 'dummy-module-3', title: 'Practice Time', order: 3 },
          ];
          setChaptersList([dummyChapter]);
          setChapterId(dummyChapter._id);
          setChapterTitle(dummyChapter.title);
          setUnitsList([dummyUnit]);
          setUnitTitle(dummyUnit.title);
          setUnitModulesMap({ [dummyUnit._id]: dummyModules });
          setModulesList(dummyModules);
          setModuleTitle(dummyModules[0].title);
        } catch (_) {}
        setIsLoading(false);
        setHasFetched(true);
      }
    };
    load();
  }, [user, selectedBoard, subjectName, preferredChapterId, authLoading, onboardingData, location.search]);

  // Restore scroll position when returning to dashboard (using useLayoutEffect for instant restoration)
  useLayoutEffect(() => {
    // Check if we have a saved position
    const savedPosition = sessionStorage.getItem('dashboardScrollPos');
    
    if (savedPosition && !isLoading && unitsList.length > 0) {
      const scrollContainer = document.getElementById("tree-scroll-container");
      if (scrollContainer) {
        // Restore the scroll position instantly (before paint to prevent flicker)
        scrollContainer.scrollTop = parseInt(savedPosition, 10);
        console.log('[Scroll Preservation] Restored scroll position:', savedPosition);
        
        // Clear it so it doesn't stick forever (optional - remove if you want it to persist)
        // sessionStorage.removeItem('dashboardScrollPos');
      }
    }
  }, [isLoading, unitsList]);

  // Scroll to Active Unit (fallback if no saved position)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const targetUnitId = params.get("unitId");
    const savedPosition = sessionStorage.getItem('dashboardScrollPos');

    // Only scroll to active unit if there's no saved position
    if (savedPosition) return;

    if (targetUnitId && !isLoading && unitsList.length > 0) {
      const attemptScroll = () => {
        const element = document.querySelector(`[data-unit-id="${targetUnitId}"]`);
        const scrollContainer = document.getElementById("tree-scroll-container");
        
        if (element && scrollContainer) {
          // Calculate scroll position to center the element within the container
          const containerRect = scrollContainer.getBoundingClientRect();
          const elementRect = element.getBoundingClientRect();
          const scrollTop = scrollContainer.scrollTop;
          const elementTop = elementRect.top - containerRect.top + scrollTop;
          const containerHeight = scrollContainer.clientHeight;
          const elementHeight = elementRect.height;
          
          // Calculate scroll position to center the element
          const targetScroll = elementTop - (containerHeight / 2) + (elementHeight / 2);
          
          scrollContainer.scrollTo({
            top: targetScroll,
            behavior: 'smooth'
          });
          
          return true;
        }
        return false;
      };

      // Immediate attempt
      let interval = null;
      let timeout = null;
      
      if (!attemptScroll()) {
        // Retry logic for image/layout delays
        interval = setInterval(() => {
          if (attemptScroll()) {
            clearInterval(interval);
            interval = null;
          }
        }, 100);
        
        timeout = setTimeout(() => {
          if (interval) {
            clearInterval(interval);
            interval = null;
          }
        }, 2000);
      }

      // Cleanup function
      return () => {
        if (interval) clearInterval(interval);
        if (timeout) clearTimeout(timeout);
      };
    }
  }, [location.search, isLoading, unitsList]);

  // When opening chapters grid, load per-chapter module counts and compute simple completion
  // Debounced and not tied to rapid progress changes to avoid flicker
  useEffect(() => {
    if (!showChapters || chaptersList.length === 0) return;
    let cancelled = false;
    setStatsLoading(true);
    const timer = setTimeout(async () => {
      try {
        const cur = (await import("../../../services/curriculumService.js"))
          .default;
        const completedIds = loadCompletedIds();
        const nextStats = {};
        for (let i = 0; i < chaptersList.length; i++) {
          const ch = chaptersList[i];
          try {
            const mods = await cur.listModules(ch._id);
            const modList = mods?.data || [];
            const total = modList.length || 0;
            // Completed: count modules whose IDs are in local completed id set
            const completed = modList.reduce((acc, m) => acc + (completedIds.has(String(m?._id)) ? 1 : 0), 0);
            nextStats[ch._id] = { total, completed };
          } catch (_) {
            nextStats[ch._id] = { total: 0, completed: 0 };
          }
          if (cancelled) return;
        }
        if (!cancelled) setChapterStats(nextStats);
      } catch (_) {}
      if (!cancelled) setStatsLoading(false);
    }, 300);
    return () => {
      cancelled = true;
      setStatsLoading(false);
      clearTimeout(timer);
    };
  }, [showChapters, chaptersList]);

  // Rotate tips every 5 seconds
  useEffect(() => {
    if (tipHidden) return;
    const id = setInterval(
      () => setTipIndex((i) => (i + 1) % tips.length),
      5000
    );
    return () => clearInterval(id);
  }, [tipHidden]);

  // Daily streak: auto-increment on first visit of the day
  useEffect(() => {
    try {
      const today = new Date().toDateString();
      const storedDay = localStorage.getItem("daily_streak_day");
      let count = Number(localStorage.getItem("daily_streak_count")) || 0;
      if (!storedDay) {
        count = Math.max(1, count);
        localStorage.setItem("daily_streak_count", String(count));
        localStorage.setItem("daily_streak_day", today);
      } else if (storedDay !== today) {
        count = count + 1;
        localStorage.setItem("daily_streak_count", String(count));
        localStorage.setItem("daily_streak_day", today);
        setShowConfetti(true);
        try {
          setTimeout(() => setShowConfetti(false), 1500);
        } catch (_) {}
      }
      setStreak(count || 1);
    } catch (_) {}
  }, []);

  // Refresh progress when window gains focus (user returns from lesson)
  useEffect(() => {
    const handleFocus = () => {
      // Force a re-render by updating a dummy state
      setHoveredIndex(prev => prev === null ? -1 : null);
    };
    
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  // Subject change functions
  const handleOpenSubjectModal = async () => {
    try {
      setSubjectChanging(true);
      const cur = (await import("../../../services/curriculumService.js")).default;
      const res = await cur.listSubjects(selectedBoard);
      const subjects = (res?.data || []).map(s => s.name);
      setSubjectOptions(subjects);
      setShowSubjectModal(true);
    } catch (error) {
      console.error('Failed to load subjects:', error);
      alert('Failed to load subjects. Please try again.');
    } finally {
      setSubjectChanging(false);
    }
  };

  const handleSubjectChange = async (newSubject) => {
    try {
      setSubjectChanging(true);
      setShowSubjectModal(false);
      
      console.log('Changing subject to:', newSubject);
      console.log('User ID:', user._id);
      
      // Validate user ID
      if (!user._id) {
        throw new Error('User ID not found. Please log in again.');
      }
      
      // Check if user ID is a valid MongoDB ObjectId format
      const objectIdRegex = /^[0-9a-fA-F]{24}$/;
      if (!objectIdRegex.test(user._id)) {
        throw new Error('Invalid user ID format. Please log in again.');
      }
      
      // Update user profile with new subject
      const response = await authService.updateProfile({
        userId: user._id,
        subject: newSubject
      });
      
      console.log('Update profile response:', response);
      
      // Update local user state to show correct subject name immediately
      const updatedUser = { ...user, subject: newSubject };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      // Immediately reload the page to show the new subject content
      window.location.reload();
      
    } catch (error) {
      console.error('Failed to change subject:', error);
      console.error('Error details:', error.response?.data || error.message);
      alert(`Failed to change subject: ${error.response?.data?.message || error.message}. Please try again.`);
      setSubjectChanging(false);
    }
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem("learnOnboarded");
      // Clear ALL progress-related localStorage on logout
      if (USE_LOCAL_PROGRESS) {
        try {
          // Clear user-scoped keys
          localStorage.removeItem(userScopedKey(LS_KEY_BASE));
          localStorage.removeItem(userScopedKey(LS_IDS_KEY_BASE));
          
          // Clear non-scoped keys (backward compatibility)
          localStorage.removeItem(LS_KEY_BASE);
          localStorage.removeItem(LS_IDS_KEY_BASE);
          
          // Clear any other progress-related keys
          localStorage.removeItem("daily_streak_day");
          localStorage.removeItem("daily_streak_count");
          
          console.log('[Logout] Cleared all progress localStorage');
        } catch (_) {}
      }
    } catch (_) {}
    logout?.();
    try {
      window.location.href = "/";
    } catch (_) {}
  };

  const levels = modulesList;
  
  // Force re-calculation of progress state when component updates
  const [progressUpdateTrigger, setProgressUpdateTrigger] = useState(0);
  
  // Re-calculate progress state when trigger changes
  const progressState = useMemo(() => {
    const serverCompletedSet = new Set(
      (progress || [])
        .filter((p) => p?.conceptCompleted && p?.subject === subjectName)
        .map((p) => (p?.chapter ? p.chapter - 1 : -1))
        .filter((i) => i >= 0)
    );
    // Load local progress for current chapter to ensure chapter-specific tracking
    const localProgress = loadLocalProgress(chapterId);
    const allCompletedIds = loadCompletedIds();
    
    // CRITICAL FIX: Load completed composite keys (new format) - PRIMARY SOURCE
    const completedCompositeKeys = loadCompletedCompositeKeys();
    
    // CRITICAL FIX: Get completedModules from backend progress (more accurate than chapter-level)
    const backendCompletedModuleIds = new Set();
    if (progress && Array.isArray(progress)) {
      progress.forEach((p) => {
        if (p?.subject === subjectName && Array.isArray(p?.completedModules)) {
          p.completedModules.forEach((moduleId) => {
            if (moduleId) backendCompletedModuleIds.add(String(moduleId));
          });
        }
      });
    }
    
    // CRITICAL FIX: Filter completed IDs to only include modules from the CURRENT chapter
    // This prevents modules from other chapters being marked as completed
    // IMPORTANT: Include modules from both modulesList AND unitModulesMap (for units)
    const chapterModuleIds = new Set(
      (modulesList || []).map(m => m?._id ? String(m._id) : null).filter(Boolean)
    );
    
    // Also include all modules from unitModulesMap for this chapter
    if (unitModulesMap && typeof unitModulesMap === 'object') {
      Object.values(unitModulesMap).forEach((unitModules) => {
        if (Array.isArray(unitModules)) {
          unitModules.forEach((m) => {
            if (m?._id) {
              chapterModuleIds.add(String(m._id));
            }
          });
        }
      });
    }
    
    const currentChapterModuleIds = chapterModuleIds;
    
    // Merge backend completedModules with local completedIds, but only for current chapter
    // CRITICAL FIX: Don't filter if currentChapterModuleIds is empty (modules not loaded yet)
    // This prevents stars from disappearing on refresh before modules are loaded
    const completedIdSet = currentChapterModuleIds.size > 0
      ? new Set(
          Array.from(allCompletedIds)
            .filter(id => currentChapterModuleIds.has(id))
            .concat(Array.from(backendCompletedModuleIds).filter(id => currentChapterModuleIds.has(id)))
        )
      : new Set(
          // If modules not loaded yet, include all IDs to prevent flicker
          // They will be filtered properly once modules are loaded
          Array.from(allCompletedIds).concat(Array.from(backendCompletedModuleIds))
        );
    
    // Debug logging to help identify sync issues
    console.log('[Dashboard Progress Debug]', {
      serverProgress: progress || [],
      serverCompletedSet: Array.from(serverCompletedSet),
      localProgress,
      allCompletedIds: Array.from(allCompletedIds),
      currentChapterModuleIds: Array.from(currentChapterModuleIds),
      filteredCompletedIdSet: Array.from(completedIdSet),
      completedCompositeKeys: Array.from(completedCompositeKeys),
      chapterId,
      modulesList: modulesList?.map((m, i) => ({ index: i, id: m?._id, title: m?.title }))
    });
    
    return {
      serverCompletedSet,
      localProgress,
      completedIdSet,
      completedCompositeKeys // NEW: Include composite keys for checking completion
    };
  }, [progress, progressUpdateTrigger, modulesList, unitModulesMap, chapterId, subjectName, user?._id, user?.subject]);
  
  const { serverCompletedSet, localProgress, completedIdSet, completedCompositeKeys } = progressState;
  
  // Listen for storage events to update progress when other tabs/pages update localStorage
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key && (e.key.includes('lesson_progress_v2') || e.key.includes('lesson_completed_ids_v1'))) {
        console.log('[Dashboard] Storage changed, refreshing progress:', e.key);
        setProgressUpdateTrigger(prev => prev + 1);
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    // Also listen for custom events from same-tab updates
    window.addEventListener('progressUpdated', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('progressUpdated', handleStorageChange);
    };
  }, []);
  
  // Trigger progress update when returning to dashboard
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        setProgressUpdateTrigger(prev => prev + 1);
        // Also sync progress when returning to dashboard
        setTimeout(syncProgress, 100);
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [progress, modulesList]);

  // Auto-sync progress when component loads or progress changes
  useEffect(() => {
    if (progress && modulesList && modulesList.length > 0) {
      // Small delay to ensure all data is loaded
      const timeoutId = setTimeout(syncProgress, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [progress, modulesList]);

  // Clear localStorage when user changes (account switching)
  useEffect(() => {
    if (user?._id) {
      // Clear any existing localStorage from previous accounts
      const clearPreviousAccountData = () => {
        try {
          // Clear non-scoped keys that might contain previous account data
          localStorage.removeItem(LS_KEY_BASE);
          localStorage.removeItem(LS_IDS_KEY_BASE);
          console.log('[Account Switch] Cleared previous account localStorage');
        } catch (_) {}
      };
      
      clearPreviousAccountData();
    }
  }, [user?._id]);

  // Fetch completed module IDs; apply monotonic union (never remove) and debounce to avoid flicker
  useEffect(() => {
    if (!user?._id) return;
    const debounce = setTimeout(async () => {
      try {
        const resp = await authService.getCompletedModuleIds(user._id, { subject: subjectName });
        const ids = Array.isArray(resp?.data?.completedModuleIds) ? resp.data.completedModuleIds : [];
        const current = loadCompletedIds();
        ids.forEach((id) => current.add(String(id)));
        localStorage.setItem(LS_IDS_KEY, JSON.stringify(Array.from(current)));
        setProgressUpdateTrigger((prev) => prev + 1);
        console.log('[Progress Sync] Completed IDs from server:', ids);
      } catch (e) {
        console.warn('[Progress Sync] Failed to fetch completed IDs:', e);
      }
    }, 500);
    return () => clearTimeout(debounce);
  }, [user?._id, subjectName, modulesList.length]);

  

  // Note: firstIncompleteIndex will be computed per unit to reflect local/module-id completion
  const firstIncompleteIndex = levels.findIndex((_, i) => !serverCompletedSet.has(i));

  const amplitude = 20; // Reduced from 30
  const nodesCount = levels.length + 1; // modules + revision node
  const rowSpacing = 120; // Reduced from 160px per row
  const centerTopOffset = 60; // Reduced from 80
  const listHeight = nodesCount * rowSpacing;
  const lineHeight = Math.max(150, levels.length * rowSpacing - 100); // Reduced from 200 and 120

  return (
    <ReviewProvider>
      <div className="bg-gradient-to-b from-[#E6F2FF] to-[#F7FBFF] h-screen flex flex-col md:flex-row overflow-hidden">
        {/* Mobile Header */}
        <div className="md:hidden bg-white border-b border-blue-200 p-4 flex items-center justify-between shadow-lg">
          <h1 className="text-2xl font-extrabold text-blue-600">HoshiYaar</h1>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-lg hover:bg-blue-50 transition-colors"
          >
            {isMobileMenuOpen ? <CloseIcon /> : <HamburgerIcon />}
          </button>
        </div>

        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div 
            className="md:hidden fixed inset-0 z-50 bg-black bg-opacity-50"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        {/* Mobile Menu Sidebar */}
        <nav className={`md:hidden fixed top-0 left-0 h-full w-64 bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-extrabold text-blue-600">HoshiYaar</h1>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 rounded-lg hover:bg-blue-50 transition-colors"
              >
                <CloseIcon />
              </button>
            </div>
            <a
              href="#"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`flex items-center gap-4 py-3 px-4 rounded-xl text-lg font-bold transition-colors bg-blue-500 text-white shadow-md`}
            >
              <LearnIcon />
              <span>Learn</span>
            </a>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setIsMobileMenuOpen(false);
                navigate("/revision");
              }}
              className={`flex items-center gap-4 py-3 px-4 rounded-xl text-lg font-bold transition-colors text-gray-600 hover:bg-blue-50`}
            >
              <ReviseIcon />
              <span>Revision</span>
            </a>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setIsMobileMenuOpen(false);
                navigate("/profile");
              }}
              className={`flex items-center gap-4 py-3 px-4 rounded-xl text-lg font-bold transition-colors text-gray-600 hover:bg-blue-50`}
            >
              <ProfileIcon />
              <span>Profile</span>
            </a>
            <a
              href="https://drive.google.com/file/d/1O_cZFjm4eQSp2S55_6_Ly7zsHhZsX7hG/view?usp=sharing"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 py-3 px-4 rounded-xl border-2 border-blue-100 bg-white text-blue-700 shadow-sm hover:bg-blue-50 transition-colors"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-500 text-lg">📂</div>
              <div className="text-left">
                <p className="text-sm font-extrabold leading-tight text-blue-700">Resource Drop 1</p>
                <p className="text-xs text-blue-500/80">Google Drive</p>
              </div>
              <span className="text-lg text-blue-400">↗</span>
            </a>
            <a
              href="https://drive.google.com/file/d/1O_cZFjm4eQSp2S55_6_Ly7zsHhZsX7hG/view?usp=sharing"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 py-3 px-4 rounded-xl border-2 border-blue-100 bg-white text-blue-700 shadow-sm hover:bg-blue-50 transition-colors"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-500 text-lg">📂</div>
              <div className="text-left">
                <p className="text-sm font-extrabold leading-tight text-blue-700">Resource Drop 2</p>
                <p className="text-xs text-blue-500/80">Google Drive</p>
              </div>
              <span className="text-lg text-blue-400">↗</span>
            </a>
            <a
              href="https://drive.google.com/file/d/1O_cZFjm4eQSp2S55_6_Ly7zsHhZsX7hG/view?usp=sharing"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 py-3 px-4 rounded-xl border-2 border-blue-100 bg-white text-blue-700 shadow-sm hover:bg-blue-50 transition-colors"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-500 text-lg">📂</div>
              <div className="text-left">
                <p className="text-sm font-extrabold leading-tight text-blue-700">Resource Drop 3</p>
                <p className="text-xs text-blue-500/80">Google Drive</p>
              </div>
              <span className="text-lg text-blue-400">↗</span>
            </a>
          </div>
        </nav>

        {/* Desktop Sidebar */}
        <nav className="hidden md:flex md:w-64 p-6 space-y-4 border-r border-blue-200 flex-col justify-start shrink-0 bg-white shadow-lg">
          <h1 className="text-3xl font-extrabold text-blue-600 mb-6">
            HoshiYaar
          </h1>
          <a
            href="#"
            className={`flex items-center gap-4 py-3 px-4 rounded-xl text-lg font-bold transition-colors bg-blue-500 text-white shadow-md`}
          >
            <LearnIcon />
            <span>Learn</span>
          </a>
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              navigate("/revision");
            }}
            className={`flex items-center gap-4 py-3 px-4 rounded-xl text-lg font-bold transition-colors text-gray-600 hover:bg-blue-50`}
          >
            <ReviseIcon />
            <span>Revision</span>
          </a>
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              navigate("/profile");
            }}
            className={`flex items-center gap-4 py-3 px-4 rounded-xl text-lg font-bold transition-colors text-gray-600 hover:bg-blue-50`}
          >
            <ProfileIcon />
            <span>Profile</span>
          </a>
        <a
          href="https://drive.google.com/file/d/1s6DgcP-hu7vdm6La7WwABPlvsetxZNiM/view"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 py-3 px-4 rounded-xl border-2 border-blue-100 bg-white text-blue-700 shadow-sm hover:bg-blue-50 transition-colors"
        >
          <div className="flex h-5 w-5 items-center justify-center rounded-lg bg-blue-50 text-blue-500 text-lg">📂</div>
          <div className="text-left">
            <p className="text-sm font-extrabold leading-tight text-blue-700">Resource Drop 1</p>
            <p className="text-xs text-blue-500/80">Google Drive</p>
          </div>
          <span className="text-lg text-blue-400">↗</span>
        </a>
        <a
          href="https://docs.google.com/forms/d/e/1FAIpQLScOIcWmNcebXFgfgLxmfAt0Pd4hzPyhphUOsDbXsBX4pLexHw/viewform"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 py-3 px-4 rounded-xl border-2 border-blue-100 bg-white text-blue-700 shadow-sm hover:bg-blue-50 transition-colors"
        >
          <div className="flex h-5 w-5 items-center justify-center rounded-lg bg-blue-50 text-blue-500 text-lg">📂</div>
          <div className="text-left">
            <p className="text-sm font-extrabold leading-tight text-blue-700">Resource Drop 2</p>
            <p className="text-xs text-blue-500/80">Google Drive</p>
          </div>
          <span className="text-lg text-blue-400">↗</span>
        </a>
        <a
          href="https://docs.google.com/forms/d/e/1FAIpQLScmiG8DzBgY5Z9Aa2DiI0J7GOuKEYa5UABri8qXfPehmiK0bg/viewform"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 py-3 px-4 rounded-xl border-2 border-blue-100 bg-white text-blue-700 shadow-sm hover:bg-blue-50 transition-colors"
        >
          <div className="flex h-5 w-5 items-center justify-center rounded-lg bg-blue-50 text-blue-500 text-lg">📂</div>
          <div className="text-left">
            <p className="text-sm font-extrabold leading-tight text-blue-700">Resource Drop 3</p>
            <p className="text-xs text-blue-500/80">Google Drive</p>
          </div>
          <span className="text-lg text-blue-400">↗</span>
        </a>
        <a
          href="https://docs.google.com/forms/d/1SgerXkOG-lT3RR0TejOC2w4MBGE7Bbpy9RCzQ9dpocE/viewform?edit_requested=true"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 py-3 px-4 rounded-xl border-2 border-blue-100 bg-white text-blue-700 shadow-sm hover:bg-blue-50 transition-colors"
        >
          <div className="flex h-5 w-5 items-center justify-center rounded-lg bg-blue-50 text-blue-500 text-lg">📂</div>
          <div className="text-left">
            <p className="text-sm font-extrabold leading-tight text-blue-700">Resource Drop 4</p>
            <p className="text-xs text-blue-500/80">Google Drive</p>
          </div>
          <span className="text-lg text-blue-400">↗</span>
        </a>
        <a
          href="https://drive.google.com/drive/folders/1O2NlDltqr3hodICT_UrH2tCJaLfC2zqd?usp=sharing"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 py-3 px-4 rounded-xl border-2 border-blue-100 bg-white text-blue-700 shadow-sm hover:bg-blue-50 transition-colors"
        >
          <div className="flex h-5 w-5 items-center justify-center rounded-lg bg-blue-50 text-blue-500 text-lg">📂</div>
          <div className="text-left">
            <p className="text-sm font-extrabold leading-tight text-blue-700">Resource Drop 5</p>
            <p className="text-xs text-blue-500/80">Google Drive</p>
          </div>
          <span className="text-lg text-blue-400">↗</span>
        </a>
        </nav>

        <main className="flex-grow p-3 md:p-6 overflow-auto no-scrollbar bg-transparent mt-16 md:mt-0">
          {/* Mobile Score Display - Fancy Extension Style - only visible on small screens */}
          <div className="md:hidden fixed bottom-4 right-4 z-40">
            <div className="bg-gradient-to-br from-yellow-50 via-yellow-100 to-orange-100 rounded-xl shadow-2xl border-2 border-yellow-300 p-3 flex items-center gap-2 min-w-[75px] backdrop-blur-sm">
              <div className="relative">
                <span className="text-yellow-600 text-xl drop-shadow-sm">⭐</span>
                <div className="absolute inset-0 text-yellow-400 text-xl blur-sm opacity-50">⭐</div>
              </div>
              <span className="text-gray-800 font-extrabold text-sm bg-white/50 px-1.5 py-0.5 rounded-md">
                {stars}
              </span>
            </div>
          </div>

          {/* Section Header (hide when viewing chapters list). If units exist, headers are shown per unit below, so hide this top one. */}
          

        {/* Loading screen removed per request */}

          {/* Vertical timelines - stacked per unit (scroll to view more) */}
          {(
            unitsList.length > 0 || modulesList.length > 0 || true
          ) && (
            <div
              id="tree-scroll-container"
              className={`${
                showChapters ? "relative w-full" : "relative max-w-4xl"
              } mx-auto h-[80vh] overflow-y-auto no-scrollbar`}
            >
              {showChapters ? (
                <div className="w-full px-4 md:px-8">
                  <div className="bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 text-white rounded-3xl p-6 md:p-8 shadow-2xl ring-4 ring-white/30 w-full relative overflow-hidden">
                    {/* Decorative background elements */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24 blur-3xl"></div>
                    
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl md:text-3xl font-extrabold text-white drop-shadow-lg">All Chapters</h2>
                        <button
                          onClick={() => setShowChapters(false)}
                          className="text-white/90 hover:text-white hover:bg-white/20 rounded-full p-2 transition-all duration-200 text-2xl w-10 h-10 flex items-center justify-center"
                        >
                          ✕
                        </button>
                      </div>
                      {statsLoading && (
                        <div className="flex justify-center items-center py-10">
                          <div className="animate-spin rounded-full h-12 w-12 border-4 border-white/30 border-t-white"></div>
                          <span className="ml-3 font-extrabold text-lg">Loading chapter stats…</span>
                        </div>
                      )}
                      <div className="grid grid-cols-1 gap-4 md:gap-6 max-h-[65vh] overflow-y-auto custom-scrollbar pr-2">
                        {chaptersList.map((ch, index) => {
                          const st = chapterStats[ch._id] || { total: 0, completed: 0 };
                          const pct = st.total > 0 ? Math.min(100, Math.round((st.completed / st.total) * 100)) : 0;
                          
                          return (
                            <div
                              key={ch._id}
                              className="group w-full min-h-[200px] md:min-h-[220px] rounded-3xl p-5 md:p-6 bg-white text-blue-700 border-4 border-blue-200/50 shadow-[0_8px_0_0_rgba(59,130,246,0.2)] hover:shadow-[0_12px_0_0_rgba(59,130,246,0.3)] transition-all duration-300 hover:scale-[1.02] hover:border-blue-300 flex items-center gap-6 relative overflow-hidden"
                              style={{ animationDelay: `${index * 50}ms` }}
                            >
                              {/* Gradient background effect */}
                              <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                              
                              <div className="flex-1 relative z-10">
                                <div className="text-xl md:text-2xl font-extrabold leading-tight mb-3 text-blue-900 group-hover:text-blue-800 transition-colors">
                                  {ch.title}
                                </div>
                                
                                {/* Enhanced progress bar */}
                                <div className="mt-4 mb-2">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs font-bold text-blue-600/80">Progress</span>
                                    <span className="text-xs font-extrabold text-blue-700">{st.completed} / {st.total || "?"}</span>
                                  </div>
                                  <div className="h-4 bg-blue-100 rounded-full overflow-hidden shadow-inner">
                                    <div
                                      className="h-full bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600 rounded-full transition-all duration-500 ease-out relative overflow-hidden"
                                      style={{ width: `${pct}%` }}
                                    >
                                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="mt-5">
                                  <button
                                    onClick={async () => {
                                      setShowChapters(false);
                                      if (ch?._id) {
                                        // Update URL with chapterId to persist selection
                                        navigate(`/learn?chapterId=${encodeURIComponent(ch._id)}`, { replace: false });
                                        // Immediately update state to reflect the change
                                        setChapterId(ch._id);
                                        setChapterTitle(ch.title);
                                        
                                        // Update database with the selected chapter
                                        if (user?._id) {
                                          try {
                                            const response = await authService.updateProfile({
                                              userId: user._id,
                                              chapter: ch.title, // Save chapter title to user profile
                                            });
                                            console.log('Chapter saved to database:', ch.title);
                                            
                                            // Update local user state to reflect the change immediately
                                            const updatedUser = response?.data ? { ...user, ...response.data } : { ...user, chapter: ch.title, chapterId: ch._id };
                                            try {
                                              // Also save chapter ID to localStorage for quick retrieval
                                              localStorage.setItem(`last_selected_chapter_${user._id}_${subjectName}`, ch._id);
                                              // Update AuthContext user state immediately
                                              if (updateUser) {
                                                updateUser(updatedUser);
                                              } else {
                                                // Fallback to localStorage only
                                                localStorage.setItem('user', JSON.stringify(updatedUser));
                                              }
                                            } catch (e) {
                                              console.warn('Failed to update user state:', e);
                                            }
                                          } catch (error) {
                                            console.error('Failed to save chapter to database:', error);
                                            // Still save to localStorage as fallback
                                            try {
                                              localStorage.setItem(`last_selected_chapter_${user._id}_${subjectName}`, ch._id);
                                            } catch (_) {}
                                            // Don't block UI if save fails
                                          }
                                        } else {
                                          // Save to localStorage even if not logged in
                                          try {
                                            localStorage.setItem(`last_selected_chapter_anon_${subjectName}`, ch._id);
                                          } catch (_) {}
                                        }
                                      }
                                    }}
                                    className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 via-blue-600 to-indigo-600 hover:from-blue-700 hover:via-blue-700 hover:to-indigo-700 text-white font-extrabold text-sm md:text-base shadow-[0_6px_0_0_rgba(37,99,235,0.4)] hover:shadow-[0_8px_0_0_rgba(37,99,235,0.5)] transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] relative overflow-hidden group"
                                  >
                                    <span className="relative z-10 flex items-center justify-center gap-2">
                                      <span>CONTINUE</span>
                                      <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                      </svg>
                                    </span>
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                                  </button>
                                </div>
                              </div>
                              
                              {/* Chapter illustration (right side) */}
                              <div className="flex-shrink-0 pr-2 hidden md:block relative z-10">
                                <div className="relative">
                                  <img
                                    src={chapterImg}
                                    alt="Chapter"
                                    className="w-36 h-36 md:w-44 md:h-44 object-contain opacity-95 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300"
                                  />
                                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center text-xl animate-bounce">
                                    ❤️
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {/* Center line (dynamic height) */}
                  {/* Render each unit block one after another */}
                  {(() => {
                    if (unitsList.length === 0 && modulesList.length > 0) {
                      return (
                        <div 
                          className="relative pt-12 pb-28"
                          data-chapter-id={chapterId}
                        >
                      {/* Unit header card for direct modules */}
                      <div className="sticky top-0 z-30 text-white px-6 py-5 rounded-3xl flex justify-between items-center mb-8 shadow-[0_10px_0_0_rgba(0,0,0,0.15)] max-w-3xl mx-auto border-4"
                           style={{ background: `linear-gradient(90deg, #2C6DEF, #1E4A8C)`, borderColor: 'rgba(44, 109, 239, 0.25)' }}>
                        <div>
                          <p className="font-extrabold text-xl md:text-2xl">
                            {chapterTitle || 'Learning Modules'}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <p className="opacity-95 text-base md:text-lg">
                              {subjectName}
                            </p>
                            <button
                              onClick={handleOpenSubjectModal}
                              disabled={isLoading || subjectChanging}
                              className={`flex items-center gap-2 py-2 px-4 rounded-2xl bg-white/15 hover:bg-white/25 transition-colors ring-2 ring-white/40 text-sm font-extrabold ${(isLoading || subjectChanging) ? 'opacity-50 cursor-not-allowed' : ''}`}
                              title={subjectChanging ? "Switching Subject..." : "Change Subject"}
                            >
                              {subjectChanging ? "Switching..." : "Change"}
                            </button>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => setShowChapters(true)} 
                            className="flex items-center gap-2.5 py-2 px-4 rounded-xl bg-white/15 hover:bg-white/25 transition-colors ring-2 ring-white/40 text-base"
                          >
                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-white/20 flex-shrink-0">
                              <ChapterNavIcon />
                            </span>
                            <span className="font-bold hidden sm:inline leading-tight self-center">All Chapters</span>
                          </button>
                          {/* Debug button to clear false completions */}
                          <button 
                            onClick={clearFalseCompletions} 
                            className="flex items-center gap-2 py-2 px-3 rounded-xl bg-red-500/20 hover:bg-red-500/30 transition-colors ring-1 ring-red-400/40 text-sm text-red-100"
                            title="Clear false completions (Debug)"
                          >
                            <span className="text-xs">🔄</span>
                            <span className="font-medium hidden sm:inline">Reset Progress</span>
                          </button>
                        </div>
                      </div>
                      
                      {/* Render modules directly */}
                      <div className="relative flex flex-col items-center gap-16 sm:gap-20 md:gap-24 pt-20 sm:pt-24 md:pt-28 pb-6 sm:pb-8 px-8 sm:px-12 md:px-16 lg:px-20 xl:px-24">
                        {modulesList.map((mod, index) => {
                          // --- CRITICAL FIX: Check completion using composite key (chapterId:unitId:lessonId) ---
                          const moduleIdHere = mod?._id;
                          const unitIdHere = null; // No unit for direct chapter modules
                          const chapterIdHere = chapterId;
                          
                          // CRITICAL FIX: Check completion using composite key ONLY (prevents collisions)
                          // Don't use module ID alone as it can cause collisions across units
                          const compositeKey = progressKey(chapterIdHere, unitIdHere, moduleIdHere);
                          const isCompletedByCompositeKey = completedCompositeKeys.has(compositeKey);
                          
                          // Only use module ID check if composite key doesn't exist (for migration from old data)
                          // But prioritize composite key to prevent collisions
                          const isCompletedById = moduleIdHere && !isCompletedByCompositeKey 
                            ? completedIdSet.has(String(moduleIdHere)) 
                            : false;
                          
                          // Lesson is completed ONLY if composite key exists (primary check)
                          // Module ID check is only for backward compatibility during migration
                          const isCompleted = isCompletedByCompositeKey || isCompletedById;

                          // First module in this list that is not completed by composite key or ID
                          const firstIncompleteForUnit = modulesList.findIndex((m) => {
                            const id = m?._id;
                            if (!id) return true;
                            const key = progressKey(chapterIdHere, null, id);
                            return !completedCompositeKeys.has(key) && !completedIdSet.has(String(id));
                          });

                          let status = "locked";
                          if (isCompleted) {
                            status = "completed";
                          } else if (index === firstIncompleteForUnit) {
                            status = "active";
                          }
                          const canClick = (status === 'active' || status === 'completed');
                          const alignRight = index % 2 === 1;
                          const railColor = lighten("#2C6DEF", 0.45);
                          return (
                            <div
                              key={index}
                              className="relative w-full flex items-center justify-center px-4 sm:px-6 md:px-8"
                              onMouseEnter={() => setHoveredIndex(index)}
                              onMouseLeave={() => setHoveredIndex(null)}
                            >
                              {/* Connector + Star Node (alternate left/right) */}
                              {alignRight ? (
                                <div className="absolute left-1/2 top-1/2 -translate-y-1/2 w-1/2">
                                  <div className="flex items-center">
                                    <div className="h-1.5 sm:h-2 md:h-3 w-24 sm:w-28 md:w-32 lg:w-36 xl:w-40 rounded-full" style={{ backgroundColor: railColor }}></div>
                                    <div className="relative">
                                      {status === "active" && <StartBadge color="#2C6DEF" />}
                                      <PathNode
                                        status={status}
                                        disabled={!canClick}
                                        color="#2C6DEF"
                                        lightenFn={lighten}
                                        darkenFn={darken}
                                        onClick={() => {
                                          if (!canClick) return;
                                          const moduleId = modulesList[index]?._id;
                                          if (moduleId) {
                                            // Save scroll position before navigating
                                            saveScrollPosition();
                                            // Preserve chapterId in URL for navigation back
                                            const params = new URLSearchParams();
                                            if (chapterId) params.set('chapterId', chapterId);
                                            const query = params.toString();
                                            navigate(`/learn/module/${moduleId}${query ? '?' + query : ''}`);
                                          }
                                          // Do NOT mark completed here; only count after module completion
                                        }}
                                      />
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className="absolute right-1/2 top-1/2 -translate-y-1/2 w-1/2">
                                  <div className="flex items-center justify-end">
                                    <div className="relative">
                                      {status === "active" && <StartBadge color="#2C6DEF" />}
                                      <PathNode
                                        status={status}
                                        disabled={!canClick}
                                        color="#2C6DEF"
                                        lightenFn={lighten}
                                        darkenFn={darken}
                                        onClick={() => {
                                          if (!canClick) return;
                                          const moduleId = modulesList[index]?._id;
                                          if (moduleId) {
                                            // Save scroll position before navigating
                                            saveScrollPosition();
                                            // Preserve chapterId in URL for navigation back
                                            const params = new URLSearchParams();
                                            if (chapterId) params.set('chapterId', chapterId);
                                            const query = params.toString();
                                            navigate(`/learn/module/${moduleId}${query ? '?' + query : ''}`);
                                          }
                                          // Do NOT mark completed here; only count after module completion
                                        }}
                                      />
                                    </div>
                                    <div className="h-1.5 sm:h-2 md:h-3 w-24 sm:w-28 md:w-32 lg:w-36 xl:w-40 rounded-full" style={{ backgroundColor: railColor }}></div>
                                  </div>
                                </div>
                              )}
                              {/* Tooltip */}
                              <div
                                className={`absolute ${alignRight ? "left-[62%]" : "right-[62%]"} top-full mt-4 bg-white border-2 border-blue-600 rounded-xl shadow-lg px-4 py-3 w-64 hidden md:block transition-all duration-500 ease-out ${
                                  hoveredIndex === index ? "opacity-100" : "opacity-0 pointer-events-none"
                                }`}
                                style={{ zIndex: 40 }}
                              >
                                <div className="text-lg font-extrabold mt-1 text-blue-700">
                                  {modulesList[index]?.title || "—"}
                                </div>
                                <div className="text-base font-semibold text-blue-700/80">
                                  {chapterTitle || "—"}
                                </div>
                                <div className="text-sm font-medium text-blue-700/60">
                                  {subjectName || "—"}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                      );
                    }
                    if (unitsList.length > 0) {
                      return (
                        <>
                        {unitsList.map((u, unitIdx) => {
                    const unitMods = unitModulesMap[u._id] || modulesList;
                    const localLevels = unitMods;
                    // Make the center line span from the first star to the revision star
                    // Start line a bit below the unit header and stop slightly above the next header
                    const localLineHeight = Math.max(
                      160,
                      (localLevels.length) * rowSpacing + 120
                    );
                    return (
                      <div
                        key={u._id || unitIdx}
                        className="relative pt-12 pb-28"
                        data-chapter-id={chapterId}
                        data-unit-id={String(u._id)}
                      >
                         {/* Unit header card - sticky until next unit */}
                         {(() => { const color = unitPalette[unitIdx % unitPalette.length]; const gradFrom = color; const gradTo = darken(color, 0.15); return (
                         <div className="sticky top-0 z-30 text-white px-6 py-5 rounded-3xl flex justify-between items-center mb-8 shadow-[0_10px_0_0_rgba(0,0,0,0.15)] max-w-3xl mx-auto border-4"
                              style={{ background: `linear-gradient(90deg, ${gradFrom}, ${gradTo})`, borderColor: withAlpha(color, 0.25) }}>
                           <div>
                             <p className="font-extrabold text-base md:text-lg">
                               {u.title || `Unit ${unitIdx + 1}`}
                             </p>
                             {chapterTitle && (
                               <p className="opacity-95 text-base md:text-lg">
                                 {chapterTitle}
                               </p>
                             )}
                             <div className="flex items-center gap-2 mt-1">
                               <p className="opacity-90 text-sm md:text-base">
                                 {subjectName}
                               </p>
                              <button
                                onClick={handleOpenSubjectModal}
                                disabled={isLoading || subjectChanging}
                                className={`flex items-center gap-2 py-2 px-3 rounded-2xl bg-white/15 hover:bg-white/25 transition-colors ring-2 ring-white/40 text-xs font-extrabold ${(isLoading || subjectChanging) ? 'opacity-50 cursor-not-allowed' : ''}`}
                                title={subjectChanging ? "Switching Subject..." : "Change Subject"}
                              >
                                {subjectChanging ? "Switching..." : "Change"}
                              </button>
                             </div>
                           </div>
                           <div className="flex items-center gap-2">
                             <button 
                               onClick={() => setShowChapters(true)} 
                               className="flex items-center gap-2.5 py-2 px-4 rounded-xl bg-white/15 hover:bg-white/25 transition-colors ring-2 ring-white/40 text-base"
                             >
                               <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-white/20 flex-shrink-0">
                                 <ChapterNavIcon />
                               </span>
                               <span className="font-bold hidden sm:inline leading-tight self-center">All Chapters</span>
                             </button>
                           </div>
                         </div>
                         ); })()}
                        {/* Center line for this unit */}
                        {(() => { const color = unitPalette[unitIdx % unitPalette.length]; return (
                        <div
                          className="absolute left-1/2 -translate-x-1/2 w-2 sm:w-2.5 md:w-3 rounded-full z-20 shadow-[0_0_0_4px_rgba(255,255,255,0.5)] sm:shadow-[0_0_0_5px_rgba(255,255,255,0.5)] md:shadow-[0_0_0_6px_rgba(255,255,255,0.5)]"
                          style={{ top: 200, height: localLineHeight + 40, backgroundColor: lighten(color, 0.5) }}
                        /> ); })()}
                        <div className="relative flex flex-col items-center gap-16 sm:gap-20 md:gap-24 pt-20 sm:pt-24 md:pt-28 pb-6 sm:pb-8 px-8 sm:px-12 md:px-16 lg:px-20 xl:px-24">
                          {localLevels.map((mod, index) => {
                            // --- CRITICAL FIX: Check completion using composite key (chapterId:unitId:lessonId) ---
                            const moduleIdHere = mod?._id;
                            const unitIdHere = u?._id;
                            const chapterIdHere = chapterId;
                            
                          // CRITICAL FIX: Check completion using composite key ONLY (prevents collisions)
                          // Don't use module ID alone as it can cause collisions across units
                          const compositeKey = progressKey(chapterIdHere, unitIdHere, moduleIdHere);
                          const isCompletedByCompositeKey = completedCompositeKeys.has(compositeKey);
                          
                          // Only use module ID check if composite key doesn't exist (for migration from old data)
                          // But prioritize composite key to prevent collisions
                          const isCompletedById = moduleIdHere && !isCompletedByCompositeKey 
                            ? completedIdSet.has(String(moduleIdHere)) 
                            : false;
                          
                          // Lesson is completed ONLY if composite key exists (primary check)
                          // Module ID check is only for backward compatibility during migration
                          const isCompleted = isCompletedByCompositeKey || isCompletedById;

                            // First incomplete within THIS unit by composite key or ID
                            const firstIncompleteForUnit = localLevels.findIndex((m) => {
                              const id = m?._id;
                              if (!id) return true;
                              const key = progressKey(chapterIdHere, unitIdHere, id);
                              return !completedCompositeKeys.has(key) && !completedIdSet.has(String(id));
                            });

                            let status = "locked";
                            if (isCompleted) {
                              status = "completed";
                            } else if (index === firstIncompleteForUnit) {
                              status = "active";
                            }
                            const canClick = (status === 'active' || status === 'completed');
                            const alignRight = index % 2 === 1;
                            const railColor = lighten(unitPalette[unitIdx % unitPalette.length], 0.45);
                            return (
                              <div
                                key={index}
                                id={`chapter-${mod._id}`}
                                className="relative w-full flex items-center justify-center px-4 sm:px-6 md:px-8"
                                onMouseEnter={() => setHoveredIndex(index)}
                                onMouseLeave={() => setHoveredIndex(null)}
                              >
                                {/* Connector + Star Node (alternate left/right) */}
                                {alignRight ? (
                                  <div className="absolute left-1/2 top-1/2 -translate-y-1/2 w-1/2">
                                    <div className="flex items-center">
                                      <div className="h-1.5 sm:h-2 md:h-3 w-24 sm:w-28 md:w-32 lg:w-36 xl:w-40 rounded-full" style={{ backgroundColor: railColor }}></div>
                                      <div className="relative">
                                        {status === "active" && <StartBadge color={unitPalette[unitIdx % unitPalette.length]} />}
                                        <PathNode
                                          status={status}
                                          disabled={!canClick}
                                          color={unitPalette[unitIdx % unitPalette.length]}
                                          lightenFn={lighten}
                                          darkenFn={darken}
                                        onClick={() => {
                                          if (!canClick) return;
                                          const moduleId = mod?._id;
                                          if (moduleId) {
                                            // Save scroll position before navigating
                                            saveScrollPosition();
                                            // Preserve chapterId and unitId in URL for navigation back
                                            const params = new URLSearchParams();
                                            if (chapterId) params.set('chapterId', chapterId);
                                            if (u?._id) params.set('unitId', u._id);
                                            const query = params.toString();
                                            navigate(`/learn/module/${moduleId}${query ? '?' + query : ''}`);
                                          }
                                          // Do NOT mark completed here; only count after module completion
                                        }}
                                        />
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="absolute right-1/2 top-1/2 -translate-y-1/2 w-1/2">
                                    <div className="flex items-center justify-end">
                                      <div className="relative">
                                        {status === "active" && <StartBadge color={unitPalette[unitIdx % unitPalette.length]} />}
                                        <PathNode
                                          status={status}
                                          disabled={!canClick}
                                          color={unitPalette[unitIdx % unitPalette.length]}
                                          lightenFn={lighten}
                                          darkenFn={darken}
                                        onClick={() => {
                                          if (!canClick) return;
                                          const moduleId = mod?._id;
                                          if (moduleId) {
                                            // Save scroll position before navigating
                                            saveScrollPosition();
                                            // Preserve chapterId and unitId in URL for navigation back
                                            const params = new URLSearchParams();
                                            if (chapterId) params.set('chapterId', chapterId);
                                            if (u?._id) params.set('unitId', u._id);
                                            const query = params.toString();
                                            navigate(`/learn/module/${moduleId}${query ? '?' + query : ''}`);
                                          }
                                          // Do NOT mark completed here; only count after module completion
                                        }}
                                        />
                                      </div>
                                      <div className="h-1.5 sm:h-2 md:h-3 w-24 sm:w-28 md:w-32 lg:w-36 xl:w-40 rounded-full" style={{ backgroundColor: railColor }}></div>
                                    </div>
                                  </div>
                                )}
                                {/* Tooltip (hover only with smooth transition) - placed below the star */}
                                <div
                                  className={`absolute ${alignRight ? "left-[62%]" : "right-[62%]"} top-full mt-4 rounded-xl shadow-lg px-4 py-3 w-64 hidden md:block transition-all duration-500 ease-out ${
                                    hoveredIndex === index ? "opacity-100" : "opacity-0 pointer-events-none"
                                  }`}
                                  style={{ zIndex: 40, background: `linear-gradient(135deg, ${withAlpha(unitPalette[unitIdx % unitPalette.length],0.08)}, #fff)`, borderWidth: 2, borderStyle: 'solid', borderColor: withAlpha(unitPalette[unitIdx % unitPalette.length], 0.6) }}
                                >
                                  <div className="text-lg font-extrabold mt-1"
                                       style={{ color: darken(unitPalette[unitIdx % unitPalette.length], 0.2) }}>
                                    {unitMods[index]?.title ||
                                      moduleTitle ||
                                      "—"}
                                  </div>
                                  <div className="text-base font-semibold"
                                       style={{ color: withAlpha(unitPalette[unitIdx % unitPalette.length], 0.85) }}>
                                    {u.title || unitTitle || "—"}
                                  </div>
                                  <div className="text-sm font-medium"
                                       style={{ color: withAlpha(unitPalette[unitIdx % unitPalette.length], 0.7) }}>
                                    {chapterTitle || "—"}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                          {/* Revision star below modules, connected to center line and on alternate side of last module */}
                          {(() => {
                            const lastIndex = Math.max(0, localLevels.length - 1);
                            const lastAlignRight = lastIndex % 2 === 1; // true if last node is on the right
                            const starAlignRight = !lastAlignRight; // place revision star opposite the last node
                            const railColor = lighten(unitPalette[unitIdx % unitPalette.length], 0.55);
                            return (
                              <div className="relative w-full h-24 sm:h-28 px-4 sm:px-6 md:px-8">
                                {starAlignRight ? (
                                  <div className="absolute left-1/2 top-1/2 -translate-y-1/2 w-1/2 flex items-center">
                                    <div
                                      className="h-1.5 sm:h-2 md:h-3 rounded-full w-[calc(50%-32px)] sm:w-[calc(50%-36px)] md:w-[calc(50%-40px)] lg:w-[calc(50%-44px)] xl:w-[calc(50%-48px)]"
                                      style={{ backgroundColor: railColor, opacity: 0.8 }}
                                    ></div>
                                    <RevisionStar
                                      align="right"
                                      chapterId={chapterId}
                                      unitId={u?._id}
                                    />
                                  </div>
                                ) : (
                                  <div className="absolute right-1/2 top-1/2 -translate-y-1/2 w-1/2 flex items-center justify-end">
                                    <RevisionStar
                                      align="left"
                                      chapterId={chapterId}
                                      unitId={u?._id}
                                    />
                                    <div
                                      className="h-1.5 sm:h-2 md:h-3 rounded-full w-[calc(50%-32px)] sm:w-[calc(50%-36px)] md:w-[calc(50%-40px)] lg:w-[calc(50%-44px)] xl:w-[calc(50%-48px)]"
                                      style={{ backgroundColor: railColor, opacity: 0.8 }}
                                    ></div>
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    );
                  })}
                        </>
                      );
                    }
                    // Skeleton unit tree while nothing has loaded
                    return (
                      <div className="relative pt-12 pb-28">
                        <div className="sticky top-0 z-30 text-white px-6 py-5 rounded-3xl flex justify-between items-center mb-8 shadow-[0_10px_0_0_rgba(0,0,0,0.15)] max-w-3xl mx-auto border-4 animate-pulse"
                             style={{ background: `linear-gradient(90deg, #93C5FD, #60A5FA)`, borderColor: 'rgba(147, 197, 253, 0.35)' }}>
                          <div>
                            <p className="font-extrabold text-xl md:text-2xl">Loading unit…</p>
                            <p className="opacity-90 text-sm md:text-base">Please wait</p>
                          </div>
                        </div>
                        <div className="relative flex flex-col items-center gap-20 pt-24 pb-6 px-12">
                          {[0,1,2,3,4].map((idx) => (
                            <div key={idx} className="relative w-full flex items-center justify-center px-8">
                              {idx % 2 === 1 ? (
                                <div className="absolute left-1/2 top-1/2 -translate-y-1/2 w-1/2">
                                  <div className="flex items-center">
                                    <div className="h-2 w-32 rounded-full bg-blue-100" />
                                    <div className="w-16 h-16 rounded-full bg-yellow-200 border-4 border-yellow-300 shadow ml-3" />
                                  </div>
                                </div>
                              ) : (
                                <div className="absolute right-1/2 top-1/2 -translate-y-1/2 w-1/2">
                                  <div className="flex items-center justify-end">
                                    <div className="w-16 h-16 rounded-full bg-yellow-200 border-4 border-yellow-300 shadow mr-3" />
                                    <div className="h-2 w-32 rounded-full bg-blue-100" />
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                </>
              )}
            </div>
          )}

          {/* No Data State removed per request */}
        </main>

        {/* Right Panel with Character */}
        <aside className="hidden lg:flex w-80 p-6 items-center justify-center shrink-0 bg-transparent h-full relative">
          {/* Confetti burst when streak increases */}
          {showConfetti && (
            <div className="pointer-events-none absolute top-0 right-0 w-36 h-36">
              <div
                className="absolute text-2xl animate-bounce"
                style={{ top: 8, right: 8 }}
              >
                🎉
              </div>
              <div
                className="absolute text-2xl animate-bounce"
                style={{ top: 30, right: 48, animationDelay: "0.15s" }}
              >
                ✨
              </div>
              <div
                className="absolute text-2xl animate-bounce"
                style={{ top: 12, right: 72, animationDelay: "0.3s" }}
              >
                🎊
              </div>
              <div
                className="absolute text-2xl animate-bounce"
                style={{ top: 52, right: 20, animationDelay: "0.45s" }}
              >
                ⭐
              </div>
            </div>
          )}
          <div className="w-full flex items-center justify-center">
            <img
              src={heroChar}
              alt="Hoshi"
              className="w-64 h-64 lg:w-72 lg:h-72 object-contain"
            />
          </div>
          {/* Stars counter card */}
          <div className="absolute top-6 right-4 w-[88%] bg-gradient-to-br from-yellow-50 to-orange-50 border-4 border-yellow-400 rounded-2xl px-4 py-3 shadow-[0_8px_0_0_rgba(0,0,0,0.10)] mb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl animate-pulse">⭐</span>
                <div>
                  <div className="text-xs font-extrabold text-yellow-700">
                    Total Stars
                  </div>
                  <div className="text-lg font-extrabold text-yellow-600">
                    {stars} stars
                  </div>
                </div>
              </div>
              <div className="flex items-center">
                <div className="flex items-center">
                  <span className="text-sm">✨</span>
                  <span className="text-xs font-bold text-yellow-600 ml-1">Earned!</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Streak + Continue card */}
          <div className="absolute top-32 right-4 w-[88%] bg-white border-4 border-blue-300 rounded-2xl px-4 py-3 shadow-[0_8px_0_0_rgba(0,0,0,0.10)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">🔥</span>
                <div>
                  <div className="text-xs font-extrabold text-blue-700">
                    Daily streak
                  </div>
                  <div className="text-lg font-extrabold text-blue-600">
                    {streak} days
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  const nextIndex = Math.max(0, firstIncompleteIndex);
                  const nextId =
                    modulesList?.[nextIndex]?._id || modulesList?.[0]?._id;
                  if (nextId) {
                    // Save scroll position before navigating
                    saveScrollPosition();
                    // Preserve chapterId in URL for navigation back
                    const params = new URLSearchParams();
                    if (chapterId) params.set('chapterId', chapterId);
                    const query = params.toString();
                    navigate(`/learn/module/${nextId}${query ? '?' + query : ''}`);
                  }
                }}
                className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold shadow-[0_6px_0_0_rgba(0,0,0,0.10)]"
              >
                Continue
              </button>
            </div>
          </div>
          {/* Tip card to reduce emptiness */}
          {!tipHidden && (
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-[88%] bg-gradient-to-br from-green-50 to-emerald-50 border-4 border-green-400 rounded-2xl px-4 py-3 shadow-[0_8px_0_0_rgba(0,0,0,0.10)]">
              <div className="flex items-center justify-between">
                <div className="text-sm font-bold text-green-700 flex items-center gap-2">
                  <span className="text-lg">💡</span>
                  <span className="uppercase tracking-wide">Tip of the day</span>
                </div>
                <button
                  onClick={() => setTipHidden(true)}
                  className="text-green-600 hover:text-green-800 text-sm font-bold bg-green-100 hover:bg-green-200 px-2 py-1 rounded-lg transition-all duration-200"
                >
                  ✕
                </button>
              </div>
              <div className="text-sm text-green-700/90 mt-2 transition-opacity duration-300 font-medium">
                {tips[tipIndex]}
              </div>
            </div>
          )}
        </aside>
        
        {/* Subject Change Modal */}
        {showSubjectModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-800">Change Subject</h3>
                <button
                  onClick={() => setShowSubjectModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ✕
                </button>
              </div>
              <div className="space-y-2">
                {subjectOptions.map((subject) => (
                  <button
                    key={subject}
                    onClick={() => handleSubjectChange(subject)}
                    className={`w-full p-3 text-left rounded-lg border-2 transition-colors ${
                      subject === subjectName
                        ? 'bg-blue-100 border-blue-500 text-blue-700'
                        : 'bg-white border-gray-300 hover:border-gray-400 text-gray-700'
                    }`}
                  >
                    <span className="font-medium">{subject}</span>
                    {subject === subjectName && (
                      <span className="ml-2 text-sm text-blue-600">(Current)</span>
                    )}
                  </button>
                ))}
              </div>
              {subjectOptions.length === 0 && (
                <p className="text-gray-500 text-center py-4">No subjects available</p>
              )}
            </div>
          </div>
        )}
      </div>
    </ReviewProvider>
  );
};

export default LearnDashboard;
