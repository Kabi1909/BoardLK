import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import { ROLES } from '../utils/constants.js';
const schema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, required: true },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: ROLES, required: true },
    profileImage: { url: String, publicId: String },
    pendingImageCleanup: [String],
    status: { type: String, enum: ['active', 'disabled'], default: 'active' },
    tokenVersion: { type: Number, default: 0, select: false },
    resetPasswordToken: { type: String, select: false },
    resetPasswordExpires: { type: Date, select: false },
  },
  { timestamps: true },
);
schema.pre('save', async function () {
  if (this.isModified('password'))
    this.password = await bcrypt.hash(this.password, Number(process.env.BCRYPT_SALT_ROUNDS || 12));
});
schema.methods.matchesPassword = function (password) {
  return bcrypt.compare(password, this.password);
};
export default mongoose.model('User', schema);
