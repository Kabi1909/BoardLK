import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readEnv } from '../config/env.js';
test('environment validation rejects unsafe origins and invalid token configuration', () => {
  const snapshot = { ...process.env };
  try {
    Object.assign(process.env, {
      NODE_ENV: 'test',
      MONGO_URI: 'mongodb://127.0.0.1/boardlk_test',
      JWT_SECRET: 'x'.repeat(48),
      FRONTEND_URL: 'http://localhost:5173',
      JWT_EXPIRES_IN: '1h',
    });
    assert.deepEqual(readEnv().origins, ['http://localhost:5173']);
    for (const origin of [
      '*',
      'http://localhost:5173/path',
      'https://user:pass@example.com',
      'file:///tmp',
      '',
    ]) {
      process.env.FRONTEND_URL = origin || ' ';
      assert.throws(readEnv);
    }
    process.env.FRONTEND_URL = 'http://localhost:5173';
    process.env.NODE_ENV = 'production';
    assert.throws(readEnv, /HTTPS/);
    process.env.NODE_ENV = 'test';
    process.env.JWT_EXPIRES_IN = 'not-a-duration';
    assert.throws(readEnv, /JWT_EXPIRES_IN/);
  } finally {
    for (const key of Object.keys(process.env)) if (!(key in snapshot)) delete process.env[key];
    Object.assign(process.env, snapshot);
  }
});
