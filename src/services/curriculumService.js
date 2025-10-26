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

// Centralized axios instance with sane defaults to avoid hanging requests
const http = axios.create({
  baseURL: API,
  timeout: 12000, // 12s timeout to fail fast and render fallbacks
  withCredentials: false,
});

const passOpts = (opts) => (opts && typeof opts === 'object' ? opts : {});

const curriculumService = {
  listBoards(opts) {
    return http.get(`/api/curriculum/boards`, passOpts(opts));
  },
  listSubjects(board = 'CBSE', opts) {
    return http.get(`/api/curriculum/subjects`, { params: { board }, ...passOpts(opts) });
  },
  listChapters(board = 'CBSE', subject = 'Science', extraParams = {}, opts) {
    // extraParams can include { userId, classTitle }
    return http.get(`/api/curriculum/chapters`, { params: { board, subject, ...(extraParams || {}) }, ...passOpts(opts) });
  },
  listUnits(chapterId, opts) {
    return http.get(`/api/curriculum/units`, { params: { chapterId }, ...passOpts(opts) });
  },
  listModules(chapterId, opts) {
    return http.get(`/api/curriculum/modules`, { params: { chapterId }, ...passOpts(opts) });
  },
  listModulesByUnit(unitId, opts) {
    return http.get(`/api/curriculum/modules`, { params: { unitId }, ...passOpts(opts) });
  },
  listItems(moduleId, opts) {
    return http.get(`/api/curriculum/items`, { params: { moduleId }, ...passOpts(opts) });
  },
};

export default curriculumService;


