import api from './apiClient';

const award = (data, opts) => api.put('/api/points/award', data, opts);
const revert = (data, opts) => api.post('/api/points/revert', data, opts);
const summary = (params, opts) => api.get('/api/points/summary', { params, ...(opts || {}) });

export default { award, revert, summary };