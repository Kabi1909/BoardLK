import { test } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { spawn } from 'node:child_process';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import { setTimeout as delay } from 'node:timers/promises';
test('seed CLI, development server and real HTTP login work together', async () => {
  const mongo = await MongoMemoryReplSet.create({
    replSet: { count: 1, storageEngine: 'wiredTiger' },
  });
  const env = {
    ...process.env,
    NODE_ENV: 'test',
    MONGO_URI: mongo.getUri('boardlk_demo'),
    JWT_SECRET: crypto.randomBytes(48).toString('hex'),
    PORT: '5099',
    BCRYPT_SALT_ROUNDS: '4',
  };
  let server;
  try {
    const npmCommand = process.platform === 'win32' ? 'cmd.exe' : 'npm';
    const npmArgs = (script) =>
      process.platform === 'win32' ? ['/d', '/s', '/c', 'npm run ' + script] : ['run', script];
    const seed = spawn(npmCommand, npmArgs('seed'), {
      env,
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    });
    let output = '';
    seed.stdout.on('data', (data) => {
      output += data;
    });
    seed.stderr.on('data', (data) => {
      output += data;
    });
    const code = await new Promise((resolve) => seed.on('exit', resolve));
    assert.equal(code, 0, output);
    assert.match(output, /properties: 22/);
    server = spawn(npmCommand, npmArgs('dev'), {
      env,
      stdio: 'ignore',
      windowsHide: true,
    });
    let healthy = false;
    for (let i = 0; i < 50; i++) {
      try {
        healthy = (await fetch('http://127.0.0.1:5099/api/health')).ok;
      } catch {}
      if (healthy) break;
      await delay(100);
    }
    assert.ok(healthy, 'Development server must start.');
    const login = await fetch('http://127.0.0.1:5099/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'owner.demo@boardlk.test', password: 'BoardLKDemo123!' }),
    });
    assert.equal(login.status, 200);
    const result = await fetch(
      'http://127.0.0.1:5099/api/properties?search=Vavuniya&maxRent=20000&roomType=Single&wifi=true',
    );
    const body = await result.json();
    assert.equal(body.data.length, 1);
  } finally {
    if (server) {
      if (process.platform === 'win32')
        await new Promise((resolve) => {
          const stop = spawn('taskkill', ['/pid', String(server.pid), '/t', '/f'], {
            stdio: 'ignore',
            windowsHide: true,
          });
          stop.on('exit', resolve);
        });
      else server.kill('SIGTERM');
    }
    await mongo.stop();
  }
});
