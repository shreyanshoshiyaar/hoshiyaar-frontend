import axios from 'axios';
import { getApiBase } from '../utils/apiBase.js';
import { logDev, warnDev } from '../utils/logger.js';
import { getDeviceId } from '../utils/deviceId.js';
import { isUserAdmin } from '../utils/adminCheck.js';

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
  const isAdminRequest = config.url && (config.url.includes('/api/admin') || config.url.includes('/admin') || config.url.includes('/api/curriculum/import'));

  // Admin requests: a logged-in admin uses their own token. The separate admin login (session
  // token) is only for when the logged-in account isn't an admin. A loose 'token' left on the
  // device from an older session used to win here and made the admin panel fail for real admins.
  if (isAdminRequest) {
    let current = null;
    try { current = JSON.parse(localStorage.getItem('user') || 'null'); } catch (_) {}
    token = (current?.token && isUserAdmin(current) ? current.token : null) ||
      sessionStorage.getItem('adminToken') ||
      current?.token ||
      localStorage.getItem('token') || localStorage.getItem('authToken');
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

  // Tells the backend this build runs the free trial (older Android builds send nothing)
  config.headers = config.headers || {};
  config.headers['x-hy-client'] = '2';

  // Lets the backend keep a guest's free trial across reinstalls
  const deviceId = getDeviceId();
  if (deviceId) {
    config.headers = config.headers || {};
    config.headers['x-device-id'] = deviceId;
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
