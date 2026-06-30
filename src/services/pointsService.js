import api from './apiClient';

const award = (data, opts) => api.put('/api/points/award', data, opts);
const revert = (data, opts) => api.post('/api/points/revert', data, opts);

const summaryCache = new Map();
const summary = (params, opts) => {
  // Normalize params so { userId } and { userId, days: 30 } share the same cache key
  const normParams = { days: 30, ...params };
  const key = JSON.stringify(normParams);
  
  if (summaryCache.has(key)) {
    return summaryCache.get(key);
  }
  
  const promise = api.get('/api/points/summary', { params: normParams, ...(opts || {}) });
  summaryCache.set(key, promise);
  
  // Clear the cache after a short delay (1 second) so subsequent page loads get fresh data
  setTimeout(() => summaryCache.delete(key), 1000);
  
  return promise;
};

export default { award, revert, summary };