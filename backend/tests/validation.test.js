import { test } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import Property from '../models/Property.js';
import Booking from '../models/Booking.js';
import Review from '../models/Review.js';
import { buildPropertyQuery } from '../services/propertyService.js';
import { pagination } from '../utils/pagination.js';
import { sriLankaDate } from '../utils/date.js';
import { health, live, ready } from '../controllers/healthController.js';

test('search rejects unsupported enums, repeated numeric values and inverted prices', () => {
  for (const query of [
    { district: 'Unknown' },
    { roomType: 'Quad' },
    { minRent: ['100'] },
    { maxRent: true },
    { minRating: 6 },
    { minRent: 200, maxRent: 100 },
    { wifi: 'yes' },
  ]) {
    assert.throws(() => buildPropertyQuery(query));
  }
  const query = buildPropertyQuery({
    search: 'University (Vavuniya)',
    roomType: 'Single',
    maxRent: '20000',
    wifi: 'true',
  });
  assert.equal(query.monthlyRent.$lte, 20000);
  assert.equal(query['facilities.wifi'], true);
  const expression = new RegExp(query.$or[0].title.$regex, 'i');
  assert.ok(expression.test('University (Vavuniya)'));
  assert.ok(!expression.test('University Vavuniya'));
});

test('pagination rejects ambiguous inputs and enforces bounds', () => {
  for (const query of [
    { page: ['1'] },
    { limit: true },
    { page: null },
    { page: 0 },
    { limit: 101 },
    { page: ' ' },
    { page: '1.5' },
  ])
    assert.throws(() => pagination(query));
  assert.deepEqual(pagination({ page: '2', limit: '9' }), { page: 2, limit: 9, skip: 9 });
});

test('models reject impossible capacity, images and fractional domain counts', async () => {
  const owner = new mongoose.Types.ObjectId();
  for (const values of [
    { maximumOccupants: 2, availableSpaces: 3 },
    { numberOfRooms: 1.5 },
    { averageRating: 6 },
    { reviewCount: -1 },
    { coverImage: 'https://example.com/missing.png' },
    { images: Array.from({ length: 9 }, () => ({ url: 'https://example.com/image.png' })) },
  ]) {
    await assert.rejects(
      new Property({ owner, title: 'Validation property', ...values }).validate(),
    );
  }
  await new Property({
    owner,
    title: 'Valid draft',
    maximumOccupants: 2,
    availableSpaces: 2,
  }).validate();
  const booking = new Booking({
    owner,
    renter: owner,
    property: owner,
    moveInDate: new Date(),
    stayDuration: '1 month',
    numberOfOccupants: 1.5,
  });
  assert.ok(booking.validateSync().errors.numberOfOccupants);
  const review = new Review({
    owner,
    renter: owner,
    property: owner,
    booking: owner,
    reviewText: 'A comfortable room.',
    rating: 4.5,
  });
  assert.ok(review.validateSync().errors.rating);
});

test('Sri Lankan calendar rolls over at 18:30 UTC including year boundaries', () => {
  assert.equal(sriLankaDate(new Date('2026-12-31T18:29:59Z')), '2026-12-31');
  assert.equal(sriLankaDate(new Date('2026-12-31T18:30:00Z')), '2027-01-01');
});

test('disconnected database fails readiness while process remains live', async () => {
  const response = () => ({
    code: 200,
    status(code) {
      this.code = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  });
  const h = response(),
    r = response(),
    l = response();
  health({}, h);
  await ready({}, r);
  live({}, l);
  assert.equal(h.code, 503);
  assert.equal(r.code, 503);
  assert.equal(l.code, 200);
  assert.equal(l.body.status, 'alive');
});
