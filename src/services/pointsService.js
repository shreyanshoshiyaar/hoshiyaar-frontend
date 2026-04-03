import axios from 'axios';
import { getApiBase } from '../utils/apiBase.js';

const BASE = getApiBase();
const API_URL = `${BASE}/api/points/`;

const http = axios.create({ baseURL: API_URL, timeout: 12000, withCredentials: false });

const award = (data, opts) => http.put('award', data, opts);
const summary = (params, opts) => http.get('summary', { params, ...(opts || {}) });

export default { award, summary };