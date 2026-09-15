import test, { beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { getSession, saveSession, clearSession, SESSION_KEY } from '../services/session.js';
function mockStorage() {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) || null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  };
}
beforeEach(() => {
  globalThis.localStorage = mockStorage();
  globalThis.sessionStorage = mockStorage();
});
const session = { token: 'mock-token', user: { id: 'r1', name: 'Demo Renter', role: 'renter' } };
test('remember me selects local storage and clears the session copy', () => {
  saveSession(session, false);
  saveSession(session, true);
  assert.equal(sessionStorage.getItem(SESSION_KEY), null);
  assert.deepEqual(getSession(), session);
  assert.ok(localStorage.getItem(SESSION_KEY));
});
test('unchecked remember me uses only session storage', () => {
  saveSession(session, true);
  saveSession(session, false);
  assert.equal(localStorage.getItem(SESSION_KEY), null);
  assert.ok(sessionStorage.getItem(SESSION_KEY));
});
test('logout clears both storage locations', () => {
  saveSession(session, true);
  clearSession();
  assert.equal(getSession(), null);
});
test('corrupt sessions and unsupported roles are rejected', () => {
  localStorage.setItem(SESSION_KEY, '{broken');
  assert.equal(getSession(), null);
  localStorage.setItem(
    SESSION_KEY,
    JSON.stringify({ ...session, user: { id: 'x', role: 'unsupported' } }),
  );
  assert.equal(getSession(), null);
});
