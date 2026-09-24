import mongoose from 'mongoose';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { readEnv } from '../config/env.js';
import { connectDB } from '../config/db.js';
import { seedData } from './data.js';
export async function runSeed() {
  const env = readEnv();
  if (env.nodeEnv === 'production') throw new Error('Demo seeding is disabled in production.');
  await connectDB(env.mongoUri);
  if (!mongoose.connection.name.endsWith('_demo'))
    throw new Error('Use a database name ending in _demo for demo seeds.');
  const result = await seedData({
    reset: process.argv.includes('--reset'),
    password: process.env.SEED_PASSWORD || 'BoardLKDemo123!',
  });
  console.log('Demo seed result:', result);
  await mongoose.disconnect();
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runSeed().catch(async (error) => {
    console.error('Seed failed: ' + error.name + '. Check demo database configuration.');
    await mongoose.disconnect();
    process.exitCode = 1;
  });
}
