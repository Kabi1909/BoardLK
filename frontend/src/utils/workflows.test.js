import test, { beforeEach } from 'node:test';
import assert from 'node:assert/strict';
const storage = new Map();
globalThis.localStorage = {
  getItem: (key) => storage.get(key) || null,
  setItem: (key, value) => storage.set(key, value),
};
const { database } = await import('../services/store.js');
const { requestBooking, updateBooking, startConversation, sendMessage, addReview } =
  await import('../services/actions.js');
const initial = structuredClone(database.get());
beforeEach(() => database.update(() => structuredClone(initial)));
const renter = initial.users.find((u) => u.id === 'r10');
const property = initial.properties.find((p) => p.id === 'p3');
const owner = initial.users.find((u) => u.id === property.ownerId);
const form = {
  moveIn: '2099-10-10',
  occupants: 1,
  duration: '6 months',
  message: 'I would like to arrange a viewing.',
};

test('booking creates a persistent pending request and owner notification', () => {
  requestBooking(renter, property, form);
  assert.equal(database.get().bookings[0].status, 'Pending');
  assert.equal(database.get().notifications[0].userId, owner.id);
  assert.equal(JSON.parse(storage.get('boardlk-data-v1')).bookings[0].renterId, renter.id);
  assert.throws(() => requestBooking(renter, property, form), /active request/);
});
test('booking rejects invalid occupants and past dates at the service boundary', () => {
  assert.throws(() => requestBooking(renter, property, { ...form, occupants: -1 }), /occupants/);
  assert.throws(
    () => requestBooking(renter, property, { ...form, moveIn: '2000-01-01' }),
    /future/,
  );
});
test('acceptance reserves spaces once and prevents unrelated owner updates', () => {
  requestBooking(renter, property, form);
  const id = database.get().bookings[0].id;
  assert.throws(() => updateBooking({ id: 'o1', role: 'owner' }, id, 'Accepted'), /cannot change/);
  updateBooking(owner, id, 'Accepted', 'Welcome!');
  assert.equal(
    database.get().properties.find((p) => p.id === property.id).spaces,
    property.spaces - 1,
  );
  assert.equal(database.get().notifications[0].userId, renter.id);
  assert.throws(() => updateBooking(owner, id, 'Accepted'), /pending requests/);
});
test('overbooking is rejected without changing the request', () => {
  requestBooking(renter, property, form);
  const id = database.get().bookings[0].id;
  database.update((s) => ({
    ...s,
    properties: s.properties.map((p) => (p.id === property.id ? { ...p, spaces: 0 } : p)),
  }));
  assert.throws(() => updateBooking(owner, id, 'Accepted'), /Not enough/);
  assert.equal(database.get().bookings[0].status, 'Pending');
});
test('only the requesting renter may cancel a pending request', () => {
  requestBooking(renter, property, form);
  const id = database.get().bookings[0].id;
  assert.throws(
    () => updateBooking({ id: 'r1', role: 'renter' }, id, 'Cancelled'),
    /cannot change/,
  );
  updateBooking(renter, id, 'Cancelled');
  assert.equal(database.get().bookings[0].status, 'Cancelled');
  assert.throws(() => updateBooking(renter, id, 'Cancelled'), /pending requests/);
});
test('rejection preserves availability', () => {
  requestBooking(renter, property, form);
  updateBooking(owner, database.get().bookings[0].id, 'Rejected', 'Dates do not suit.');
  assert.equal(database.get().bookings[0].status, 'Rejected');
  assert.equal(database.get().properties.find((p) => p.id === property.id).spaces, property.spaces);
});
test('conversations are reused and messages are restricted to participants', () => {
  const id = startConversation(renter, property);
  assert.equal(startConversation(renter, property), id);
  sendMessage(renter, id, 'Can I visit this weekend?');
  sendMessage(owner, id, 'Saturday morning works.');
  const conversation = database.get().conversations.find((c) => c.id === id);
  assert.equal(conversation.messages.length, 2);
  assert.deepEqual(conversation.readBy, [owner.id]);
  assert.equal(database.get().notifications[0].userId, renter.id);
  assert.throws(() => sendMessage({ id: 'stranger' }, id, 'Not allowed'), /unavailable/);
});
test('reviews update ratings and reject duplicates', () => {
  addReview(renter, property, 4, 'Comfortable rooms in a convenient location.');
  const reviews = database.get().reviews.filter((r) => r.propertyId === property.id);
  assert.equal(
    database.get().properties.find((p) => p.id === property.id).rating,
    reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length,
  );
  assert.throws(() => addReview(renter, property, 5, 'A second review.'), /already reviewed/);
});
