import { getApiBase } from '../utils/apiBase.js';

const API_BASE = getApiBase();

// Fetch items for a module by its ObjectId (from curriculum flow)
export async function fetchLessonItemsByModule(moduleId) {
  const url = ${API_BASE}/api/curriculum/items?moduleId=${encodeURIComponent(moduleId)};
  const response = await fetch(url);
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || Failed to load items for module ${moduleId});
  }
  return response.json();
}

export async function importLessons(moduleNumber, payload) {
  const response = await fetch(${API_BASE}/api/lessons/${moduleNumber}/import, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || 'Failed to import lessons');
  }
  return response.json();
}