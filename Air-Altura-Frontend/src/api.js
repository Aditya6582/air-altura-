import axios from 'axios';

// All requests go through the API Gateway.
// VITE_API_URL is set at build time on the hosting platform (e.g. Railway/Render).
// Falls back to relative path in dev so the Vite proxy handles it transparently.
function resolveApiBaseUrl() {
  const configured = import.meta.env.VITE_API_URL?.trim();
  if (!configured) return '/api/v1';

  const normalized = configured.replace(/\/+$/, '');
  return normalized.endsWith('/api/v1') ? normalized : `${normalized}/api/v1`;
}

const api = axios.create({
  baseURL: resolveApiBaseUrl(),
});

// Attach JWT from localStorage to every request automatically
api.interceptors.request.use(config => {
  const token = localStorage.getItem('aa_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// If any protected request returns 401, the token is expired or invalidated.
// Clear the session and redirect to login — avoids the user being stuck
// appearing logged-in while every API call silently fails.
api.interceptors.response.use(
  response => response,
  error => {
    const is401 = error.response?.status === 401;
    const isAuthRoute = error.config?.url?.startsWith('/auth');
    if (is401 && !isAuthRoute) {
      localStorage.removeItem('aa_token');
      localStorage.removeItem('aa_userId');
      window.location.href = '/auth';
    }
    return Promise.reject(error);
  }
);

export default api;
