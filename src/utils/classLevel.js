// Students in Classes 1-5 pick "Class 1-5" (stored as '1-5'). There is no content for those classes yet, so
// their lessons come from Class 6 and the All Chapters panel opens on Level Up with Classes 6, 7 and 8.
// Mirrors utils/classLevel.js on the server.
export const JUNIOR_CLASS = '1-5';
export const CLASS_CHOICES = [JUNIOR_CLASS, '6', '7', '8', '9'];
export const isJuniorClass = (value) => /^(class|grade)?\s*1\s*[-–to ]+\s*5$/i.test(String(value ?? '').trim());
/** The class whose chapters a learner of `value` studies: '6' for Class 1-5, otherwise unchanged */
export const contentClass = (value) => (isJuniorClass(value) ? '6' : value);
/** "Class 1–5", "Class 6" ... */
export const classLabel = (value) => (isJuniorClass(value) ? 'Class 1–5' : `Class ${String(value ?? '').replace(/^class\s*/i, '')}`);
