import api, { isMock } from './api';
import { collection, database } from './store';
export const notificationService = {
  async list() {
    return isMock ? database.get().notifications : (await api.get('/notifications')).data;
  },
  async create(data) {
    return isMock
      ? collection('notifications').add(data)
      : (await api.post('/notifications', data)).data;
  },
  async update(id, data) {
    return isMock
      ? collection('notifications').update(id, data)
      : (await api.patch('/notifications/' + id, data)).data;
  },
  async remove(id) {
    return isMock ? collection('notifications').remove(id) : api.delete('/notifications/' + id);
  },
};
