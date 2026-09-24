import { before, after, test } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import mongoose from 'mongoose';
import request from 'supertest';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import { createApp } from '../app.js';
import { connectDB } from '../config/db.js';
import { models } from '../seeds/data.js';
import User from '../models/User.js';
import Property from '../models/Property.js';
import Booking from '../models/Booking.js';
import Notification from '../models/Notification.js';
import Favorite from '../models/Favorite.js';
let mongo,
  app,
  owner,
  otherOwner,
  renter,
  otherRenter,
  property,
  booking,
  conversation,
  review,
  resetUrl;
const password = 'TestingBoardLK123!';
const env = {
  nodeEnv: 'test',
  jwtSecret: crypto.randomBytes(48).toString('hex'),
  jwtExpiresIn: '1h',
  origins: ['http://localhost:5173'],
  trustProxy: 0,
};
const png = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=',
  'base64',
);
const api = (method, path, user) => {
  const call = request(app)[method]('/api' + path);
  return user ? call.set('Authorization', 'Bearer ' + user.token) : call;
};
async function register(name, role) {
  const result = await api('post', '/auth/register').send({
    name,
    email: name.replaceAll(' ', '').toLowerCase() + '@boardlk.test',
    phone: '0771234567',
    password,
    confirmPassword: password,
    role,
  });
  assert.equal(result.status, 201, JSON.stringify(result.body));
  return result.body.data;
}
before(async () => {
  process.env.NODE_ENV = 'test';
  process.env.BCRYPT_SALT_ROUNDS = '4';
  mongo = await MongoMemoryReplSet.create({ replSet: { count: 1, storageEngine: 'wiredTiger' } });
  await connectDB(mongo.getUri('boardlk_test'));
  await Promise.all(models.map((m) => m.init()));
  app = createApp(env, {
    sendResetEmail: async (data) => {
      resetUrl = data.url;
    },
    imageStorage: {
      upload: async () => ({
        url: 'https://res.cloudinary.com/test/image/upload/' + crypto.randomUUID() + '.png',
        publicId: 'boardlk/test/' + crypto.randomUUID(),
      }),
      remove: async () => {},
    },
  });
  owner = await register('First Owner', 'owner');
  otherOwner = await register('Second Owner', 'owner');
  renter = await register('First Renter', 'renter');
  otherRenter = await register('Second Renter', 'renter');
});
after(async () => {
  await mongoose.disconnect();
  await mongo?.stop();
});
test('health, CORS, missing and invalid authentication', async () => {
  assert.equal((await api('get', '/health')).body.status, 'healthy');
  assert.equal((await api('get', '/auth/me')).status, 401);
  assert.equal((await api('get', '/auth/me').set('Authorization', 'Bearer invalid')).status, 401);
  assert.equal(
    (await api('get', '/health').set('Origin', 'https://untrusted.example')).status,
    403,
  );
});
test('registration rejects unsupported roles and duplicate accounts', async () => {
  assert.equal(
    (
      await api('post', '/auth/register').send({
        name: 'Wrong Role',
        email: 'wrong@boardlk.test',
        phone: '0771234567',
        password,
        confirmPassword: password,
        role: 'unsupported',
      })
    ).status,
    422,
  );
  assert.equal(
    (
      await api('post', '/auth/register').send({
        name: 'First Owner',
        email: owner.user.email,
        phone: '0771234567',
        password,
        confirmPassword: password,
        role: 'owner',
      })
    ).status,
    409,
  );
});
test('login, safe user response and password hashing', async () => {
  const result = await api('post', '/auth/login').send({ email: owner.user.email, password });
  assert.equal(result.status, 200);
  assert.ok(result.body.data.token);
  assert.equal(result.body.data.user.password, undefined);
  assert.equal(
    (await api('post', '/auth/login').send({ email: owner.user.email, password: 'wrong' })).status,
    401,
  );
  const user = await User.findById(owner.user._id).select('+password');
  assert.notEqual(user.password, password);
  assert.ok(user.password.startsWith('$2'));
});
test('profiles are private and role restricted', async () => {
  assert.equal((await api('get', '/owner/profile', renter)).status, 403);
  assert.equal(
    (
      await api('put', '/owner/profile', owner).send({
        nic: '200012345678',
        address: 'Private address',
      })
    ).status,
    200,
  );
  const result = await api('put', '/renter/profile', renter).send({
    preferredDistrict: 'Vavuniya',
    preferredCity: 'Vavuniya',
    monthlyBudget: 20000,
    preferredRoomType: 'Single',
  });
  assert.equal(result.status, 200);
  assert.equal((await api('put', '/renter/profile', renter).send({ role: 'owner' })).status, 422);
});
test('only owners create drafts; incomplete publishing is rejected', async () => {
  assert.equal(
    (await api('post', '/properties', renter).send({ title: 'Example property' })).status,
    403,
  );
  const result = await api('post', '/properties', owner).send({
    title: 'Vavuniya Student Residence',
  });
  assert.equal(result.status, 201, JSON.stringify(result.body));
  property = result.body.data;
  assert.equal((await api('get', '/properties/' + property._id)).status, 404);
  assert.equal(
    (await api('patch', '/properties/' + property._id + '/status', owner).send({ isDraft: false }))
      .status,
    422,
  );
});
test('cross-owner updates, deletes, status and upload access are forbidden', async () => {
  for (const [method, path, body] of [
    ['put', '', { title: 'Stolen listing' }],
    ['delete', '', {}],
    ['patch', '/status', { isActive: false }],
    ['delete', '/images/' + new mongoose.Types.ObjectId(), {}],
  ]) {
    assert.equal(
      (await api(method, '/properties/' + property._id + path, otherOwner).send(body)).status,
      403,
    );
  }
  assert.equal(
    (
      await api('post', '/properties/' + property._id + '/images', otherOwner).attach(
        'images',
        png,
        { filename: 'room.png', contentType: 'image/png' },
      )
    ).status,
    403,
  );
});
test('upload validation, cover selection and publication', async () => {
  const base = '/properties/' + property._id;
  assert.equal(
    (
      await api('post', base + '/images', owner).attach('images', Buffer.from('bad'), {
        filename: 'fake.png',
        contentType: 'image/png',
      })
    ).status,
    422,
  );
  const upload = await api('post', base + '/images', owner)
    .attach('images', png, { filename: 'room.png', contentType: 'image/png' })
    .attach('images', png, { filename: 'other.png', contentType: 'image/png' });
  assert.equal(upload.status, 201, JSON.stringify(upload.body));
  assert.equal(
    (await api('patch', base + '/cover', owner).send({ imageId: upload.body.data.images[1]._id }))
      .status,
    200,
  );
  const result = await api('put', base, owner).send({
    description:
      'Comfortable student accommodation near the university with fast Wi-Fi and a peaceful study area.',
    propertyType: 'Boarding House',
    district: 'Vavuniya',
    city: 'Vavuniya',
    address: '123 Private Lane',
    latitude: 8.7542,
    longitude: 80.4982,
    nearbyUniversityOrWorkplace: 'University of Vavuniya',
    roomType: 'Single',
    numberOfRooms: 2,
    maximumOccupants: 2,
    availableSpaces: 1,
    monthlyRent: 18000,
    facilities: { wifi: true, parking: false },
    isDraft: false,
  });
  assert.equal(result.status, 200, JSON.stringify(result.body));
  property = result.body.data;
});
test('search, combined filters, privacy, pagination and recently viewed', async () => {
  const result = await api(
    'get',
    '/properties?search=University%20of%20Vavuniya&district=Vavuniya&maxRent=20000&roomType=Single&wifi=true',
  );
  assert.equal(result.status, 200);
  assert.equal(result.body.data.length, 1);
  assert.equal(result.body.pagination.totalItems, 1);
  assert.equal(result.body.data[0].address, 'Vavuniya, Vavuniya');
  assert.equal(result.body.data[0].latitude, 8.75);
  assert.equal((await api('get', '/properties?maxRent=10000')).body.data.length, 0);
  assert.equal((await api('get', '/properties?wifi=false')).body.data.length, 0);
  assert.equal((await api('get', '/properties?search=%5B')).status, 200);
  assert.equal((await api('get', '/properties?minRent=bad')).status, 422);
  assert.equal((await api('get', '/properties?page=0')).status, 422);
  const detail = await api('get', '/properties/' + property._id, renter);
  assert.equal(detail.status, 200);
  assert.equal(detail.body.data.owner.email, undefined);
  assert.equal((await api('get', '/renter/recently-viewed', renter)).body.data.length, 1);
  await api('get', '/properties/' + property._id, renter);
  assert.equal((await Property.findById(property._id)).views, 1);
});
test('favorites are idempotent and user scoped', async () => {
  const path = '/favorites/' + property._id;
  assert.equal((await api('post', path, renter)).status, 200);
  assert.equal((await api('post', path, renter)).status, 200);
  assert.equal(await Favorite.countDocuments({ renter: renter.user._id }), 1);
  assert.equal((await api('get', '/favorites', otherRenter)).body.data.length, 0);
  assert.equal((await api('delete', path, renter)).status, 200);
  assert.equal((await api('get', '/favorites', renter)).body.data.length, 0);
  await api('post', path, renter);
});
test('booking creation, duplicate prevention and access control', async () => {
  const data = {
    propertyId: property._id,
    moveInDate: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
    numberOfOccupants: 1,
    stayDuration: '3 months',
    renterMessage: 'Can I visit?',
  };
  const result = await api('post', '/bookings', renter).send(data);
  assert.equal(result.status, 201, JSON.stringify(result.body));
  booking = result.body.data;
  assert.equal((await api('post', '/bookings', renter).send(data)).status, 409);
  assert.equal((await api('get', '/bookings/' + booking._id, otherRenter)).status, 403);
  assert.equal(
    (
      await api('patch', '/bookings/' + booking._id + '/status', otherOwner).send({
        status: 'Accepted',
      })
    ).status,
    403,
  );
  const second = await api('post', '/bookings', otherRenter).send(data);
  assert.equal(second.status, 201);
  const results = await Promise.all(
    [booking, second.body.data].map((b) =>
      api('patch', '/bookings/' + b._id + '/status', owner).send({ status: 'Accepted' }),
    ),
  );
  assert.deepEqual(results.map((x) => x.status).sort(), [200, 409]);
  assert.equal((await Property.findById(property._id)).availableSpaces, 0);
  const accepted = await Booking.findOne({ property: property._id, status: 'Accepted' });
  if (String(accepted.renter) !== renter.user._id) [renter, otherRenter] = [otherRenter, renter];
  booking = accepted;
  assert.equal((await api('patch', '/bookings/' + booking._id + '/cancel', renter)).status, 409);
  assert.ok(await Notification.exists({ user: renter.user._id, type: 'booking_accepted' }));
});
test('conversation membership, messages and unread state', async () => {
  const result = await api('post', '/conversations', renter).send({ propertyId: property._id });
  assert.equal(result.status, 201);
  conversation = result.body.data;
  assert.equal((await api('get', '/messages/' + conversation._id, otherRenter)).status, 403);
  const sent = await api('post', '/messages', renter).send({
    conversationId: conversation._id,
    content: 'Is the room still available?',
  });
  assert.equal(sent.status, 201);
  assert.equal((await api('get', '/conversations', owner)).body.data[0].unreadCount, 1);
  assert.equal(
    (await api('patch', '/messages/' + sent.body.data._id + '/read', renter)).status,
    403,
  );
  assert.equal(
    (await api('patch', '/conversations/' + conversation._id + '/read', owner)).status,
    200,
  );
  assert.equal((await api('get', '/conversations', owner)).body.data[0].unreadCount, 0);
  assert.equal(
    (
      await api('post', '/messages', owner).send({
        conversationId: conversation._id,
        content: 'Yes, your booking is confirmed.',
      })
    ).status,
    201,
  );
});
test('completed stay enables review and capacity restoration', async () => {
  const data = {
    propertyId: property._id,
    bookingId: String(booking._id),
    rating: 5,
    reviewText: 'Clean room and convenient location.',
  };
  assert.equal((await api('post', '/reviews', renter).send(data)).status, 403);
  assert.equal(
    (
      await api('patch', '/bookings/' + booking._id + '/status', owner).send({
        status: 'Completed',
      })
    ).status,
    200,
  );
  assert.equal((await Property.findById(property._id)).availableSpaces, 1);
  assert.equal((await api('post', '/reviews', otherRenter).send(data)).status, 403);
  const result = await api('post', '/reviews', renter).send(data);
  assert.equal(result.status, 201, JSON.stringify(result.body));
  review = result.body.data;
  assert.equal((await Property.findById(property._id)).averageRating, 5);
  assert.equal((await api('post', '/reviews', renter).send(data)).status, 409);
  assert.equal(
    (await api('post', '/reviews/' + review._id + '/reply', otherOwner).send({ reply: 'Thanks' }))
      .status,
    403,
  );
  assert.equal(
    (
      await api('post', '/reviews/' + review._id + '/reply', owner).send({
        reply: 'Thank you for your feedback.',
      })
    ).status,
    200,
  );
  assert.equal(
    (
      await api('put', '/reviews/' + review._id, renter).send({
        rating: 4,
        reviewText: 'Updated review after my stay.',
      })
    ).status,
    200,
  );
  assert.equal((await Property.findById(property._id)).averageRating, 4);
});
test('notifications and dashboards remain scoped', async () => {
  const result = await api('get', '/notifications', renter);
  assert.ok(result.body.unreadCount > 0);
  assert.equal(
    (await api('patch', '/notifications/' + result.body.data[0]._id + '/read', otherRenter)).status,
    404,
  );
  assert.equal((await api('patch', '/notifications/read-all', renter)).status, 200);
  assert.equal((await api('get', '/notifications', renter)).body.unreadCount, 0);
  const own = await api('get', '/owner/dashboard', owner);
  assert.equal(own.body.data.totalProperties, 1);
  assert.equal(own.body.data.charts.length, 6);
  assert.equal((await api('get', '/owner/dashboard', otherOwner)).body.data.totalProperties, 0);
  assert.equal((await api('get', '/renter/dashboard', renter)).status, 200);
  assert.equal((await api('get', '/recommendations', renter)).status, 200);
});
test('password reset is single use and revokes previous sessions', async () => {
  const result = await api('post', '/auth/forgot-password').send({ email: otherOwner.user.email });
  assert.equal(result.status, 200);
  assert.equal(result.body.data, null);
  const token = new URL(resetUrl).searchParams.get('token');
  const newPassword = 'NewBoardLKPassword123!';
  assert.equal(
    (
      await api('post', '/auth/reset-password/' + token).send({
        password: newPassword,
        confirmPassword: newPassword,
      })
    ).status,
    200,
  );
  assert.equal(
    (
      await api('post', '/auth/reset-password/' + token).send({
        password: newPassword,
        confirmPassword: newPassword,
      })
    ).status,
    400,
  );
  assert.equal((await api('get', '/auth/me', otherOwner)).status, 401);
  assert.equal(
    (await api('post', '/auth/login').send({ email: otherOwner.user.email, password: newPassword }))
      .status,
    200,
  );
});

