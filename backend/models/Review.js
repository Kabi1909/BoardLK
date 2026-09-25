import mongoose from 'mongoose';
const schema = new mongoose.Schema(
  {
    renter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    property: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', required: true },
    booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', unique: true, required: true },
    rating: { type: Number, min: 1, max: 5, required: true, validate: Number.isInteger },
    reviewText: { type: String, required: true, maxlength: 2000 },
    ownerReply: { text: String, repliedAt: Date },
  },
  { timestamps: true },
);
schema.index({ property: 1, createdAt: -1 });
export default mongoose.model('Review', schema);
