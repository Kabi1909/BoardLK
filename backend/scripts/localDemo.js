import crypto from 'node:crypto';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import { createApp } from '../app.js';
import { seedData } from '../seeds/data.js';
const mongo = await MongoMemoryReplSet.create({
  replSet: { count: 1, storageEngine: 'wiredTiger' },
});
const uri = mongo.getUri('boardlk_demo');
await connectDB(uri);
await seedData();
const port = Number(process.env.PORT || 5000);
const app = createApp({
  port,
  nodeEnv: 'development',
  mongoUri: uri,
  jwtSecret: crypto.randomBytes(48).toString('hex'),
  jwtExpiresIn: '7d',
  origins: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  trustProxy: 0,
});
const server = app.listen(port, () =>
  console.log(
    'BoardLK local demo ready on port ' +
      port +
      '. Data is temporary and resets when this process stops.',
  ),
);
let stopping = false;
async function stop() {
  if (stopping) return;
  stopping = true;
  server.close(async () => {
    await mongoose.disconnect();
    await mongo.stop();
    process.exit(0);
  });
}
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
