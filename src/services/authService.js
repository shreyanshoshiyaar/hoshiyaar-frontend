import axios from 'axios';
import { getApiBase } from '../utils/apiBase.js';

const BASE = getApiBase();
const API_URL = ${BASE}/api/auth/;

// Debug logging
console.log('API_URL:', API_URL);
console.log('Environment:', import.meta.env.DEV ? 'development' : 'production');
console.log('BASE:', BASE);

// Centralized axios instance with timeout
const http = axios.create({
  baseURL: API_URL,
  timeout: 12000,
  withCredentials: false,
});

// Register user (username-based)
const register = (userData, opts) => {
  return http.post('register', userData, opts);
};

// Login user with username
const login = (userData, opts) => {
  return http.post('login', userData, opts);
};

// Update onboarding selections
const updateOnboarding = (data, opts) => {
  return http.put('onboarding', data, opts);
};

// Update profile (alias to onboarding update for now)
const updateProfile = (data, opts) => http.put('onboarding', data, opts);

// Get user data
const getUser = (userId, opts) => {
  return http.get('user/' + userId, opts);
};

// Progress APIs
const getProgress = (userId, opts) => http.get('progress/' + userId, opts);
const updateProgress = (data, opts) => http.put('progress', data, opts);
const getCompletedModuleIds = (userId, { subject } = {}, opts) => http.get('completed-modules/' + userId, { params: { subject }, ...(opts || {}) });

// Username availability
const checkUsername = (username, opts) => http.get('check-username', { params: { username }, ...(opts || {}) });

// Export the functions
const authService = {
  register,
  login,
  updateOnboarding,
  updateProfile,
  getUser,
  getProgress,
  updateProgress,
  getCompletedModuleIds,
  checkUsername,
};

export default authService;