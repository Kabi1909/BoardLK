import mongoose from 'mongoose';
const schema = new mongoose.Schema(
  {
    conversation: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', required: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true, maxlength: 4000 },
    readAt: { type: Date, default: null },
  },
  { timestamps: true },
);
schema.index({ conversation: 1, createdAt: -1 });
schema.index({ receiver: 1, readAt: 1 });
export default mongoose.model('Message', schema);
