// The app's two worlds: Science (class-wise chapters) and Gita (one for every class).
// The world a learner opened last is shown first on Home. Kept on the phone for an instant answer and saved
// to the account, so a new phone starts from it too. Keys are per account (siblings can share a phone).
import authService from '../services/authService.js';

export const WORLDS = ['science', 'gita'];
const keyOf = (name, user) => `${name}_${user?._id || 'anon'}`;

const read = (k) => { try { return localStorage.getItem(k); } catch (_) { return null; } };
const write = (k, v) => { try { localStorage.setItem(k, v); } catch (_) { /* storage blocked */ } };

export const getLastWorld = (user) => {
  const local = read(keyOf('hy_last_world', user));
  if (WORLDS.includes(local)) return local;
  return WORLDS.includes(user?.lastWorld) ? user.lastWorld : 'science';
};

export const setLastWorld = (world, user) => {
  if (!WORLDS.includes(world)) return;
  const prev = getLastWorld(user);
  write(keyOf('hy_last_world', user), world);
  // Save to the account only when it changes (and never for a visitor without a login)
  if (prev !== world && user?._id && authService.setLastWorld) authService.setLastWorld(world).catch(() => {});
};

// The Gita chapter last opened: lessons exit to a bare /learn, which reopens it while Gita is the last world
export const getLastGitaChapter = (user) => read(keyOf('hy_last_gita_chapter', user)) || '';
export const setLastGitaChapter = (chapterId, user) => { if (chapterId) write(keyOf('hy_last_gita_chapter', user), String(chapterId)); };

// The lesson a learner opened last (either world), for Home's "Continue" strip
export const getLastLesson = (user) => {
  try { const v = JSON.parse(read(keyOf('hy_last_lesson', user)) || 'null'); return v?.id && v?.url ? v : null; } catch (_) { return null; }
};
export const setLastLesson = (user, lesson) => {
  if (!lesson?.id || !lesson?.url) return;
  write(keyOf('hy_last_lesson', user), JSON.stringify({ ...lesson, at: Date.now() }));
};
