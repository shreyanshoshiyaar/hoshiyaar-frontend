import api from './apiClient';

const reviewService = {
  async listIncorrect(userId, moduleId, chapterId) {
    const res = await api.get('/api/review/incorrect', { params: { userId, moduleId, chapterId } });
    return res.data || [];
  },
  async listDefaults({ moduleId, unitId, chapterId, subjectId } = {}) {
    const params = {};
    if (moduleId) params.moduleId = moduleId;
    else if (unitId) params.unitId = unitId;
    else if (chapterId) params.chapterId = chapterId;
    else if (subjectId) params.subjectId = subjectId;
    const res = await api.get('/api/review/defaults', { params });
    return res.data || [];
  },
  async saveIncorrect({ userId, questionId, moduleId, chapterId }) {
    const payload = { userId, questionId };
    if (moduleId) payload.moduleId = String(moduleId);
    if (chapterId) payload.chapterId = String(chapterId);
    const res = await api.post('/api/review/incorrect', payload);
    return res.data;
  }
};

export default reviewService;