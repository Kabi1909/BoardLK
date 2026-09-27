import { syncPropertyImages } from './propertyImageService.js';
import api, { getSession } from './api.js';
import { database } from './store.js';
import { mutate, refreshRemote, loadProperty, sendRemoteMessage } from './remoteStore.js';
import { propertyToApi, propertyFromApi } from './adapters.js';
export function requestBooking(user, property, form) {
  const standard = ['1 month', '3 months', '6 months', '1 year', 'Long term'];
  return mutate('post', '/bookings', {
    propertyId: property.id,
    moveInDate: form.moveIn,
    numberOfOccupants: Number(form.occupants),
    stayDuration: standard.includes(form.duration) ? form.duration : 'Custom',
    customStayDuration: form.customDuration || form.duration,
    renterMessage: form.message,
  });
}
export function updateBooking(user, id, status, response = '') {
  return status === 'Cancelled'
    ? mutate('patch', '/bookings/' + id + '/cancel')
    : mutate('patch', '/bookings/' + id + '/status', { status, ownerResponse: response });
}
export async function startConversation(user, property, renterId) {
  const conversation = await mutate('post', '/conversations', {
    propertyId: property.id,
    ...(user.role === 'owner' ? { renterId } : {}),
  });
  return conversation._id;
}
export function sendMessage(user, id, text) {
  return sendRemoteMessage({ conversationId: id, content: text.trim() });
}
export async function addReview(user, property, rating, comment) {
  const booking = database
    .get()
    .bookings.find(
      (b) =>
        b.propertyId === property.id &&
        b.renterId === user.id &&
        b.status === 'Completed' &&
        !database.get().reviews.some((r) => r.bookingId === b.id),
    );
  if (!booking) throw new Error('Complete a stay before reviewing this property.');
  await mutate('post', '/reviews', {
    propertyId: property.id,
    bookingId: booking.id,
    rating: Number(rating),
    reviewText: comment.trim(),
  });
  await loadProperty(property.id);
}
export function manageListing(user, id, action) {
  if (action === 'delete') return mutate('delete', '/properties/' + id);
  const property = database.get().properties.find((p) => p.id === id);
  return mutate(
    'patch',
    '/properties/' + id + '/status',
    action === 'occupied'
      ? { availabilityStatus: 'Fully Occupied' }
      : { isActive: property.status !== 'Published', isDraft: false },
  );
}
export async function saveProperty(form, id) {
  const body = propertyToApi(form);
  let saved,
    selected = [...form.images];
  try {
    if (id)
      saved = (
        await api.put('/properties/' + id, {
          ...body,
          ...(form.status === 'Draft' ? { isDraft: true } : {}),
        })
      ).data.data;
    else saved = (await api.post('/properties', { ...body, isDraft: true })).data.data;
    saved = await syncPropertyImages(saved, selected, (property, images) => {
      saved = property;
      selected = [...images];
    });
    saved = (
      await api.patch('/properties/' + saved._id + '/status', {
        isDraft: form.status === 'Draft',
        isActive: form.status !== 'Disabled',
      })
    ).data.data;
    await refreshRemote();
    return propertyFromApi(saved);
  } catch (error) {
    if (saved)
      error.propertyDraft = { serverId: saved._id, imageRecords: saved.images, images: selected };
    throw error;
  }
}
