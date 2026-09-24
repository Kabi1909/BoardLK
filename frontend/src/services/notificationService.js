import api from './api.js';
import { mutate } from './remoteStore.js';
export const notificationService = {
  list: async (params) => (await api.get('/notifications', { params })).data,
  markRead: (id) => mutate('patch', '/notifications/' + id + '/read'),
  markAllRead: () => mutate('patch', '/notifications/read-all'),
};
