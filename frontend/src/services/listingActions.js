import { database } from './store.js';
import { uid } from '../utils/format.js';
import { validateProperty } from '../utils/validation.js';

export function manageListing(user, propertyId, action) {
  database.update((state) => {
    const property = state.properties.find((p) => p.id === propertyId);
    if (user.role !== 'owner' || property?.ownerId !== user.id)
      throw new Error('Only the property owner can change this listing.');
    if (
      action === 'delete' &&
      state.bookings.some((b) => b.propertyId === propertyId && b.status === 'Accepted')
    ) {
      throw new Error('This property has an accepted booking. Disable the listing instead.');
    }
    const publishing = action === 'toggle' && property.status !== 'Published';
    if (publishing) {
      for (let step = 0; step < 7; step++) {
        const errors = validateProperty(property, step);
        if (Object.keys(errors).length)
          throw new Error('Edit this property before publishing: ' + Object.values(errors)[0]);
      }
    }
    const unavailable =
      action === 'delete' ||
      action === 'occupied' ||
      (action === 'toggle' && property.status === 'Published');
    const recipients = new Set([
      ...state.bookings
        .filter((b) => b.propertyId === propertyId && ['Pending', 'Accepted'].includes(b.status))
        .map((b) => b.renterId),
      ...Object.entries(state.favorites)
        .filter(([, ids]) => ids.includes(propertyId))
        .map(([id]) => id),
    ]);
    const alerts = unavailable
      ? [...recipients].map((userId) => ({
          id: uid(),
          userId,
          title: 'Property unavailable',
          body: property.title + ' is no longer accepting new bookings.',
          path: '/renter/bookings',
          read: false,
          createdAt: new Date().toISOString(),
        }))
      : [];
    return {
      ...state,
      properties:
        action === 'delete'
          ? state.properties.filter((p) => p.id !== propertyId)
          : state.properties.map((p) =>
              p.id !== propertyId
                ? p
                : {
                    ...p,
                    ...(action === 'occupied'
                      ? { spaces: 0 }
                      : { status: publishing ? 'Published' : 'Disabled' }),
                  },
            ),
      bookings:
        action === 'delete'
          ? state.bookings.map((b) =>
              b.propertyId === propertyId && b.status === 'Pending'
                ? { ...b, status: 'Cancelled', response: 'The owner removed this listing.' }
                : b,
            )
          : state.bookings,
      favorites:
        action === 'delete'
          ? Object.fromEntries(
              Object.entries(state.favorites).map(([id, ids]) => [
                id,
                ids.filter((id) => id !== propertyId),
              ]),
            )
          : state.favorites,
      notifications: [...alerts, ...state.notifications],
    };
  });
}
