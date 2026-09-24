import api from './api.js';
import { mutate } from './remoteStore.js';
export const reviewService = {
  list: async (propertyId, params) =>
    (await api.get('/reviews/property/' + propertyId, { params })).data,
  create: (data) => mutate('post', '/reviews', data),
  update: (id, data) => mutate('put', '/reviews/' + id, data),
  remove: (id) => mutate('delete', '/reviews/' + id),
  reply: (id, reply) => mutate('post', '/reviews/' + id + '/reply', { reply }),
};
