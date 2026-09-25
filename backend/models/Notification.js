import mongoose from 'mongoose';
const schema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      required: true,
      enum: [
        'welcome',
        'booking_request',
        'booking_accepted',
        'booking_rejected',
        'booking_cancelled',
        'booking_completed',
        'new_message',
        'new_review',
        'property_unavailable',
      ],
    },
    title: String,
    message: String,
    link: String,
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true },
);
schema.index({ user: 1, isRead: 1, createdAt: -1 });
export default mongoose.model('Notification', schema);
