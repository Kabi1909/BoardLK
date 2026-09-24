import mongoose from 'mongoose';
const schema = new mongoose.Schema(
  {
    renter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    property: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', required: true },
    lastMessage: String,
    lastMessageAt: Date,
  },
  { timestamps: true },
);
schema.index({ renter: 1, owner: 1, property: 1 }, { unique: true });
export default mongoose.model('Conversation', schema);
