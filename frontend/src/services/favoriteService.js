import { allPages, mutate } from './remoteStore.js';
export const favoriteService = {
  async list() {
    return (await allPages('/favorites')).filter((x) => x.property).map((x) => x.property._id);
  },
  create: ({ propertyId }) => mutate('post', '/favorites/' + propertyId),
  remove: (propertyId) => mutate('delete', '/favorites/' + propertyId),
};
