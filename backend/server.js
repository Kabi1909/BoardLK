import mongoose from 'mongoose';
import { readEnv } from './config/env.js';
import { connectDB } from './config/db.js';
import { createApp } from './app.js';
import { startCleanup } from './services/cleanupService.js';
try {
  const env = readEnv();
  await connectDB(env.mongoUri);
  await Promise.all(mongoose.modelNames().map((name) => mongoose.model(name).init()));
  const app = createApp(env);
  const server = app.listen(env.port, () =>
    console.log('BoardLK API listening on port ' + env.port),
  );
  const stopCleanup = startCleanup(app.locals.imageStorage);
  let stopping = false;
  async function shutdown() {
    if (stopping) return;
    stopping = true;
    stopCleanup();
    server.close(async () => {
      await mongoose.disconnect();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000).unref();
  }
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
} catch (error) {
  console.error(
    'Startup failed. Check environment configuration and MongoDB availability. Error type: ' +
      error.name,
  );
  process.exitCode = 1;
}
