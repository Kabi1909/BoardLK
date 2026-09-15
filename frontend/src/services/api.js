import axios from 'axios';
import { getSession } from './session';

export { getSession } from './session';
export const isMock = import.meta.env.VITE_USE_MOCK !== 'false';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = getSession()?.token;
  if (token) config.headers.Authorization = 'Bearer ' + token;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const normalized = new Error(
      error.response?.data?.message || error.message || 'Unable to connect. Please retry.',
    );
    normalized.status = error.response?.status;
    normalized.fields = error.response?.data?.errors || {};
    return Promise.reject(normalized);
  },
);

export default api;
