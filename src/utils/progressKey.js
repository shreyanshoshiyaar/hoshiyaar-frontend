/**
 * Generate a composite progress key for uniquely identifying lesson progress
 * Format: chapterId:unitId:lessonId
 * 
 * @param {string} chapterId - Chapter ID
 * @param {string} unitId - Unit ID (can be null/undefined for lessons without units)
 * @param {string} lessonId - Lesson/Module ID
 * @returns {string} Composite key in format "chapterId:unitId:lessonId"
 */
export const progressKey = (chapterId, unitId, lessonId) => {
  // Ensure all parts are strings and handle null/undefined
  const ch = String(chapterId || '');
  const u = String(unitId || '');
  const l = String(lessonId || '');
  
  // If unitId is missing, use empty string (lessons can exist without units)
  return `${ch}:${u}:${l}`;
};

/**
 * Parse a composite progress key back into its components
 * @param {string} key - Composite key in format "chapterId:unitId:lessonId"
 * @returns {{chapterId: string, unitId: string, lessonId: string}}
 */
export const parseProgressKey = (key) => {
  const parts = String(key || '').split(':');
  return {
    chapterId: parts[0] || '',
    unitId: parts[1] || '',
    lessonId: parts[2] || ''
  };
};

