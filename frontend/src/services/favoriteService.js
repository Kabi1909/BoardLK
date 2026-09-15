import api, { isMock } from './api';
import { database } from './store';

// Favorites are a per-user index, not a flat entity collection.
export const favoriteService = {
  async list(userId) {
    return isMock ? database.get().favorites[userId] || [] : (await api.get('/favorites')).data;
  },
  async create({ userId, propertyId }) {
    if (!isMock) return (await api.post('/favorites', { propertyId })).data;
    database.update((state) => ({
      ...state,
      favorites: {
        ...state.favorites,
        [userId]: [...new Set([...(state.favorites[userId] || []), propertyId])],
      },
    }));
  },
  async remove(propertyId, userId) {
    if (!isMock) return api.delete('/favorites/' + propertyId);
    database.update((state) => ({
      ...state,
      favorites: {
        ...state.favorites,
        [userId]: (state.favorites[userId] || []).filter((id) => id !== propertyId),
      },
    }));
  },
};
