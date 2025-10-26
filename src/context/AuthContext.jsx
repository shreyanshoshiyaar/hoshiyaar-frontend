import React, { createContext, useState, useEffect, useContext } from 'react';
import authService from '../services/authService.js';
import { useStars } from './StarsContext.jsx';

const AuthContext = createContext(null);

export const useAuth = () => {
    return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true); // Add loading state
    const { syncFromServer } = useStars();

    useEffect(() => {
        // This effect runs once when the app loads
        const checkAuth = async () => {
            try {
                const storedUser = localStorage.getItem('user');
                if (storedUser) {
                    const parsed = JSON.parse(storedUser);
                    setUser(parsed);
                    // Always hydrate stars from server to ensure cross-device sync
                    try {
                        await hydrateStarsFromServer(parsed?._id);
                    } catch (error) {
                        console.warn('[AuthContext] Failed to sync stars on app load:', error);
                    }
                }
            } catch (error) {
                console.error("Failed to parse user from localStorage", error);
            }
            
            // Add a minimum loading time to show the loading screen
            await new Promise(resolve => setTimeout(resolve, 1500));
            setLoading(false);
        };
        
        checkAuth();
        
        // Set up periodic sync every 5 minutes to ensure cross-device sync
        const syncInterval = setInterval(async () => {
            if (user?._id) {
                try {
                    await hydrateStarsFromServer(user._id);
                } catch (error) {
                    console.warn('[AuthContext] Periodic sync failed:', error);
                }
            }
        }, 5 * 60 * 1000); // 5 minutes
        
        return () => clearInterval(syncInterval);
    }, [user?._id]);

    const hydrateStarsFromServer = async (uid) => {
        try {
            if (!uid) return;
            const { data } = await authService.getProgress(uid);
            const arr = Array.isArray(data) ? data : [];
            let total = 0;
            let moduleStars = {};
            
            for (const entry of arr) {
                const stats = entry?.stats || {};
                // stats may be a plain object or Map serialized by server; iterate keys
                const values = typeof stats.entries === 'function' ? Array.from(stats.entries()) : Object.entries(stats);
                let chapterTotal = 0;
                for (const [, val] of values) {
                    const best = Number(val?.bestScore || 0);
                    if (Number.isFinite(best)) {
                        total += best;
                        chapterTotal += best;
                    }
                }
                if (entry?.chapter) {
                    moduleStars[entry.chapter] = chapterTotal;
                }
            }
            
            // Update localStorage and StarsContext with server data
            try { 
                localStorage.setItem('hs_stars_total_v1', String(Math.max(0, total))); 
                localStorage.setItem('hs_stars_per_module_v1', JSON.stringify(moduleStars));
                // Also update the StarsContext state
                syncFromServer(total, moduleStars);
                console.log('[AuthContext] Synced stars from server:', { total, moduleStars });
            } catch (_) {}
        } catch (error) {
            console.warn('[AuthContext] Failed to sync stars from server:', error);
        }
    };

    const login = (userData) => {
        try {
            // If switching accounts, reset ALL progress data stored locally
            const prev = localStorage.getItem('user');
            const prevId = prev ? (JSON.parse(prev)?._id || null) : null;
            const nextId = userData?._id || null;
            if (!prevId || (prevId && nextId && String(prevId) !== String(nextId))) {
                // Clear all progress-related localStorage when switching accounts
                try { localStorage.removeItem('hs_stars_total_v1'); } catch (_) {}
                try { localStorage.removeItem('hs_stars_per_module_v1'); } catch (_) {}
                try { localStorage.removeItem('hs_stars_per_question_v1'); } catch (_) {}
                
                // Clear lesson progress localStorage
                try { localStorage.removeItem('lesson_progress_v1'); } catch (_) {}
                try { localStorage.removeItem('lesson_completed_ids_v1'); } catch (_) {}
                
                // Clear any user-scoped progress keys from previous account
                try {
                    const keysToRemove = [];
                    for (let i = 0; i < localStorage.length; i++) {
                        const key = localStorage.key(i);
                        if (key && (key.includes('lesson_progress_v1__') || key.includes('lesson_completed_ids_v1__'))) {
                            keysToRemove.push(key);
                        }
                    }
                    keysToRemove.forEach(key => localStorage.removeItem(key));
                } catch (_) {}
                
                console.log('[AuthContext] Cleared previous account localStorage on account switch');
            }
        } catch (_) {}
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        // Hydrate stars for this user from server best scores
        try { hydrateStarsFromServer(userData?._id); } catch (_) {}
    };

    const logout = () => {
        localStorage.removeItem('user');
        // Clear ALL progress-related localStorage on logout
        try { localStorage.removeItem('hs_stars_total_v1'); } catch (_) {}
        try { localStorage.removeItem('hs_stars_per_module_v1'); } catch (_) {}
        try { localStorage.removeItem('hs_stars_per_question_v1'); } catch (_) {}
        
        // Clear lesson progress localStorage
        try { localStorage.removeItem('lesson_progress_v1'); } catch (_) {}
        try { localStorage.removeItem('lesson_completed_ids_v1'); } catch (_) {}
        
        // Clear onboarding and streak data
        try { localStorage.removeItem('learnOnboarded'); } catch (_) {}
        try { localStorage.removeItem('daily_streak_day'); } catch (_) {}
        try { localStorage.removeItem('daily_streak_count'); } catch (_) {}
        
        // Clear any user-scoped progress keys (pattern: key__userId)
        try {
            const keysToRemove = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && (key.includes('lesson_progress_v1__') || key.includes('lesson_completed_ids_v1__'))) {
                    keysToRemove.push(key);
                }
            }
            keysToRemove.forEach(key => localStorage.removeItem(key));
        } catch (_) {}
        
        console.log('[AuthContext] Cleared all localStorage on logout');
        setUser(null);
    };

    const value = {
        user,
        loading, // Provide loading state to other components
        login,
        logout,
    };

    // Always render children, let ProtectedRoute handle the loading state
    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

