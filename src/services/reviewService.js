import axios from 'axios';
import { getApiBase } from '../utils/apiBase.js';

const API = getApiBase();

const reviewService = {
  async listIncorrect(userId, moduleId, chapterId) {
    const res = await axios.get(${API}/api/review/incorrect, { params: { userId, moduleId, chapterId } });
    return res.data || [];
  },
  async listDefaults({ moduleId, unitId, chapterId, subjectId } = {}) {
    const params = {};
    if (moduleId) params.moduleId = moduleId;
    else if (unitId) params.unitId = unitId;
    else if (chapterId) params.chapterId = chapterId;
    else if (subjectId) params.subjectId = subjectId;
    const res = await axios.get(${API}/api/review/defaults, { params });
    return res.data || [];
  },
  async saveIncorrect({ userId, questionId, moduleId, chapterId }) {
    const payload = { userId, questionId };
    if (moduleId) payload.moduleId = String(moduleId);
    if (chapterId) payload.chapterId = String(chapterId);
    const res = await axios.post(${API}/api/review/incorrect, payload);
    return res.data;
  }
};

export default reviewService;