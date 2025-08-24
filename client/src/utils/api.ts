import axios from 'axios';

// Get the API URL from environment variables or fallback to dynamic detection
const getApiUrl = () => {
  // Use environment variable if available
  if (process.env.REACT_APP_API_URL) {
    // If we're accessing via a LAN IP but env vars still point to localhost, prefer dynamic
    const envUrl = process.env.REACT_APP_API_URL;
    const accessingViaLan = !['localhost', '127.0.0.1'].includes(window.location.hostname) && /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[0-1]))/.test(window.location.hostname);
    const envIsLocalhost = /localhost|127\.0\.0\.1/.test(envUrl);
    if (accessingViaLan && envIsLocalhost) {
      return `http://${window.location.hostname}:5000/api`;
    }
    return envUrl;
  }
  
  // Production fallback - use same domain as frontend
  if (process.env.NODE_ENV === 'production') {
    return `${window.location.protocol}//${window.location.host}/api`;
  }
  
  // Development fallback
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:5000/api';
  }
  
  // Network development fallback
  return `http://${window.location.hostname}:5000/api`;
};

const API_BASE_URL = getApiUrl();
console.log(`API base URL: ${API_BASE_URL}`);

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
});

// Add token to requests automatically
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle token expiration and network errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    
    // Handle network errors
    if (!error.response) {
      console.error('Network error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

export default api;
