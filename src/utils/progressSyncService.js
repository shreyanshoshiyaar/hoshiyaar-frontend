/**
 * Centralized Progress Synchronization Service
 * Ensures module completions are immediately persisted locally across composite keys,
 * saved to the database, and broadcasted to all active views (Dashboard, Duolingo Map, Home).
 */
import { progressKey } from './progressKey.js';
import authService from '../services/authService.js';

export const markModuleAsCompleted = ({ userId, subject = 'Science', chapterId, unitId, moduleId }) => {
  if (!moduleId) return;

  const mId = String(moduleId);
  const chId = chapterId ? String(chapterId) : '';
  const uId = unitId ? String(unitId) : '';
  const sub = subject || 'Science';
  const uIdKey = userId ? String(userId) : 'anon';

  // 1. Target localStorage keys
  const LS_KEY_V2 = `lesson_progress_v2__${uIdKey}__${sub}`;
  const LS_IDS_KEY = `lesson_completed_ids_v1__${uIdKey}__${sub}`;
  const LS_IDS_NON_SCOPED = 'lesson_completed_ids_v1';
  const LS_V2_NON_SCOPED = 'lesson_progress_v2';

  // 2. Generate composite keys
  const keysToAdd = [];
  if (chId && uId) keysToAdd.push(progressKey(chId, uId, mId));
  if (chId) keysToAdd.push(progressKey(chId, null, mId));
  keysToAdd.push(progressKey(null, null, mId));

  try {
    // A. Update composite keys in v2 stores
    [LS_KEY_V2, LS_V2_NON_SCOPED].forEach((storageKey) => {
      try {
        const raw = localStorage.getItem(storageKey);
        const store = raw ? JSON.parse(raw) : {};
        const set = new Set(store.completedKeys || []);
        keysToAdd.forEach(k => set.add(k));
        store.completedKeys = Array.from(set);
        localStorage.setItem(storageKey, JSON.stringify(store));
      } catch (_) {}
    });

    // B. Update module IDs in completed ID stores
    [LS_IDS_KEY, LS_IDS_NON_SCOPED].forEach((storageKey) => {
      try {
        const raw = localStorage.getItem(storageKey);
        const arr = raw ? JSON.parse(raw) : [];
        const set = new Set(Array.isArray(arr) ? arr.map(String) : []);
        set.add(mId);
        localStorage.setItem(storageKey, JSON.stringify(Array.from(set)));
      } catch (_) {}
    });

    // C. Save latest completed module markers
    localStorage.setItem('hoshiyaar_latest_completed_module', mId);
    if (chId) localStorage.setItem(`hoshiyaar_chapter_last_completed_${chId}`, mId);
    console.log('[progressSyncService] Module marked complete locally:', { moduleId: mId, chapterId: chId, keys: keysToAdd });
  } catch (err) {
    console.warn('[progressSyncService] Error saving local completion:', err);
  }

  // 3. Persist to MongoDB backend
  if (userId) {
    try {
      authService.updateProgress({
        userId,
        moduleId: mId,
        subject: sub,
        conceptCompleted: true
      }).catch(err => {
        console.warn('[progressSyncService] Backend updateProgress error:', err?.message);
      });
    } catch (_) {}
  }

  // 4. Dispatch events so LearnDashboard & Home re-render immediately
  try {
    window.dispatchEvent(new CustomEvent('progressUpdated', {
      detail: { key: LS_KEY_V2, moduleId: mId, chapterId: chId }
    }));
    window.dispatchEvent(new CustomEvent('moduleCompleted', {
      detail: { moduleId: mId, chapterId: chId, unitId: uId }
    }));
  } catch (_) {}
};

export default {
  markModuleAsCompleted
};
