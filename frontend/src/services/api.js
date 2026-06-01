import axios from 'axios';

function resolveApiBaseUrl() {
  const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL;

  if (configuredBaseUrl) {
    return configuredBaseUrl;
  }

  if (typeof window !== 'undefined') {
    const backendPort = import.meta.env.VITE_BACKEND_PORT || 5000;
    const host = window.location.hostname;

    if (host === 'localhost' || host === '127.0.0.1') {
      return `http://localhost:${backendPort}/api/v1`;
    }

    return `http://${host}:${backendPort}/api/v1`;
  }

  return `http://localhost:${import.meta.env.VITE_BACKEND_PORT || 5000}/api/v1`;
}

const api = axios.create({
  baseURL: resolveApiBaseUrl(),
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('acdi_token');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('acdi_user');
      localStorage.removeItem('acdi_token');
      window.location.assign('/login');
    }

    return Promise.reject(error);
  },
);

export default api;
