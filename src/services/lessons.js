import api from './apiClient';

// Fetch items for a module by its ObjectId (from curriculum flow)
export async function fetchLessonItemsByModule(moduleId) {
  const response = await api.get('/api/curriculum/items', { 
    params: { moduleId } 
  });
  return response.data;
}

export async function importLessons(moduleNumber, payload) {
  const response = await api.post(`/api/lessons/${moduleNumber}/import`, payload);
  return response.data;
}