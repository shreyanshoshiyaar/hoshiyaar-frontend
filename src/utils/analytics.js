/**
 * Tracks the start of a level/module.
 * Uses sessionStorage to ensure it only fires once per session for the same module.
 * 
 * @param {string} moduleId - The ID of the module being started.
 * @param {string} levelName - The name of the level/module.
 */
export const trackLevelStart = (moduleId, levelName) => {
    if (typeof window.hyTrack !== 'function') return;
    
    if (!moduleId) return;

    const key = `level_start_${moduleId}`;
    if (!sessionStorage.getItem(key)) {
        sessionStorage.setItem(key, Date.now().toString());
        sessionStorage.setItem(`level_name_${moduleId}`, levelName || `Module ${moduleId}`);
        window.hyTrack("level_start", { level_name: levelName || `Module ${moduleId}` });
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
        score: score || 0,
        time_spent_seconds: timeSpentSeconds
    });

    sessionStorage.setItem(endKey, "true");
};
