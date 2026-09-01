import axios from 'axios';

// Connect dynamically to backend API
const getBaseURL = () => {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://127.0.0.1:8000';
    }
  }
  return 'http://127.0.0.1:8000';
};

export const api = axios.create({
  baseURL: getBaseURL(),
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Request Interceptor: Attach JWT Token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('siri_auth_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle auth expiration, notifications & formatted errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;
      const errorMsg =
        typeof data?.detail === 'string'
          ? data.detail
          : typeof data?.message === 'string'
          ? data.message
          : 'An unexpected server error occurred.';

      if (status === 401) {
        // Clear expired token and redirect to login if not already on login or root
        const pathname = window.location.pathname;
        if (pathname !== '/login' && pathname !== '/' && !pathname.startsWith('/admin/login')) {
          localStorage.removeItem('siri_auth_token');
          localStorage.removeItem('siri_admin_refresh_token');
          localStorage.removeItem('siri_auth_user');
          localStorage.removeItem('siri_auth_expires_at');
          localStorage.removeItem('siri_auth_timestamp');
          window.location.href = '/login';
        }
      } else if (status >= 400 && status !== 404 && typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('api:error', { detail: { message: errorMsg } }));
      }
    } else if (error.request && typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('api:error', {
          detail: { message: 'Unable to connect to backend server. Please verify backend is running.' },
        })
      );
    }
    return Promise.reject(error);
  }
);

export default api;
