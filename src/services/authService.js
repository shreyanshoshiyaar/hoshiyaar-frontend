import axios from 'axios';

// Determine the backend base URL
// - In development, use '' so Vite proxy (vite.config.js) forwards to http://localhost:5000
// - In production, use VITE_API_URL (full URL to your Railway service)
// - If it's missing, we log an error so you catch misconfigurations early
const getBaseURL = () => {
  if (import.meta.env.DEV) {
    return ''; // Vite proxy handles http://localhost:5000
  }

  // Production: use the explicit Railway backend URL
  const base = import.meta.env.VITE_API_URL;
  if (!base) {
    console.error(
      '❌ VITE_API_URL is not defined in production. Set it in your deployment environment (Vercel → Settings → Environment Variables) to your Railway backend URL, e.g., https://hoshiyaar-backend-production.up.railway.app'
    );
  }
  return base; // Should be full domain, like https://hoshiyaar-backend-production.up.railway.app
};

const BASE = getBaseURL();
const API_URL = `${BASE}/api/auth/`; // All auth endpoints will start from this path

// Debug logging (helps confirm environment and URL are correct)
console.log('API_URL:', API_URL);
console.log('Environment:', import.meta.env.DEV ? 'development' : 'production');
console.log('BASE URL from env:', BASE);

// Centralized axios instance
const http = axios.create({
  baseURL: API_URL,
  timeout: 12000,
  withCredentials: true, // Helpful if using cookies/session-based auth
});

// Auth service functions
const register = (userData, opts) => http.post('register', userData, opts);
const login = (userData, opts) => http.post('login', userData, opts);
const updateOnboarding = (data, opts) => http.put('onboarding', data, opts);
const updateProfile = (data, opts) => http.put('onboarding', data, opts); // alias if this matches your backend
const getUser = (userId, opts) => http.get('user/' + userId, opts);
const getProgress = (userId, opts) => http.get('progress/' + userId, opts);
const updateProgress = (data, opts) => http.put('progress', data, opts);
const getCompletedModuleIds = (userId, { subject } = {}, opts) =>
  http.get('completed-modules/' + userId, { params: { subject }, ...(opts || {}) });
const checkUsername = (username, opts) =>
  http.get('check-username', { params: { username }, ...(opts || {}) });

export default {
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