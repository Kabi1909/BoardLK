import api from './api.js';
export const dashboardService = {
  renter: async () => (await api.get('/renter/dashboard')).data.data,
  owner: async () => (await api.get('/owner/dashboard')).data.data,
  recommendations: async () => (await api.get('/recommendations')).data.data,
  recentlyViewed: async () => (await api.get('/renter/recently-viewed')).data.data,
};
