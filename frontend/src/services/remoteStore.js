import api, { getSession } from './api.js';
import { database } from './store.js';
import { appendDeliveredMessage } from '../utils/messages.js';
import {
  idOf,
  userFromApi,
  propertyFromApi,
  bookingFromApi,
  reviewFromApi,
  notificationFromApi,
  messageFromApi,
  profileFromApi,
} from './adapters.js';
export async function allPages(path, params = {}) {
  const items = [];
  let page = 1,
    more = true;
  while (more) {
    const { data } = await api.get(path, { params: { ...params, page, limit: 100 } });
    items.push(...data.data);
    more = Boolean(data.pagination?.hasNextPage);
    page++;
  }
  return items;
}
let refreshVersion = 0;
const merge = (items) => [...new Map(items.filter(Boolean).map((x) => [x.id, x])).values()];
export async function refreshRemote() {
  const version = ++refreshVersion;
  const session = getSession(),
    token = session?.token,
    user = session?.user;
  const publicProperties = await allPages('/properties');
  let properties = publicProperties.map(propertyFromApi),
    users = publicProperties.map((p) => (p.owner ? userFromApi(p.owner) : null)),
    bookings = [],
    reviews = [],
    conversations = [],
    notifications = [],
    favorites = {},
    recent = {},
    dashboard = null,
    profile = null;
  if (user) {
    const owner = user.role === 'owner';
    const [
      privateProperties,
      rawBookings,
      rawConversations,
      rawNotifications,
      rawFavorites,
      dash,
      prof,
      rawReviews,
    ] = await Promise.all([
      owner ? allPages('/owner/properties') : [],
      allPages(owner ? '/owner/bookings' : '/bookings/my'),
      allPages('/conversations'),
      allPages('/notifications'),
      owner ? [] : allPages('/favorites'),
      api.get('/' + user.role + '/dashboard'),
      api.get('/' + user.role + '/profile'),
      owner ? allPages('/owner/reviews') : [],
    ]);
    properties = merge([...properties, ...privateProperties.map(propertyFromApi)]);
    bookings = rawBookings.map(bookingFromApi);
    notifications = rawNotifications.map(notificationFromApi);
    reviews = rawReviews.map(reviewFromApi);
    for (const b of rawBookings) {
      if (b.property && !properties.some((p) => p.id === idOf(b.property)))
        properties.push(propertyFromApi(b.property));
      users.push(...[b.owner, b.renter].filter((x) => x?.name).map(userFromApi));
    }
    for (const r of rawReviews) if (r.renter?.name) users.push(userFromApi(r.renter));
    profile = profileFromApi(prof.data.data);
    users.push(profile);
    dashboard = dash.data.data;
    favorites[user.id] = rawFavorites.filter((f) => f.property).map((f) => idOf(f.property));
    recent[user.id] = (dashboard.recentlyViewed || []).map((x) => idOf(x.property));
    conversations = await Promise.all(
      rawConversations.map(async (c) => {
        users.push(...[c.renter, c.owner].filter((x) => x?.name).map(userFromApi));
        if (c.property && !properties.some((p) => p.id === idOf(c.property)))
          properties.push(propertyFromApi(c.property));
        const messages = (await allPages('/messages/' + c._id))
          .map(messageFromApi)
          .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        return {
          ...c,
          id: c._id,
          renterId: idOf(c.renter),
          ownerId: idOf(c.owner),
          propertyId: idOf(c.property),
          messages,
          readBy: c.unreadCount ? [] : [user.id],
        };
      }),
    );
  }
  // A response from a previous account must never replace the current account's cache.
  if (getSession()?.token !== token || version !== refreshVersion) return;
  database.replace({
    properties: merge(properties),
    users: merge([...database.get().users, ...users]),
    bookings,
    reviews: merge([...database.get().reviews, ...reviews]),
    conversations,
    notifications,
    favorites,
    recent,
    dashboard,
    profile,
  });
}
export async function loadProperty(id) {
  const token = getSession()?.token;
  const [{ data }, reviews] = await Promise.all([
    api.get('/properties/' + id),
    allPages('/reviews/property/' + id).catch((error) => {
      if (error.status === 404) return [];
      throw error;
    }),
  ]);
  if (getSession()?.token !== token) return;
  const p = propertyFromApi(data.data);
  database.update((s) => ({
    ...s,
    properties: merge([...s.properties, p]),
    users: merge([
      ...s.users,
      ...(data.data.owner?.name ? [userFromApi(data.data.owner)] : []),
      ...reviews.filter((r) => r.renter?.name).map((r) => userFromApi(r.renter)),
    ]),
    reviews: merge([
      ...s.reviews.filter((r) => r.propertyId !== id),
      ...reviews.map(reviewFromApi),
    ]),
  }));
  return p;
}
export async function mutate(method, path, body) {
  const response = await api[method](path, body);
  try {
    await refreshRemote();
  } catch (error) {
    window.dispatchEvent(
      new CustomEvent('boardlk-api-error', {
        detail: 'Your change was saved, but the updated data could not be loaded. ' + error.message,
      }),
    );
  }
  return response.data.data;
}
export async function sendRemoteMessage(body) {
  const token = getSession()?.token;
  const response = await api.post('/messages', body);
  if (getSession()?.token !== token) return response.data.data;
  const message = messageFromApi(response.data.data);
  database.update((state) => ({
    ...state,
    conversations: state.conversations.map((conversation) =>
      conversation.id === body.conversationId
        ? appendDeliveredMessage(conversation, message)
        : conversation,
    ),
  }));
  // The saved message is already visible; refreshing other data must not delay sending.
  void refreshRemote().catch((error) => {
    if (getSession()?.token === token)
      window.dispatchEvent(
        new CustomEvent('boardlk-api-error', {
          detail: 'Message sent. Other updates could not be loaded: ' + error.message,
        }),
      );
  });
  return response.data.data;
}
export async function markConversationRead(id) {
  const token = getSession()?.token;
  const readThrough = database
    .get()
    .conversations.find((c) => c.id === id)
    ?.messages.at(-1)?.id;
  await api.patch('/conversations/' + id + '/read');
  const user = getSession()?.user;
  if (!user || getSession()?.token !== token) return;
  database.update((s) => ({
    ...s,
    conversations: s.conversations.map((c) =>
      c.id === id && c.messages.at(-1)?.id === readThrough
        ? { ...c, readBy: [user.id], unreadCount: 0 }
        : c,
    ),
  }));
}
