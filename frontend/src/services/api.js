import axios from 'axios';
export const isMock = import.meta.env.VITE_USE_MOCK !== 'false';
export const getSession = () => {
  try {
    return JSON.parse(
      localStorage.getItem('boardlk-auth') || sessionStorage.getItem('boardlk-auth') || 'null',
    );
  } catch {
    return null;
  }
};
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
  (r) => r,
  (error) =>
    Promise.reject(
      new Error(
        error.response?.data?.message || error.message || 'Unable to connect. Please retry.',
      ),
    ),
);
export default api;
