import mongoose from 'mongoose';
const schema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', unique: true, required: true },
    nic: { type: String, select: false },
    address: { type: String, select: false },
  },
  { timestamps: true },
);
export default mongoose.model('OwnerProfile', schema);
