import axios from 'axios';

// Determine the appropriate API base URL dynamically
export const getApiBaseUrl = () => {
  const saved = localStorage.getItem('batchit_server_url');
  if (saved) {
    const clean = saved.trim().replace(/\/+$/, '');
    return clean.endsWith('/api') ? clean : `${clean}/api`;
  }

  const isCapacitor =
    window.location.protocol === 'capacitor:' ||
    window.location.protocol === 'file:' ||
    (window.location.hostname === 'localhost' && (!window.location.port || window.location.port === '80'));

  // In native Android APK, connect to the computer's backend server
  if (isCapacitor) {
    return 'http://10.98.125.78:5000/api';
  }

  // If accessed from mobile browser via Wi-Fi IP (e.g. http://10.98.125.78:5173)
  if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    if (window.location.port === '5173') {
      return '/api';
    }
    return `http://${window.location.hostname}:5000/api`;
  }

  return '/api';
};

export const setCustomServerUrl = (url) => {
  if (!url) {
    localStorage.removeItem('batchit_server_url');
  } else {
    let clean = url.trim().replace(/\/+$/, '');
    if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
      clean = `http://${clean}`;
    }
    localStorage.setItem('batchit_server_url', clean);
  }
};

const api = axios.create({
  baseURL: getApiBaseUrl(),
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to attach token from localStorage if available
api.interceptors.request.use((config) => {
  config.baseURL = getApiBaseUrl();
  const token = localStorage.getItem('batchit_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Device headers for session management
  let deviceId = localStorage.getItem('batchit_device_id');
  if (!deviceId) {
    deviceId = 'web_' + Math.random().toString(36).substring(2, 15);
    localStorage.setItem('batchit_device_id', deviceId);
  }
  config.headers['X-Device-Id'] = deviceId;
  config.headers['X-Device-Name'] = 'BatchiT Web';
  config.headers['X-Platform'] = 'Web';

  return config;
});

// Response interceptor to handle token refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (originalRequest.url === '/auth/login' || originalRequest.url === '/auth/refresh') {
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      try {
        const refreshRes = await axios.post(`${getApiBaseUrl()}/auth/refresh`, {}, { withCredentials: true });
        if (refreshRes.data.success && refreshRes.data.data?.accessToken) {
          const newToken = refreshRes.data.data.accessToken;
          localStorage.setItem('batchit_token', newToken);
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        }
      } catch (refreshErr) {
        localStorage.removeItem('batchit_token');
        // If not already on auth page, redirect to login
        if (window.location.pathname !== '/login' && window.location.pathname !== '/' && window.location.pathname !== '/register') {
          window.location.href = '/login';
        }
        return Promise.reject(refreshErr);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
