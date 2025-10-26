// Get API base URL with mobile support
const getAPIBase = () => {
  if (typeof window === 'undefined') return '';
  
  const hostname = window.location.hostname;
  const isLocalhost = /^(localhost|127\.0\.0\.1)/.test(hostname);
  
  if (isLocalhost) {
    return ''; // Use Vite proxy in development
  }
  
  // Check if we're accessing from mobile on local network
  if (hostname === '192.168.1.11') {
    return 'http://192.168.1.11:5000'; // Local network backend
  }
  
  return import.meta?.env?.VITE_API_BASE || '';
};

const API_BASE = getAPIBase();

// Fetch items for a module by its ObjectId (from curriculum flow)
export async function fetchLessonItemsByModule(moduleId) {
  const url = `${API_BASE}/api/curriculum/items?moduleId=${encodeURIComponent(moduleId)}`;
  const response = await fetch(url);
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Failed to load items for module ${moduleId}`);
  }
  return response.json();
}

export async function importLessons(moduleNumber, payload) {
  const response = await fetch(`${API_BASE}/api/lessons/${moduleNumber}/import`, {
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


