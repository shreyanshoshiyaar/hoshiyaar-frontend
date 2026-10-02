import api from './apiClient.js';

export const joinClassroom = (code) => api.post('/api/student/classrooms/join', { code });
export const getStudentClassrooms = () => api.get('/api/student/classrooms');
export const getStudentAssignments = () => api.get('/api/student/classrooms/assignments');
export const leaveClassroom = (classroomId) => api.post(`/api/student/classrooms/${classroomId}/leave`);

export default {
  joinClassroom,
  getStudentClassrooms,
  getStudentAssignments,
  leaveClassroom,
};
