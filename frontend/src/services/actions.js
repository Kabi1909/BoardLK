import { database } from './store.js';
import { uid } from '../utils/format.js';
const note = (userId, title, body, path) => ({
  id: uid(),
  userId,
  title,
  body,
  path,
  read: false,
  createdAt: new Date().toISOString(),
});
export function requestBooking(user, property, form) {
  if (user.role !== 'renter') throw new Error('Only renters can request bookings.');
  database.update((s) => {
    const p = s.properties.find((p) => p.id === property.id);
    if (!p || p.status !== 'Published' || p.spaces < Number(form.occupants))
      throw new Error('This property no longer has enough available spaces.');
    if (
      s.bookings.some(
        (b) =>
          b.renterId === user.id &&
          b.propertyId === p.id &&
          ['Pending', 'Accepted'].includes(b.status),
      )
    )
      throw new Error('You already have an active request for this property.');
    return {
      ...s,
      bookings: [
        {
          ...form,
          occupants: Number(form.occupants),
          id: uid(),
          propertyId: p.id,
          ownerId: p.ownerId,
          renterId: user.id,
          status: 'Pending',
          createdAt: new Date().toISOString(),
          response: '',
        },
        ...s.bookings,
      ],
      notifications: [
        note(
          p.ownerId,
          'New booking request',
          user.name + ' requested a stay at ' + p.title,
          '/owner/bookings',
        ),
        ...s.notifications,
      ],
    };
  });
}
export function updateBooking(user, id, status, response = '') {
  database.update((s) => {
    const b = s.bookings.find((b) => b.id === id);
    if (!b || b.status !== 'Pending') throw new Error('Only pending requests can be changed.');
    if (
      user.role === 'renter'
        ? b.renterId !== user.id || status !== 'Cancelled'
        : b.ownerId !== user.id || !['Accepted', 'Rejected'].includes(status)
    )
      throw new Error('You cannot change this request.');
    const p = s.properties.find((p) => p.id === b.propertyId);
    if (status === 'Accepted' && (!p || p.status !== 'Published' || p.spaces < b.occupants))
      throw new Error('Not enough available spaces to accept this booking.');
    return {
      ...s,
      properties:
        status === 'Accepted'
          ? s.properties.map((p) =>
              p.id === b.propertyId ? { ...p, spaces: p.spaces - b.occupants } : p,
            )
          : s.properties,
      bookings: s.bookings.map((x) => (x.id === id ? { ...x, status, response } : x)),
      notifications: [
        note(
          user.role === 'owner' ? b.renterId : b.ownerId,
          'Booking ' + status.toLowerCase(),
          response || 'A booking request has been ' + status.toLowerCase() + '.',
          user.role === 'owner' ? '/renter/bookings' : '/owner/bookings',
        ),
        ...s.notifications,
      ],
    };
  });
}
export function startConversation(user, property, renterId) {
  const renter = user.role === 'renter' ? user.id : renterId;
  const existing = database
    .get()
    .conversations.find(
      (c) =>
        c.propertyId === property.id && c.renterId === renter && c.ownerId === property.ownerId,
    );
  if (existing) return existing.id;
  const id = uid();
  database.update((s) => ({
    ...s,
    conversations: [
      {
        id,
        propertyId: property.id,
        renterId: renter,
        ownerId: property.ownerId,
        readBy: [user.id],
        messages: [],
      },
      ...s.conversations,
    ],
  }));
  return id;
}
export function sendMessage(user, id, text) {
  if (!text.trim()) return;
  database.update((s) => {
    const c = s.conversations.find((c) => c.id === id);
    if (!c || ![c.renterId, c.ownerId].includes(user.id))
      throw new Error('Conversation unavailable.');
    const recipient = user.id === c.renterId ? c.ownerId : c.renterId;
    return {
      ...s,
      conversations: s.conversations.map((c) =>
        c.id === id
          ? {
              ...c,
              readBy: [user.id],
              messages: [
                ...c.messages,
                {
                  id: uid(),
                  senderId: user.id,
                  text: text.trim(),
                  createdAt: new Date().toISOString(),
                },
              ],
            }
          : c,
      ),
      notifications: [
        note(
          recipient,
          'New message from ' + user.name,
          text.trim().slice(0, 100),
          '/' + (user.role === 'owner' ? 'renter' : 'owner') + '/messages?conversation=' + id,
        ),
        ...s.notifications,
      ],
    };
  });
}
export function addReview(user, property, rating, comment) {
  if (user.role !== 'renter') throw new Error('Only renters can review properties.');
  database.update((s) => {
    if (s.reviews.some((r) => r.renterId === user.id && r.propertyId === property.id))
      throw new Error('You have already reviewed this property.');
    const reviews = [
      {
        id: uid(),
        renterId: user.id,
        propertyId: property.id,
        rating: Number(rating),
        comment: comment.trim(),
        createdAt: new Date().toISOString(),
        reply: '',
      },
      ...s.reviews,
    ];
    const own = reviews.filter((r) => r.propertyId === property.id);
    return {
      ...s,
      reviews,
      properties: s.properties.map((p) =>
        p.id === property.id
          ? { ...p, rating: own.reduce((a, r) => a + r.rating, 0) / own.length }
          : p,
      ),
      notifications: [
        note(
          property.ownerId,
          'New property review',
          user.name + ' reviewed ' + property.title,
          '/owner/reviews',
        ),
        ...s.notifications,
      ],
    };
  });
}

