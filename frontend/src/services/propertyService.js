import api from './api.js';
import { propertyFromApi } from './adapters.js';
import { saveProperty } from './remoteActions.js';
import { mutate, loadProperty } from './remoteStore.js';
export const propertyService = {
  async list(params = {}) {
    return (await api.get('/properties', { params })).data.data.map(propertyFromApi);
  },
  async search(params = {}) {
    return (await api.get('/properties', { params })).data;
  },
  detail: loadProperty,
  create: (data) => saveProperty(data),
  update: (id, data) => saveProperty(data, id),
  remove: (id) => mutate('delete', '/properties/' + id),
};
