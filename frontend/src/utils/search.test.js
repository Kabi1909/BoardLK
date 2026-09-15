import test from 'node:test';
import assert from 'node:assert/strict';
import {
  properties,
  owners,
  renters,
  bookings,
  reviews,
  conversations,
  notifications,
} from '../data/mockData.js';
import { districts, cities } from '../data/locations.js';
import { filterProperties } from './search.js';
import { emailValid, phoneValid, passwordValid, validateProperty } from './validation.js';

test('fixtures cover all requested roles, entities and districts', () => {
  assert.equal(districts.length, 25);
  for (const district of districts) assert.ok(cities[district].length);
  assert.ok(properties.length >= 20 && owners.length >= 5 && renters.length >= 10);
  assert.ok(
    bookings.length >= 12 &&
      reviews.length >= 20 &&
      conversations.length >= 8 &&
      notifications.length >= 20,
  );
  assert.deepEqual([...new Set([...owners, ...renters].map((user) => user.role))].sort(), [
    'owner',
    'renter',
  ]);
});
test('Vavuniya, Rs. 20,000, Single and Wi-Fi filters combine correctly', () => {
  const result = filterProperties(properties, {
    q: 'Vavuniya',
    max: '20000',
    roomType: 'Single',
    facilities: 'Wi-Fi',
  });
  assert.ok(result.length);
  assert.ok(
    result.every(
      (p) =>
        p.city === 'Vavuniya' &&
        p.rent <= 20000 &&
        p.roomType === 'Single' &&
        p.facilities.includes('Wi-Fi'),
    ),
  );
});
test('search finds nearby universities regardless of letter case', () => {
  for (const university of [
    'University of Vavuniya',
    'University of Colombo',
    'University of Jaffna',
    'University of Peradeniya',
  ]) {
    const result = filterProperties(properties, { q: university.toLowerCase() });
    assert.ok(result.length);
    assert.ok(result.every((p) => p.nearby === university));
  }
});
test('all categories, budgets, ratings and facilities are intersected', () => {
  const p = properties[0];
  const result = filterProperties(properties, {
    district: p.district,
    city: p.city,
    type: p.type,
    roomType: p.roomType,
    gender: p.gender,
    min: p.rent,
    max: p.rent,
    rating: p.rating,
    available: 'true',
    facilities: p.facilities.join(','),
  });
  assert.ok(result.some((item) => item.id === p.id));
  assert.ok(result.every((item) => item.spaces > 0 && item.rent === p.rent));
  assert.equal(filterProperties(properties, { facilities: 'Nonexistent facility' }).length, 0);
});
test('all sorting modes order results without mutating the source', () => {
  const before = properties.map((p) => p.id);
  for (const [sort, value, direction] of [
    ['price-asc', (p) => p.rent, 1],
    ['price-desc', (p) => p.rent, -1],
    ['rating', (p) => p.rating, -1],
    ['popular', (p) => p.views, -1],
    ['latest', (p) => new Date(p.createdAt).getTime(), -1],
  ]) {
    const sorted = filterProperties(properties, { sort });
    for (let i = 1; i < sorted.length; i++)
      assert.ok((value(sorted[i]) - value(sorted[i - 1])) * direction >= 0);
  }
  assert.deepEqual(
    properties.map((p) => p.id),
    before,
  );
});
test('draft and disabled listings are excluded from public search', () => {
  assert.equal(
    filterProperties([
      { ...properties[0], status: 'Draft' },
      { ...properties[1], status: 'Disabled' },
    ]).length,
    0,
  );
});
test('email, local phone and password validation enforce expected formats', () => {
  assert.ok(emailValid('student@example.com'));
  assert.equal(emailValid('invalid@'), false);
  assert.ok(phoneValid('+94771234567'));
  assert.ok(phoneValid('077 123 4567'));
  assert.equal(phoneValid('12345'), false);
  assert.ok(passwordValid('BoardLK123'));
  assert.equal(passwordValid('password'), false);
});
test('property validation catches invalid coordinates, capacity, rent and photos', () => {
  const p = properties[0];
  assert.ok(validateProperty({ ...p, title: 'x', description: 'short' }, 0).title);
  assert.ok(validateProperty({ ...p, lat: 0, lng: 0 }, 1).lat);
  assert.ok(validateProperty({ ...p, spaces: 9, capacity: 8 }, 2).spaces);
  assert.ok(validateProperty({ ...p, rooms: 1.5 }, 2).rooms);
  assert.ok(validateProperty({ ...p, rent: -10 }, 3).rent);
  assert.ok(validateProperty({ ...p, images: [] }, 6).images);
  for (let step = 0; step < 7; step++) assert.deepEqual(validateProperty(p, step), {});
});
