import api from './apiClient.js';

export const createClassroom = (data) => api.post('/api/teacher/classrooms', data);
export const getTeacherClassrooms = () => api.get('/api/teacher/classrooms');
export const getClassroomDetails = (id) => api.get(`/api/teacher/classrooms/${id}`);
export const deleteClassroom = (id) => api.delete(`/api/teacher/classrooms/${id}`);
export const addStudent = (classroomId, identifier) => api.post(`/api/teacher/classrooms/${classroomId}/students`, { identifier });
export const removeStudent = (classroomId, studentId) => api.delete(`/api/teacher/classrooms/${classroomId}/students/${studentId}`);

export const createAssignment = (classroomId, data) => api.post(`/api/teacher/classrooms/${classroomId}/assignments`, data);
export const getAssignmentTracking = (assignmentId) => api.get(`/api/teacher/assignments/${assignmentId}/tracking`);
export const toggleAssignmentStatus = (assignmentId, status) => api.patch(`/api/teacher/assignments/${assignmentId}/status`, { status });
export const getCurriculumOptions = () => api.get('/api/teacher/curriculum-options');
export const getSchoolStudents = (classroomId) => api.get(`/api/teacher/classrooms/${classroomId}/school-students`);
export const bulkAddStudents = (classroomId, studentIds) => api.post(`/api/teacher/classrooms/${classroomId}/bulk-add-students`, { studentIds });
export const nudgePendingStudents = (assignmentId) => api.post(`/api/teacher/assignments/${assignmentId}/nudge-pending`);

export default {
  createClassroom,
  getTeacherClassrooms,
  getClassroomDetails,
  deleteClassroom,
  addStudent,
  removeStudent,
  createAssignment,
  getAssignmentTracking,
  toggleAssignmentStatus,
  getCurriculumOptions,
  getSchoolStudents,
  bulkAddStudents,
  nudgePendingStudents,
};
