import axios from 'axios';
import { getApiBase } from '../utils/apiBase.js';

const API = getApiBase();

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
  listClasses(board = 'CBSE', opts) {
    return http.get(`/api/curriculum/classes`, { params: { board }, ...passOpts(opts) });
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
  getModule(moduleId, opts) {
    // Fetch module details by ID - we'll search through chapters if no direct endpoint exists
    // For now, return a promise that can be resolved by the caller
    return http.get(`/api/curriculum/module`, { params: { moduleId }, ...passOpts(opts) }).catch(() => {
      // Fallback: return null if endpoint doesn't exist yet
      return { data: null };
    });
  },
};

export default curriculumService;