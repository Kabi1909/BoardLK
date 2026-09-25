import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sriLankaDate } from './date.js';

test('booking date uses Sri Lankan midnight independently of browser timezone', () => {
  assert.equal(sriLankaDate(new Date('2026-12-31T18:29:59Z')), '2026-12-31');
  assert.equal(sriLankaDate(new Date('2026-12-31T18:30:00Z')), '2027-01-01');
});
