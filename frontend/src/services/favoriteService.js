import api, { isMock } from './api';
import { collection, database } from './store';
export const favoriteService = {
  async list() {
    return isMock ? database.get().favorites : (await api.get('/favorites')).data;
  },
  async create(data) {
    return isMock ? collection('favorites').add(data) : (await api.post('/favorites', data)).data;
  },
  async update(id, data) {
    return isMock
      ? collection('favorites').update(id, data)
      : (await api.patch('/favorites/' + id, data)).data;
  },
  async remove(id) {
    return isMock ? collection('favorites').remove(id) : api.delete('/favorites/' + id);
  },
};
