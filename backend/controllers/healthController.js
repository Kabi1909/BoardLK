import mongoose from 'mongoose';
// Liveness answers whether the process can serve HTTP; readiness also requires MongoDB.
export function health(req, res) {
  const connected = mongoose.connection.readyState === 1;
  return res.status(connected ? 200 : 503).json({
    success: connected,
    service: 'BoardLK API',
    status: connected ? 'healthy' : 'unavailable',
  });
}
export async function ready(req, res) {
  let ready = false;
  try {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.db.command({ ping: 1 }, { maxTimeMS: 1000 });
      ready = true;
    }
  } catch {
    /* A probe must never expose database connection details. */
  }
  return res
    .status(ready ? 200 : 503)
    .json({ success: ready, service: 'BoardLK API', status: ready ? 'ready' : 'unavailable' });
}
export function live(req, res) {
  return res.json({ success: true, service: 'BoardLK API', status: 'alive' });
}
