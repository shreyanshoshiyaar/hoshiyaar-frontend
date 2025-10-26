import axios from 'axios';

// The base URL of your backend API
// In development, use same-origin so Vite proxy (see vite.config.js) forwards to http://localhost:5000
// In production, allow overriding with VITE_API_BASE, otherwise fall back to current origin
// For mobile access on local network, use the local IP
const getBaseURL = () => {
  if (import.meta.env.DEV) {
    return ''; // Use Vite proxy in development
  }
  
  // Check if we're accessing from mobile on local network
  const hostname = window.location.hostname;
  if (hostname === '192.168.1.11') {
    return 'http://192.168.1.11:5000'; // Local network backend
  }
  
  return import.meta.env.VITE_API_BASE || '';
};

const BASE = getBaseURL();
const API_URL = `${BASE}/api/auth/`;

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
  checkUsername,
};

export default authService;
