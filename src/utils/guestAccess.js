// Guests (Get Started without verifying their number) may play GUEST_LESSON_LIMIT different
// lessons in total, across all chapters; after that they must verify to continue.

export const GUEST_LESSON_LIMIT = 5;

export const isGuestUser = (user) => !!user?.isGuest;

const storageKey = (userId) => `guest_lessons_v1__${userId}`;

export function getGuestLessons(userId) {
  try {
    const list = JSON.parse(localStorage.getItem(storageKey(userId)) || '[]');
    return Array.isArray(list) ? list.map(String) : [];
  } catch (_) {
    return [];
  }
}

// Lessons already started stay open (so a guest can finish or replay them)
export function canGuestOpenLesson(userId, lessonId) {
  const played = getGuestLessons(userId);
  return played.includes(String(lessonId)) || played.length < GUEST_LESSON_LIMIT;
}

export function recordGuestLesson(userId, lessonId) {
  const played = getGuestLessons(userId);
  if (played.includes(String(lessonId))) return;
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify([...played, String(lessonId)]));
  } catch (_) {}
}
