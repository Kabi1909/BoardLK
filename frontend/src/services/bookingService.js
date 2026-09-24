import api, { getSession } from './api.js';

import { bookingFromApi } from './adapters.js';
import { mutate } from './remoteStore.js';
export const bookingService = {
  async list(params = {}) {
    return (
      await api.get(getSession()?.user.role === 'owner' ? '/owner/bookings' : '/bookings/my', {
        params,
      })
    ).data.data.map(bookingFromApi);
  },
  create: (data) => mutate('post', '/bookings', data),
  update: (id, data) => mutate('patch', '/bookings/' + id + '/status', data),
  cancel: (id) => mutate('patch', '/bookings/' + id + '/cancel'),
};
