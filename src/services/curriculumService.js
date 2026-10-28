import api from './apiClient';

const passOpts = (opts) => (opts && typeof opts === 'object' ? opts : {});

// Simple in-memory cache for curriculum data to avoid redundant network calls
const cache = new Map();
const CACHE_TTL = 300000; // 5 minutes for curriculum data

const cachedGet = async (url, config = {}) => {
  const { bypassCache, ...axiosConfig } = config;
  
  if (bypassCache) {
    // Append timestamp to bypass HTTP/CDN cache
    const finalParams = { ...(axiosConfig.params || {}), _t: Date.now() };
    return api.get(url, { ...axiosConfig, params: finalParams });
  }

  const cacheKey = JSON.stringify({ url, params: axiosConfig.params });
  const now = Date.now();
  
  if (cache.has(cacheKey)) {
    const entry = cache.get(cacheKey);
    if (now - entry.timestamp < CACHE_TTL) {
      return entry.data;
    }
  }
  
  const response = await api.get(url, axiosConfig);
  cache.set(cacheKey, { data: response, timestamp: now });
  return response;
};

const curriculumService = {
  listBoards(opts) {
    const passedOpts = passOpts(opts);
    return cachedGet(`/api/curriculum/boards`, passedOpts);
  },
  listClasses(board = 'CBSE', opts) {
    return cachedGet(`/api/curriculum/classes`, { params: { board }, ...passOpts(opts) });
  },
  listSubjects(board = 'CBSE', opts) {
    const passedOpts = passOpts(opts);
    const params = { board, ...(passedOpts.params || {}) };
    return cachedGet(`/api/curriculum/subjects`, { ...passedOpts, params });
  },
  listChapters(board = 'CBSE', subject = 'Science', extraParams = {}, opts) {
    const passedOpts = passOpts(opts);
    return cachedGet(`/api/curriculum/chapters`, {
      ...passedOpts,
      params: { board, subject, ...extraParams, ...(passedOpts.params || {}) }
    });
  },
  getExamAvailableChapters(opts) {
    const passedOpts = passOpts(opts);
    return cachedGet(`/api/curriculum/exam-chapters`, { bypassCache: true, ...passedOpts });
  },
  toggleChapterPublishStatus(id, isPublished) {
    // This mutates data on the server, no cache
    return api.patch(`/api/curriculum/chapters/${id}/publish`, { isPublished });
  },
  listUnits(chapterId, opts) {
    const passedOpts = passOpts(opts);
    return cachedGet(`/api/curriculum/units`, { 
      ...passedOpts, 
      params: { chapterId, ...(passedOpts.params || {}) } 
    });
  },
  listModules(chapterId, opts) {
    const passedOpts = passOpts(opts);
    return cachedGet(`/api/curriculum/modules`, { 
      ...passedOpts, 
      params: { chapterId, ...(passedOpts.params || {}) } 
    });
  },
  listModulesByUnit(unitId, opts) {
    return cachedGet(`/api/curriculum/modules`, { params: { unitId }, ...passOpts(opts) });
  },
  async listItems(moduleId, opts) {
    const res = await cachedGet(`/api/curriculum/items`, { params: { moduleId }, ...passOpts(opts) });
    if (res?.data && Array.isArray(res.data)) {
      return {
        ...res,
        data: res.data.filter(it => {
          const id = String(it.itemId || '');
          const txt = String(it.text || it.question || '');
          if (id.includes('.JM') || id.endsWith('.JM1') || txt.startsWith('You are here:')) return false;
          return true;
        })
      };
    }
    return res;
  },
  listCurriculumItems(moduleId, opts) {
    return this.listItems(moduleId, opts);
  },
  getModule(moduleId, opts) {
    return cachedGet(`/api/curriculum/module`, { params: { moduleId }, ...passOpts(opts) }).catch(() => {
      return { data: null };
    });
  },
  getRevisionCounts(chapterId, opts) {
    return cachedGet(`/api/curriculum/revision-counts`, { params: { chapterId }, ...passOpts(opts) });
  },
  updateUnit(unitId, data, opts) {
    // Clear cache when updating
    cache.clear();
    return api.put(`/api/curriculum/units/${unitId}`, data, passOpts(opts));
  },
  
  clearCache() {
    cache.clear();
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