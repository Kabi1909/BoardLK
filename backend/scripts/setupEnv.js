import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

// Keep a stable local signing secret so restarting the API preserves sessions.
const target = new URL('../.env', import.meta.url);
let contents;
try {
  contents = await fs.readFile(target, 'utf8');
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
  contents = await fs.readFile(new URL('../.env.example', import.meta.url), 'utf8');
  await fs.writeFile(target, contents, { flag: 'wx', mode: 0o600 });
}

const assignment = /^\s*(?:export\s+)?JWT_SECRET\s*=([^\r\n]*)/m;
const current = contents.match(assignment);
const value = current?.[1].trim().replace(/^(['"])(.*)\1$/, '$2');
if (value && !value.startsWith('#')) {
  console.log('Existing JWT_SECRET preserved. No credentials were printed.');
} else {
  const line = 'JWT_SECRET=' + crypto.randomBytes(48).toString('hex');
  contents = current ? contents.replace(assignment, line) : contents.trimEnd() + '\n' + line + '\n';
  await fs.writeFile(target, contents, { mode: 0o600 });
  console.log('Generated a private JWT signing secret in backend/.env.');
}
console.log('Configure MONGO_URI in ' + fileURLToPath(target) + ' before starting the API.');
