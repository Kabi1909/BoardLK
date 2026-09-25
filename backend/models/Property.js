import mongoose from 'mongoose';
import {
  PROPERTY_TYPES,
  ROOM_TYPES,
  GENDERS,
  AVAILABILITY,
  DISTRICTS,
  FACILITIES,
} from '../utils/constants.js';
const schema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
      immutable: true,
    },
    title: { type: String, required: true, trim: true, maxlength: 150 },
    description: { type: String, maxlength: 10000 },
    propertyType: { type: String, enum: PROPERTY_TYPES },
    district: { type: String, enum: DISTRICTS },
    city: String,
    address: { type: String, select: false },
    nearbyLandmark: String,
    nearbyUniversityOrWorkplace: String,
    latitude: { type: Number, min: -90, max: 90, select: false },
    longitude: { type: Number, min: -180, max: 180, select: false },
    publicLatitude: Number,
    publicLongitude: Number,
    publicLocationEnabled: { type: Boolean, default: false },
    roomType: { type: String, enum: ROOM_TYPES },
    numberOfRooms: { type: Number, min: 1, max: 10000, validate: Number.isInteger },
    maximumOccupants: { type: Number, min: 1, max: 10000, validate: Number.isInteger },
    availableSpaces: { type: Number, min: 0, max: 10000, default: 0, validate: Number.isInteger },
    genderPreference: { type: String, enum: GENDERS, default: 'Any' },
    monthlyRent: { type: Number, min: 0 },
    securityDeposit: { type: Number, min: 0, default: 0 },
    utilityCharges: { type: Number, min: 0, default: 0 },
    advancePayment: { type: Number, min: 0, default: 0 },
    facilities: Object.fromEntries(
      FACILITIES.map((key) => [key, { type: Boolean, default: false }]),
    ),
    houseRules: {
      smokingAllowed: Boolean,
      petsAllowed: Boolean,
      visitorsAllowed: Boolean,
      curfew: String,
      otherRules: String,
    },
    images: [{ url: { type: String, required: true }, publicId: String }],
    coverImage: String,
    availabilityStatus: { type: String, enum: AVAILABILITY, default: 'Fully Occupied' },
    isDraft: { type: Boolean, default: true },
    isActive: { type: Boolean, default: true },
    views: { type: Number, default: 0 },
    monthlyViews: { type: Map, of: Number, default: {} },
    bookingRequestCount: { type: Number, default: 0 },
    averageRating: { type: Number, min: 0, max: 5, default: 0 },
    reviewCount: { type: Number, min: 0, default: 0, validate: Number.isInteger },
    deletedAt: { type: Date, default: null },
    pendingImageCleanup: [String],
  },
  { timestamps: true, optimisticConcurrency: true },
);
schema.pre('validate', function () {
  if (this.maximumOccupants !== undefined && this.availableSpaces > this.maximumOccupants)
    this.invalidate('availableSpaces', 'Available spaces cannot exceed maximum occupants.');
  if (this.images.length > 8)
    this.invalidate('images', 'A property can contain at most eight images.');
  if (this.coverImage && !this.images.some((image) => image.url === this.coverImage))
    this.invalidate('coverImage', 'The cover must be one of this property’s images.');
});
schema.index({ isActive: 1, isDraft: 1, deletedAt: 1, district: 1, monthlyRent: 1 });
schema.index({ owner: 1, createdAt: -1 });
export default mongoose.model('Property', schema);
