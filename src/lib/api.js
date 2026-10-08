import axios from 'axios';

// Desktop (Electron) can inject the API URL at runtime via preload
const runtimeUrl = typeof window !== 'undefined' && window.nexora?.apiUrl;
export const API_URL = runtimeUrl || import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({ baseURL: API_URL, timeout: 20000 });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('nexora_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401 && !err.config.url.includes('/auth/login')) {
      localStorage.removeItem('nexora_token');
      window.dispatchEvent(new Event('nexora:logout'));
    }
    return Promise.reject(err);
  }
);

export const errMsg = (e) => e?.response?.data?.error || e?.message || 'Something went wrong';
export default api;
