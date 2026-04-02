import axios from 'axios';

// Get the API base URL
const getAPIBase = () => {
  // In production (Vercel), use VITE_API_URL
  if (import.meta.env.PROD) {
    const apiUrl = import.meta.env.VITE_API_URL;
    if (!apiUrl) {
      console.error('❌ VITE_API_URL not set in production!');
      return '';
    }
    console.log('🌐 Using production API URL:', apiUrl);
    return apiUrl;
  }
  
  // In development
  const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
  
  // Local network mobile access
  if (hostname === '192.168.1.11') {
    console.log('📱 Using local network backend: http://192.168.1.11:5000');
    return 'http://192.168.1.11:5000';
  }
  
  // Localhost - use Vite proxy (empty baseURL)
  console.log('🔧 Using Vite proxy for development');
  return '';
};

const API_BASE = getAPIBase();

// Centralized axios instance
const http = axios.create({
  baseURL: API_BASE,
  timeout: 12000,
  withCredentials: true, // Allow cookies/sessions
});

// Log axios requests for debugging
http.interceptors.request.use((config) => {
  const fullUrl = API_BASE ? `${API_BASE}${config.url}` : config.url;
  console.log(`📡 ${config.method.toUpperCase()} ${fullUrl}`);
  return config;
});

// Log axios responses for debugging
http.interceptors.response.use(
  (response) => {
    console.log(`✅ Response:`, response.data);
    return response;
  },
  (error) => {
    console.error(`❌ API Error:`, error.message);
    return Promise.reject(error);
  }
);

const passOpts = (opts) => (opts && typeof opts === 'object' ? opts : {});

const curriculumService = {
  listBoards(opts) {
    console.log('📚 Calling listBoards');
    return http.get(`/api/curriculum/boards`, passOpts(opts));
  },
  
  listClasses(board = 'CBSE', opts) {
    console.log('📚 Calling listClasses for board:', board);
    return http.get(`/api/curriculum/classes`, { 
      params: { board }, 
      ...passOpts(opts) 
    });
  },
  
  listSubjects(board = 'CBSE', opts) {
    console.log('📚 Calling listSubjects for board:', board);
    return http.get(`/api/curriculum/subjects`, { 
      params: { board }, 
      ...passOpts(opts) 
    });
  },
  
  listChapters(board = 'CBSE', subject = 'Science', extraParams = {}, opts) {
    console.log('📚 Calling listChapters for board:', board, 'subject:', subject);
    return http.get(`/api/curriculum/chapters`, { 
      params: { board, subject, ...(extraParams || {}) }, 
      ...passOpts(opts) 
    });
  },
  
  listUnits(chapterId, opts) {
    console.log('📚 Calling listUnits for chapter:', chapterId);
    return http.get(`/api/curriculum/units`, { 
      params: { chapterId }, 
      ...passOpts(opts) 
    });
  },
  
  listModules(chapterId, opts) {
    console.log('📚 Calling listModules for chapter:', chapterId);
    return http.get(`/api/curriculum/modules`, { 
      params: { chapterId }, 
      ...passOpts(opts) 
    });
  },
  
  listModulesByUnit(unitId, opts) {
    console.log('📚 Calling listModulesByUnit for unit:', unitId);
    return http.get(`/api/curriculum/modules`, { 
      params: { unitId }, 
      ...passOpts(opts) 
    });
  },
  
  listItems(moduleId, opts) {
    console.log('📚 Calling listItems for module:', moduleId);
    return http.get(`/api/curriculum/items`, { 
      params: { moduleId }, 
      ...passOpts(opts) 
    });
  },
  
  getModule(moduleId, opts) {
    console.log('📚 Calling getModule:', moduleId);
    return http.get(`/api/curriculum/module`, { 
      params: { moduleId }, 
      ...passOpts(opts) 
    }).catch(() => {
      console.warn('⚠️ getModule endpoint not available, returning null');
      return { data: null };
    });
  },
  
  setItemImage(itemId, imageUrl, opts) {
    console.log('🖼️ Calling setItemImage for item:', itemId);
    return http.put(`/api/curriculum/items/${itemId}/image`, { imageUrl }, passOpts(opts));
  },
};

export default curriculumService;