test('upload size/count limits and upstream failures return controlled errors', async () => {
  const base = '/properties/' + property._id;
  assert.equal(
    (
      await api('post', base + '/images', owner).attach(
        'images',
        Buffer.alloc(5 * 1024 * 1024 + 1),
        { filename: 'large.png', contentType: 'image/png' },
      )
    ).status,
    422,
  );
  let upload = api('post', base + '/images', owner);
  for (let i = 0; i < 9; i++)
    upload = upload.attach('images', png, { filename: 'room.png', contentType: 'image/png' });
  assert.equal((await upload).status, 422);
  const adapter = app.locals.imageStorage;
  app.locals.imageStorage = {
    ...adapter,
    upload: async () => {
      const e = new Error('Image service unavailable.');
      e.statusCode = 503;
      throw e;
    },
  };
  assert.equal(
    (
      await api('post', base + '/images', owner).attach('images', png, {
        filename: 'room.png',
        contentType: 'image/png',
      })
    ).status,
    503,
  );
  app.locals.imageStorage = adapter;
  const current = await Property.findById(property._id);
  assert.equal((await api('delete', base + '/images/' + current.images[0]._id, owner)).status, 200);
  const remaining = await Property.findById(property._id);
  assert.equal(
    (await api('delete', base + '/images/' + remaining.images[0]._id, owner)).status,
    409,
  );
});
test('booking rejection and renter cancellation send the correct notifications', async () => {
  const pending = await Booking.findOne({ property: property._id, status: 'Pending' });
  assert.equal(
    (
      await api('patch', '/bookings/' + pending._id + '/status', owner).send({
        status: 'Rejected',
        ownerResponse: 'Dates are not suitable.',
      })
    ).status,
    200,
  );
  assert.ok(await Notification.exists({ user: pending.renter, type: 'booking_rejected' }));
  const body = {
    propertyId: property._id,
    moveInDate: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
    numberOfOccupants: 1,
    stayDuration: '1 month',
  };
  const result = await api('post', '/bookings', otherRenter).send(body);
  assert.equal(result.status, 201);
  assert.equal(
    (await api('patch', '/bookings/' + result.body.data._id + '/cancel', otherRenter)).status,
    200,
  );
  assert.equal(
    (
      await api('patch', '/bookings/' + result.body.data._id + '/status', owner).send({
        status: 'Accepted',
      })
    ).status,
    409,
  );
});
test('server-owned fields, invalid identifiers and negative values are rejected', async () => {
  assert.equal(
    (await api('put', '/properties/' + property._id, owner).send({ views: 1000, averageRating: 5 }))
      .status,
    422,
  );
  assert.equal(
    (await api('put', '/properties/' + property._id, owner).send({ monthlyRent: -1 })).status,
    422,
  );
  assert.equal((await api('get', '/properties/not-an-id')).status, 422);
  assert.equal(
    (
      await api('post', '/bookings', renter).send({
        propertyId: property._id,
        moveInDate: '2000-01-01',
        numberOfOccupants: -1,
        stayDuration: 'Custom',
      })
    ).status,
    422,
  );
  assert.equal((await api('get', '/unknown')).status, 404);
});
test('disabled accounts and revoked sessions cannot authenticate', async () => {
  await User.updateOne({ _id: otherRenter.user._id }, { $set: { status: 'disabled' } });
  assert.equal((await api('get', '/auth/me', otherRenter)).status, 401);
  await User.updateOne({ _id: otherRenter.user._id }, { $set: { status: 'active' } });
  assert.equal((await api('post', '/auth/logout', otherRenter)).status, 200);
  assert.equal((await api('get', '/auth/me', otherRenter)).status, 401);
});
test('unpublishing notifies favorites, deletion retains history and review removal updates rating', async () => {
  assert.equal((await api('delete', '/reviews/' + review._id, renter)).status, 200);
  assert.equal((await Property.findById(property._id)).reviewCount, 0);
  assert.equal(
    (await api('patch', '/properties/' + property._id + '/status', owner).send({ isActive: false }))
      .status,
    200,
  );
  assert.equal((await api('get', '/properties/' + property._id)).status, 404);
  assert.ok(await Notification.exists({ user: renter.user._id, type: 'property_unavailable' }));
  assert.equal((await api('delete', '/properties/' + property._id, owner)).status, 200);
  assert.ok((await Property.findById(property._id)).deletedAt);
  assert.ok(await Booking.exists({ _id: booking._id }));
});
test('expired JWTs are rejected even with a valid signature', async () => {
  const { default: jwt } = await import('jsonwebtoken');
  const token = jwt.sign({ role: 'owner', version: 0 }, env.jwtSecret, {
    subject: owner.user._id,
    expiresIn: -1,
    issuer: 'boardlk-api',
    audience: 'boardlk-client',
    algorithm: 'HS256',
  });
  assert.equal((await api('get', '/auth/me', { token })).status, 401);
});
