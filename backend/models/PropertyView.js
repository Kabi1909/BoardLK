import mongoose from 'mongoose';
const schema = new mongoose.Schema({
  property: { type: mongoose.Schema.Types.ObjectId, ref: 'Property' },
  visitor: String,
  day: String,
  expiresAt: Date,
});
schema.index({ property: 1, visitor: 1, day: 1 }, { unique: true });
schema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
export default mongoose.model('PropertyView', schema);
