import axios from 'axios';

const getBaseURL = () => {
  if (import.meta.env.DEV) return '';
  const hostname = window.location.hostname;
  if (hostname === '192.168.1.11') return 'http://192.168.1.11:5000';
  return import.meta.env.VITE_API_BASE || '';
};

const BASE = getBaseURL();
const API_URL = `${BASE}/api/points/`;

const http = axios.create({ baseURL: API_URL, timeout: 12000, withCredentials: false });

const award = (data, opts) => http.put('award', data, opts);
const summary = (params, opts) => http.get('summary', { params, ...(opts || {}) });

export default { award, summary };


