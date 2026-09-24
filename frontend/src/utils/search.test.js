import test from 'node:test';
import assert from 'node:assert/strict';
import { districts, cities } from '../data/locations.js';
import { emailValid, phoneValid, passwordValid, validateProperty } from './validation.js';
import {
  propertyFromApi,
  propertyToApi,
  bookingFromApi,
  facilityNames,
} from '../services/adapters.js';
test('location options include all 25 districts with cities', () => {
  assert.equal(districts.length, 25);
  for (const district of districts) assert.ok(cities[district].length);
});
test('API adapters preserve identity, coordinates and facilities', () => {
  const p = propertyFromApi({
    _id: 'property-id',
    owner: { _id: 'owner-id' },
    monthlyRent: 18000,
    latitude: 8.75,
    longitude: 80.5,
    availableSpaces: 2,
    images: [{ url: '/a.jpg' }, { url: '/b.jpg' }],
    coverImage: '/b.jpg',
    facilities: { wifi: true, parking: false },
    isDraft: false,
    isActive: true,
  });
  assert.equal(p.id, 'property-id');
  assert.equal(p.ownerId, 'owner-id');
  assert.equal(p.rent, 18000);
  assert.deepEqual(p.images, ['/b.jpg', '/a.jpg']);
  assert.deepEqual(p.facilities, ['Wi-Fi']);
  assert.equal(p.status, 'Published');
});
test('write adapter excludes server-owned fields', () => {
  const body = propertyToApi({
    title: 'Valid title',
    facilities: ['Wi-Fi'],
    views: 500,
    rating: 5,
    ownerId: 'other-owner',
    rent: '18000',
    spaces: 2,
    capacity: 3,
  });
  assert.equal(body.monthlyRent, 18000);
  assert.equal(body.facilities.wifi, true);
  for (const key of ['views', 'averageRating', 'owner', 'ownerId', 'rating'])
    assert.equal(body[key], undefined);
  assert.equal(Object.keys(body.facilities).length, Object.keys(facilityNames).length);
});
test('booking adapter preserves custom stay and status', () => {
  const value = bookingFromApi({
    _id: 'booking-id',
    property: 'property-id',
    renter: 'renter-id',
    owner: 'owner-id',
    moveInDate: '2026-10-01T00:00:00.000Z',
    numberOfOccupants: 2,
    stayDuration: 'Custom',
    customStayDuration: '8 weeks',
    status: 'Accepted',
  });
  assert.equal(value.duration, '8 weeks');
  assert.equal(value.moveIn, '2026-10-01');
  assert.equal(value.occupants, 2);
  assert.equal(value.status, 'Accepted');
});
test('client validation rejects invalid contact and property values', () => {
  assert.ok(emailValid('student@example.com'));
  assert.equal(emailValid('invalid@'), false);
  assert.ok(phoneValid('+94771234567'));
  assert.equal(phoneValid('12345'), false);
  assert.ok(passwordValid('ExamplePassword123'));
  assert.equal(passwordValid('password'), false);
  assert.ok(validateProperty({ spaces: 9, capacity: 8, rooms: 1 }, 2).spaces);
  assert.ok(validateProperty({ rent: -10 }, 3).rent);
});
