import Property from '../models/Property.js';
import User from '../models/User.js';
export async function cleanupImages(storage) {
  for (const Model of [Property, User]) {
    const records = await Model.find({ 'pendingImageCleanup.0': { $exists: true } })
      .select('pendingImageCleanup')
      .limit(20);
    for (const record of records)
      for (const publicId of record.pendingImageCleanup) {
        try {
          await storage.remove(publicId);
          await Model.updateOne({ _id: record._id }, { $pull: { pendingImageCleanup: publicId } });
        } catch {
          /* Keep failed deletions queued for the next attempt. */
        }
      }
  }
}
export function startCleanup(storage) {
  let running = false;
  const timer = setInterval(async () => {
    if (running) return;
    running = true;
    try {
      await cleanupImages(storage);
    } catch {
      console.error('Image cleanup will retry later.');
    } finally {
      running = false;
    }
  }, 60000);
  timer.unref();
  return () => clearInterval(timer);
}
