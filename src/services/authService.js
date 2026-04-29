import axios from 'axios';
import { getApiBase } from '../utils/apiBase.js';


const BASE = getApiBase();
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

// Register guest (anonymous)
const registerGuest = (opts) => {
  return http.post('register-guest', {}, opts);
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

// Leaderboard API (calls pointsRoutes mounted at /api/points/leaderboard)
const getLeaderboard = (school, timeframe = 'total', opts) => {
  // Use absolute URL or relative to BASE if needed, but BASE depends on getApiBase()
  // authService's http instance uses API_URL which is `${BASE}/api/auth/`
  // We need to call `${BASE}/api/points/leaderboard`
  return axios.get(`${BASE}/api/points/leaderboard`, { params: { school, timeframe }, ...(opts || {}) });
};

// Get points summary (calls pointsRoutes mounted at /api/points/summary)
const getSummary = (params, opts) => {
  return axios.get(`${BASE}/api/points/summary`, { params, ...(opts || {}) });
};

// Get list of unique school names for autocomplete
const getSchoolNames = (query, opts) => {
  return axios.get(`${BASE}/api/points/schools`, { params: { q: query }, ...(opts || {}) });
};

// Get school suggestions from Ola Maps API
const getOlaSchoolSuggestions = async (query) => {
  const apiKey = import.meta.env.VITE_OLA_MAPS_API_KEY;
  if (!apiKey) {
    console.warn('Ola Maps API Key not found in .env');
    return { data: { predictions: [] } };
  }
  
  try {
    const response = await axios.get('https://api.olamaps.io/places/v1/autocomplete', {
      params: {
        input: query,
        api_key: apiKey,
      }
    });
    return response;
  } catch (error) {
    console.error('Ola Maps Autocomplete Error:', error);
    return { data: { predictions: [] } };
  }
};

// Export the functions
const authService = {
  register,
  registerGuest,
  login,
  updateOnboarding,
  updateProfile,
  getUser,
  getProgress,
  updateProgress,
  getCompletedModuleIds,
  checkUsername,
  getLeaderboard,
  getSchoolNames,
  getSummary,
  getOlaSchoolSuggestions,
};

export default authService;