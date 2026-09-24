import mongoose from 'mongoose';
const schema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', unique: true, required: true },
    gender: String,
    dateOfBirth: Date,
    universityOrWorkplace: String,
    preferredDistrict: String,
    preferredCity: String,
    monthlyBudget: { type: Number, min: 0 },
    preferredRoomType: String,
    bio: String,
    recentlyViewed: [
      {
        _id: false,
        property: { type: mongoose.Schema.Types.ObjectId, ref: 'Property' },
        viewedAt: Date,
      },
    ],
  },
  { timestamps: true },
);
export default mongoose.model('RenterProfile', schema);
