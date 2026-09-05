import api from './apiClient';
import axios from 'axios'; // Still needed for some external/direct calls
import { getApiBase } from '../utils/apiBase.js';
import { logDev } from '../utils/logger.js';

const BASE = getApiBase();

const getPlatform = () => {
  if (window.Capacitor) {
    return window.Capacitor.getPlatform();
  }
  return 'web';
};

// Register user (username-based)
const register = (userData, opts) => {
  return api.post('/api/auth/register', { ...userData, platform: getPlatform() }, opts);
};

// Register guest (anonymous)
const registerGuest = (opts) => {
  return api.post('/api/auth/register-guest', { platform: getPlatform() }, opts);
};

// Check if user exists by phone
const checkUser = (phone, opts) => {
  return api.post('/api/auth/check-user', { phone }, opts);
};

// Login user with username
const login = (userData, opts) => {
  return api.post('/api/auth/login', { ...userData, platform: getPlatform() }, opts);
};

// Admin Login
const adminLogin = (userData, opts) => {
  return api.post('/api/admin/login', userData, opts);
};

// WhatsApp OTP
const sendOtp = (phone, type, opts) => {
  return api.post('/api/auth/send-otp', { phone, type, platform: getPlatform() }, opts);
};

const verifyOtp = (phone, otp, opts) => {
  return api.post('/api/auth/verify-otp', { phone, otp, platform: getPlatform() }, opts);
};

const resetPassword = (phone, otp, newPassword, opts) => {
  return api.post('/api/auth/reset-password', { phone, otp, newPassword }, opts);
};

// Update onboarding selections
const updateOnboarding = (data, opts) => {
  return api.put('/api/auth/onboarding', { ...data, platform: getPlatform() }, opts);
};

// Update profile (alias to onboarding update for now)
const updateProfile = (data, opts) => api.put('/api/auth/onboarding', { ...data, platform: getPlatform() }, opts);

// Update user activity and FCM token
const updateActivity = (userId, fcmToken, opts) => {
  return api.post('/api/auth/update-activity', { userId, fcmToken, platform: getPlatform() }, opts);
};

// Update user location
const updateLocation = (userId, locationData, opts) => {
  return api.post('/api/auth/update-location', { userId, ...locationData }, opts);
};

// Simple in-memory cache for GET requests to reduce redundant network calls
const cache = new Map();
const CACHE_TTL = 30000; // 30 seconds

const cachedGet = async (url, config = {}) => {
  const cacheKey = JSON.stringify({ url, params: config.params });
  const now = Date.now();
  
  if (cache.has(cacheKey)) {
    const entry = cache.get(cacheKey);
    if (now - entry.timestamp < CACHE_TTL) {
      logDev(`[Cache Hit] ${url}`);
      return entry.data;
    }
  }
  
  const response = await api.get(url, config);
  cache.set(cacheKey, { data: response, timestamp: now });
  return response;
};

// Get user data
const getUser = (userId, opts) => {
  return api.get('/api/auth/user/' + userId, opts);
};

// Progress APIs
const getProgress = (userId, opts) => api.get('/api/auth/progress/' + userId, opts);
const updateProgress = (data, opts) => api.put('/api/auth/progress', data, opts);
const getCompletedModuleIds = (userId, { subject } = {}, opts) => api.get('/api/auth/completed-modules/' + userId, { params: { subject }, ...(opts || {}) });

// Username availability
const checkUsername = (username, opts) => api.get('/api/auth/check-username', { params: { username }, ...(opts || {}) });

// Leaderboard API
const getLeaderboard = (school, timeframe = 'total', metric = 'points', opts) => {
  const params = school ? { school, timeframe, metric } : { timeframe, metric };
  return cachedGet('/api/points/leaderboard', { params, ...(opts || {}) });
};

// Sync streak to backend
const syncStreak = (userId, opts) => {
  return api.post('/api/points/sync-streak', { userId, localDate: new Date().toISOString() }, opts);
};

// Get points summary
const getSummary = (params, opts) => {
  return cachedGet('/api/points/summary', { params, ...(opts || {}) });
};

// Get list of unique school names for autocomplete
const getSchoolNames = (query, opts) => {
  return cachedGet('/api/points/schools', { params: { q: query }, ...(opts || {}) });
};

