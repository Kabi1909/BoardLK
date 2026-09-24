import mongoose from 'mongoose';
import { BOOKING_STATUSES } from '../utils/constants.js';
const ref = (name) => ({ type: mongoose.Schema.Types.ObjectId, ref: name, required: true });
const schema = new mongoose.Schema(
  {
    renter: ref('User'),
    owner: ref('User'),
    property: ref('Property'),
    moveInDate: { type: Date, required: true },
    numberOfOccupants: { type: Number, min: 1, required: true },
    stayDuration: { type: String, required: true },
    customStayDuration: String,
    renterMessage: { type: String, maxlength: 2000 },
    ownerResponse: { type: String, maxlength: 2000 },
    status: { type: String, enum: BOOKING_STATUSES, default: 'Pending' },
    active: { type: Boolean, default: true },
    history: [{ status: String, at: Date }],
  },
  { timestamps: true },
);
schema.index(
  { renter: 1, property: 1 },
  { unique: true, partialFilterExpression: { active: true } },
);
schema.index({ owner: 1, status: 1, createdAt: -1 });
export default mongoose.model('Booking', schema);
