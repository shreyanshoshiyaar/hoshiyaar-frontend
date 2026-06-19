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

// Login user with username
const login = (userData, opts) => {
  return api.post('/api/auth/login', userData, opts);
};

// Admin Login
const adminLogin = (userData, opts) => {
  return api.post('/api/admin/login', userData, opts);
};

// WhatsApp OTP
const sendOtp = (phone, type, opts) => {
  return api.post('/api/auth/send-otp', { phone, type }, opts);
};

const verifyOtp = (phone, otp, opts) => {
  return api.post('/api/auth/verify-otp', { phone, otp }, opts);
};

const resetPassword = (phone, otp, newPassword, opts) => {
  return api.post('/api/auth/reset-password', { phone, otp, newPassword }, opts);
};

// Update onboarding selections
const updateOnboarding = (data, opts) => {
  return api.put('/api/auth/onboarding', data, opts);
};

// Update profile (alias to onboarding update for now)
const updateProfile = (data, opts) => api.put('/api/auth/onboarding', data, opts);

// Update user activity and FCM token
const updateActivity = (userId, fcmToken, opts) => {
  return api.post('/api/auth/update-activity', { userId, fcmToken }, opts);
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
const getLeaderboard = (school, timeframe = 'total', opts) => {
  const params = school ? { school, timeframe } : { timeframe };
  return cachedGet('/api/points/leaderboard', { params, ...(opts || {}) });
};

// Get points summary
const getSummary = (params, opts) => {
  return cachedGet('/api/points/summary', { params, ...(opts || {}) });
};

// Get list of unique school names for autocomplete
const getSchoolNames = (query, opts) => {
  return cachedGet('/api/points/schools', { params: { q: query }, ...(opts || {}) });
};

// Get school suggestions from Ola Maps API
const getOlaSchoolSuggestions = async (query) => {
  const apiKey = import.meta.env.VITE_OLA_MAPS_API_KEY;
  if (!apiKey) {
    console.warn('Ola Maps API Key not found in .env');
    return { data: { predictions: [] } };
  }
  
  const url = 'https://api.olamaps.io/places/v1/autocomplete';
  const params = { input: query, api_key: apiKey };
  
  try {
    // Note: Ola Maps is external, so we might want to use cachedGet with absolute URL
    // but cachedGet uses api which has a baseURL.
    // For external calls, we use direct axios.
    const cacheKey = JSON.stringify({ url, params });
    const now = Date.now();
    if (cache.has(cacheKey)) {
      const entry = cache.get(cacheKey);
      if (now - entry.timestamp < CACHE_TTL) return entry.data;
    }
    const response = await axios.get(url, { params });
    cache.set(cacheKey, { data: response, timestamp: now });
    return response;
  } catch (error) {
    console.error('Ola Maps Autocomplete Error:', error); // Keep error for tracking
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

// Export the functions
const authService = {
  register,
  registerGuest,
  login,
  adminLogin,
  updateOnboarding,
  updateProfile,
  updateActivity,
  getUser,
  getProgress,
  updateProgress,
  getCompletedModuleIds,
  checkUsername,
  getLeaderboard,
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
  sendOtp,
  verifyOtp,
  resetPassword,
  deleteAccount: (userId, opts) => api.delete(`/api/auth/user/${userId}`, opts),
};

export default authService;