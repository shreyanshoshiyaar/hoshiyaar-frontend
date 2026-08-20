/**
 * Sets persistent user properties across GA4 and Microsoft Clarity.
 * @param {Object} properties - Key-value pairs of user traits.
 */
export const setUserProperties = (properties) => {
    if (typeof window.gtag === 'function') {
        window.gtag("set", "user_properties", properties);
    }
    if (typeof window.clarity === 'function') {
        Object.entries(properties).forEach(([key, value]) => {
            window.clarity("set", key, value?.toString() || "");
        });
    }
};

/**
 * Updates the user's lifecycle type and tracks the property.
 */
export const trackUserType = (type) => {
    setUserProperties({ user_type: type });
};

/**
 * Tracks the status of the user's first module ('started' or 'completed').
 * Fires only once per status.
 */
export const trackFirstModuleStatus = (status) => {
    const key = `first_module_status_set_${status}`;
    if (!localStorage.getItem(key)) {
        localStorage.setItem(key, 'true');
        setUserProperties({ first_module_status: status });
    }
};

/**
 * Tracks actionable app errors without exposing raw PII.
 */
export const trackAppError = (errorCode, context = {}) => {
    if (typeof window.hyTrack !== 'function') return;
    window.hyTrack('app_error_shown', {
        error_code: errorCode,
        ...context
    });
};

/**
 * Captures UTM parameters from URL and saves them for signup.
 */
export const captureSignupSource = () => {
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const source = urlParams.get('utm_source') || urlParams.get('ref') || 'direct';
        // Only set if not already set, to preserve the original source of acquisition
        if (!localStorage.getItem('signup_source')) {
            localStorage.setItem('signup_source', source);
        }
    } catch(e) {}
};

/**
 * Gets the stored signup source.
 */
export const getSignupSource = () => {
    return localStorage.getItem('signup_source') || 'organic';
};

/**
 * Tracks the start of a level/module.
export const trackLevelStart = (moduleId, levelName, classLevel, chapterId) => {
    if (typeof window.hyTrack !== 'function') return;
    
    if (!moduleId) return;

    const key = `level_start_${moduleId}`;
    if (!sessionStorage.getItem(key)) {
        sessionStorage.setItem(key, Date.now().toString());
        sessionStorage.setItem(`level_name_${moduleId}`, levelName || `Module ${moduleId}`);
        window.hyTrack("level_start", { 
            level_name: levelName || `Module ${moduleId}`,
            module_id: moduleId,
            module_status: 'started',
            class: classLevel,
            chapter_id: chapterId
        });
        trackFirstModuleStatus('started');
    }
};

/**
 * Tracks the end of a level/module.
 * Computes time spent since level_start.
 * Uses sessionStorage to ensure it only fires once per session.
 * 
 * @param {string} moduleId - The ID of the module.
 * @param {number} score - The score achieved by the user.
 */
export const trackLevelEnd = (moduleId, score) => {
    if (typeof window.hyTrack !== 'function') return;
    
    if (!moduleId) return;

    const endKey = `level_end_${moduleId}`;
    if (sessionStorage.getItem(endKey)) return; // Already fired

    const startKey = `level_start_${moduleId}`;
    const startTime = sessionStorage.getItem(startKey);
    const levelName = sessionStorage.getItem(`level_name_${moduleId}`) || `Module ${moduleId}`;
    
    let timeSpentSeconds = 0;
    if (startTime) {
        timeSpentSeconds = Math.round((Date.now() - parseInt(startTime, 10)) / 1000);
    }

    window.hyTrack("level_end", { 
        level_name: levelName,
        module_id: moduleId,
        module_status: 'completed',
        score: score || 0,
        time_spent_seconds: timeSpentSeconds
    });

    sessionStorage.setItem(endKey, "true");
};

const getTrackingUserId = () => {
    try {
        const user = JSON.parse(localStorage.getItem('user'));
        return user?._id || 'guest';
    } catch(e) {
        return 'guest';
    }
};

/**
 * Tracks when a user answers their first question.
 * Fires only once per user.
 */
export const trackFirstQuestionAnswered = (classLevel, moduleId, chapterId, extraParams = {}) => {
    if (typeof window.hyTrack !== 'function') return;
    const userId = getTrackingUserId();
    const key = `has_answered_first_question_${userId}`;
    
    if (!localStorage.getItem(key)) {
        localStorage.setItem(key, "true");
        window.hyTrack("first_question_answered", {
            class: classLevel,
            module_id: moduleId,
            chapter_id: chapterId,
            ...extraParams
        });
    }
};

/**
 * Tracks when a user completes their first module.
 * Fires only once per user.
 */
export const trackFirstModuleCompleted = (classLevel, moduleId, chapterId, extraParams = {}) => {
    if (typeof window.hyTrack !== 'function') return;
    const userId = getTrackingUserId();
    const key = `has_completed_first_module_${userId}`;
    
    if (!localStorage.getItem(key)) {
        localStorage.setItem(key, "true");
        window.hyTrack("first_module_completed", {
            class: classLevel,
            module_id: moduleId,
            chapter_id: chapterId,
            ...extraParams
        });
        trackFirstModuleStatus('completed');
        trackUserType('activated'); // Complete first module means they are fully activated
    }
};

import authService from '../services/authService';

/**
 * Fetches user region via IP and stores it in sessionStorage.
 * Updates Microsoft Clarity tags if available.
 * If userId is provided, syncs location to the backend.
 */
export const fetchAndStoreRegion = async (userId = null) => {
    if (sessionStorage.getItem('user_region')) {
        if (userId && !sessionStorage.getItem('location_synced')) {
           try {
               await authService.updateLocation(userId, {
                  region: sessionStorage.getItem('user_region'),
                  city: sessionStorage.getItem('user_city'),
                  country: sessionStorage.getItem('user_country'),
               });
               sessionStorage.setItem('location_synced', 'true');
           } catch(e) {}
        }
        return;
    }
    
    try {
        const res = await fetch('https://get.geojs.io/v1/ip/geo.json');
        if (!res.ok) return;
        const data = await res.json();
        
        if (data.region) {
            sessionStorage.setItem('user_region', data.region);
            sessionStorage.setItem('user_city', data.city);
            sessionStorage.setItem('user_country', data.country);
            
            // Set Clarity tags
            if (window.clarity) {
                window.clarity("set", "region", data.region);
                window.clarity("set", "city", data.city);
            }

            if (userId) {
                try {
                   await authService.updateLocation(userId, {
                      region: data.region,
                      city: data.city,
                      country: data.country,
                   });
                   sessionStorage.setItem('location_synced', 'true');
                } catch(e) {}
            }
        }
    } catch (e) {
        console.warn("Could not fetch region data via IP", e);
    }
};
