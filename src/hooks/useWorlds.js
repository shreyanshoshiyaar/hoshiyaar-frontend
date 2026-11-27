import { useEffect, useState } from 'react';
import curriculumService from '../services/curriculumService.js';
import { useAuth } from '../context/AuthContext.jsx';

// Whether the Gita world is live for this learner, and its chapters. It is live once at least one Gita chapter is
// published (admins also see draft chapters, so they can preview it before launch). Until then the app looks
// exactly as before: no world doors, the usual tabs.
const cache = new Map(); // account -> { at, chapters }
const TTL = 5 * 60 * 1000;
const listeners = new Set();

const load = async (who) => {
  const hit = cache.get(who);
  if (hit && Date.now() - hit.at < TTL) return hit.chapters;
  try {
    const res = await curriculumService.listWorldChapters('gita');
    const chapters = Array.isArray(res?.data) ? res.data : [];
    cache.set(who, { at: Date.now(), chapters });
    listeners.forEach((fn) => fn());
    return chapters;
  } catch (_) {
    return hit?.chapters || [];
  }
};

export function useWorlds() {
  const { user } = useAuth();
  const who = user?._id ? `${user._id}:${user.role || ''}` : 'visitor';
  const [chapters, setChapters] = useState(() => cache.get(who)?.chapters || null);

  useEffect(() => {
    let alive = true;
    const sync = () => { if (alive) setChapters(cache.get(who)?.chapters || []); };
    listeners.add(sync);
    load(who).then((c) => { if (alive) setChapters(c); });
    return () => { alive = false; listeners.delete(sync); };
  }, [who]);

  return {
    gitaChapters: chapters || [],
    gitaLive: Boolean(user?._id) && (chapters || []).length > 0,
    loading: chapters === null,
  };
}
