// A memory-only cache of API responses. MongoDB is the source of truth.
const empty = () => ({
  properties: [],
  users: [],
  bookings: [],
  reviews: [],
  conversations: [],
  notifications: [],
  favorites: {},
  recent: {},
  dashboard: null,
  profile: null,
});
let state = empty();
const listeners = new Set();
export const database = {
  get: () => state,
  subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  replace(next) {
    state = next;
    listeners.forEach((listener) => listener());
  },
  update(updater) {
    state = updater(state);
    listeners.forEach((listener) => listener());
    return state;
  },
  clear() {
    this.replace(empty());
  },
};
