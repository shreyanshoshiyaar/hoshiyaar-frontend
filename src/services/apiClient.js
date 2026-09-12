import axios from 'axios';
import { getApiBase } from '../utils/apiBase.js';
import { logDev, warnDev } from '../utils/logger.js';

/**
 * Centralized API client for all backend communication.
 * Handles base URL, timeouts, and automatic authentication header injection.
 */
export const api = axios.create({
  baseURL: getApiBase(),
  timeout: 120000,
  withCredentials: false,
});

// Request interceptor to attach bearer tokens
api.interceptors.request.use((config) => {
  let token = null;
  const isAdminRequest = config.url && (config.url.includes('/api/admin') || config.url.includes('/api/curriculum/import'));

  // If this is an admin request, prioritize explicit adminToken from session
  if (isAdminRequest) {
    token = sessionStorage.getItem('adminToken');
  }

  // 1. Try to get user token from localStorage 'user'
  if (!token) {
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const user = JSON.parse(storedUser);
        token = user?.token;
      }
    } catch (e) {
      warnDev('[apiClient] Failed to parse user from localStorage', e);
    }
  }

  // 2. Try direct token keys from localStorage
  if (!token) {
    token = localStorage.getItem('token') || localStorage.getItem('authToken');
  }

  // 3. Fallback: check sessionStorage for adminToken
  if (!token) {
    token = sessionStorage.getItem('adminToken');
  }

  // 4. Attach token if found
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
}, (error) => {
  return Promise.reject(error);
});

// Response interceptor for global error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle specific status codes if needed (e.g. 401 Unauthorized)
    if (error.response?.status === 401) {
      warnDev('[apiClient] Unauthorized access detected');
      // Potential auto-logout logic could go here
    }
    return Promise.reject(error);
  }
);

export default api;