// Helper to check if a place prediction is an educational institution/school
const isSchoolPrediction = (prediction) => {
  if (!prediction) return false;
  
  // 1. Check types if available from Ola/Places API
  const types = Array.isArray(prediction.types) ? prediction.types.map(t => String(t).toLowerCase()) : [];
  if (types.some(t => ['school', 'primary_school', 'secondary_school', 'kindergarten', 'preschool', 'university'].includes(t))) {
    return true;
  }

  const text = `${prediction.description || ''} ${prediction.structured_formatting?.main_text || ''}`.toLowerCase();

  const hasSchoolKeyword = [
    'school', 'vidyalaya', 'vidhyalaya', 'academy', 'convent', 'international', 
    'gurukul', 'pathshala', 'montessori', 'preschool', 'pre-school', 'kindergarten',
    'bal bhavan', 'bal mandir', 'bal vatika', 'shikshan', 'shiksha', 'vidya',
    'college', 'institution', 'institute', 'matriculation', 'day boarding',
    'dps', 'dav', 'kv', 'kendriya'
  ].some(kw => text.includes(kw));

  if (!hasSchoolKeyword) return false;

  // Exclude non-educational transport/commercial landmarks
  if (text.includes('bus stop') || text.includes('bus stand') || text.includes('railway station') || text.includes('metro station')) {
    return false;
  }

  return true;
};

// Get school suggestions from Ola Maps API (strictly filtered to schools)
const getOlaSchoolSuggestions = async (query) => {
  const apiKey = import.meta.env.VITE_OLA_MAPS_API_KEY;
  if (!apiKey) {
    console.warn('Ola Maps API Key not found in .env');
    return { data: { predictions: [] } };
  }
  
  const trimmed = (query || '').trim();
  if (trimmed.length < 2) {
    return { data: { predictions: [] } };
  }

  const url = 'https://api.olamaps.io/places/v1/autocomplete';

  // Check if user already typed a school indicator
  const hasSchoolIndicator = /\b(school|vidyalaya|vidhyalaya|academy|convent|gurukul|pathshala|montessori|preschool|college|institute|institu|dps|dav|kv|kendriya)\b/i.test(trimmed);

  // If user only typed locality/city or general name (e.g. "Dundlod"), augment with "school" so Ola searches schools
  const primaryQuery = hasSchoolIndicator ? trimmed : `${trimmed} school`;
  const params = { input: primaryQuery, api_key: apiKey };

  try {
    const cacheKey = JSON.stringify({ url, params });
    const now = Date.now();
    let rawResponse = null;

    if (cache.has(cacheKey)) {
      const entry = cache.get(cacheKey);
      if (now - entry.timestamp < CACHE_TTL) rawResponse = entry.data;
    }

    if (!rawResponse) {
      rawResponse = await axios.get(url, { params });
      cache.set(cacheKey, { data: rawResponse, timestamp: now });
    }

    const predictions = rawResponse?.data?.predictions || [];
    const filtered = predictions.filter(isSchoolPrediction);

    // Fallback: If augmented query returns 0, try searching raw query and filter
    if (filtered.length === 0 && !hasSchoolIndicator) {
      const rawParams = { input: trimmed, api_key: apiKey };
      const rawRes = await axios.get(url, { params: rawParams });
      const rawList = rawRes?.data?.predictions || [];
      const filteredRaw = rawList.filter(isSchoolPrediction);
      return { data: { predictions: filteredRaw } };
    }

    return { data: { predictions: filtered } };
  } catch (error) {
    console.error('Ola Maps Autocomplete Error:', error);
    return { data: { predictions: [] } };
  }
};

// Blog APIs
const getBlogs = (opts) => cachedGet('/api/blogs', opts);
const getBlogById = (id, opts) => api.get(`/api/blogs/${id}`, opts);

// Admin Blog APIs
const getAllBlogsAdmin = (opts) => api.get('/api/blogs/admin/all', opts);
const createBlog = (data, opts) => api.post('/api/blogs', data, opts);
const updateBlog = (id, data, opts) => api.put(`/api/blogs/${id}`, data, opts);
const deleteBlog = (id, opts) => api.delete(`/api/blogs/${id}`, opts);

// Admin User Analytics
const getUsersAnalytics = (opts) => api.get('/api/admin/users-analytics', opts);
const updateUserSchool = (id, school, opts) => api.put(`/api/admin/users/${id}/school`, { school }, opts);

const claimWeeklyGoal = (userId, opts) => api.post(`/api/auth/user/${userId}/claim-weekly-goal`, {}, opts);

// Export the functions
const authService = {
  register,
  registerGuest,
  login,
  adminLogin,
  verifyOtp,
  resetPassword,
  updateOnboarding,
  updateProfile,
  updateActivity,
  updateLocation,
  getUser,
  getProgress,
  updateProgress,
  getCompletedModuleIds,
  checkUsername,
  checkUser,
  getLeaderboard,
  syncStreak,
  getSchoolNames,
  getSummary,
  getOlaSchoolSuggestions,
  getBlogs,
  getBlogById,
  getAllBlogsAdmin,
  createBlog,
  updateBlog,
  deleteBlog,
  getUsersAnalytics,
  updateUserSchool,
  sendOtp,
  verifyOtp,
  resetPassword,
  claimWeeklyGoal,
  deleteAccount: (userId, opts) => api.delete(`/api/auth/user/${userId}`, opts),
};

export default authService;