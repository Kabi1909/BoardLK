import axios from 'axios';
import { getSession } from './session';

export { getSession } from './session';

const api = axios.create({
  baseURL: import.meta.env?.VITE_API_URL || 'http://localhost:5000/api',
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
    normalized.fields = Object.fromEntries(
      (error.response?.data?.errors || []).map((item) => [item.field, item.message]),
    );
    if (
      normalized.status === 401 &&
      !['/auth/login', '/auth/register'].includes(error.config?.url) &&
      getSession()?.token &&
      error.config?.headers?.Authorization === 'Bearer ' + getSession().token
    ) {
      window.dispatchEvent(new Event('boardlk-session-expired'));
    }
    return Promise.reject(normalized);
  },
);

export default api;
