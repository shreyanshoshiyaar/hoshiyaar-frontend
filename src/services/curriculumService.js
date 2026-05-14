import api from './apiClient';

const passOpts = (opts) => (opts && typeof opts === 'object' ? opts : {});

// Simple in-memory cache for curriculum data to avoid redundant network calls
const cache = new Map();
const CACHE_TTL = 300000; // 5 minutes for curriculum data

const cachedGet = async (url, config = {}) => {
  const cacheKey = JSON.stringify({ url, params: config.params });
  const now = Date.now();
  
  if (cache.has(cacheKey)) {
    const entry = cache.get(cacheKey);
    if (now - entry.timestamp < CACHE_TTL) {
      return entry.data;
    }
  }
  
  const response = await api.get(url, config);
  cache.set(cacheKey, { data: response, timestamp: now });
  return response;
};

const curriculumService = {
  listBoards(opts) {
    return cachedGet(`/api/curriculum/boards`, passOpts(opts));
  },
  listClasses(board = 'CBSE', opts) {
    return cachedGet(`/api/curriculum/classes`, { params: { board }, ...passOpts(opts) });
  },
  listSubjects(board = 'CBSE', opts) {
    return cachedGet(`/api/curriculum/subjects`, { params: { board }, ...passOpts(opts) });
  },
  listChapters(board = 'CBSE', subject = 'Science', extraParams = {}, opts) {
    return cachedGet(`/api/curriculum/chapters`, { params: { board, subject, ...(extraParams || {}) }, ...passOpts(opts) });
  },
  listUnits(chapterId, opts) {
    return cachedGet(`/api/curriculum/units`, { params: { chapterId }, ...passOpts(opts) });
  },
  listModules(chapterId, opts) {
    return cachedGet(`/api/curriculum/modules`, { params: { chapterId }, ...passOpts(opts) });
  },
  listModulesByUnit(unitId, opts) {
    return cachedGet(`/api/curriculum/modules`, { params: { unitId }, ...passOpts(opts) });
  },
  listItems(moduleId, opts) {
    return cachedGet(`/api/curriculum/items`, { params: { moduleId }, ...passOpts(opts) });
  },
  getModule(moduleId, opts) {
    return cachedGet(`/api/curriculum/module`, { params: { moduleId }, ...passOpts(opts) }).catch(() => {
      return { data: null };
    });
  },
  updateUnit(unitId, data, opts) {
    // Clear cache when updating
    cache.clear();
    return api.put(`/api/curriculum/units/${unitId}`, data, passOpts(opts));
  },
  
  // Settings API
  getSetting(key, opts) {
    return api.get(`/api/settings/${key}`, passOpts(opts));
  },
  updateSetting(data, opts) {
    return api.post(`/api/settings`, data, passOpts(opts));
  }
};

export default curriculumService;