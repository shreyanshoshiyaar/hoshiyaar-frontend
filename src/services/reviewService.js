import axios from 'axios';

// Prefer Vite proxy on localhost; use VITE_API_BASE or current origin in non-local envs
// For mobile access on local network, use the local IP
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
  
  return import.meta.env.VITE_API_BASE || '';
};

const API = getAPIBase();

const reviewService = {
  async listIncorrect(userId, moduleId, chapterId) {
    const res = await axios.get(`${API}/api/review/incorrect`, { params: { userId, moduleId, chapterId } });
    return res.data || [];
  },
  async listDefaults({ moduleId, unitId, chapterId, subjectId } = {}) {
    const params = {};
    if (moduleId) params.moduleId = moduleId;
    else if (unitId) params.unitId = unitId;
    else if (chapterId) params.chapterId = chapterId;
    else if (subjectId) params.subjectId = subjectId;
    const res = await axios.get(`${API}/api/review/defaults`, { params });
    return res.data || [];
  },
  async saveIncorrect({ userId, questionId, moduleId, chapterId }) {
    const payload = { userId, questionId };
    if (moduleId) payload.moduleId = String(moduleId);
    if (chapterId) payload.chapterId = String(chapterId);
    const res = await axios.post(`${API}/api/review/incorrect`, payload);
    return res.data;
  }
};

export default reviewService;
