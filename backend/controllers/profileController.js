import User from '../models/User.js';
import Property from '../models/Property.js';
import RenterProfile from '../models/RenterProfile.js';
import OwnerProfile from '../models/OwnerProfile.js';
import { transaction } from '../config/db.js';
import { safeUser } from './authController.js';
import { success } from '../utils/respond.js';
import ApiError from '../utils/ApiError.js';
export async function getProfile(req, res) {
  const Model = req.user.role === 'owner' ? OwnerProfile : RenterProfile;
  const profile = await Model.findOne({ user: req.user._id }).select('+nic +address').lean();
  const propertyCount =
    req.user.role === 'owner'
      ? await Property.countDocuments({ owner: req.user._id, deletedAt: null })
      : undefined;
  return success(res, {
    ...profile,
    user: safeUser(req.user),
    propertyCount,
    joinedDate: req.user.createdAt,
  });
}
export async function updateProfile(req, res) {
  const { name, email, phone, ...profile } = req.validated.body;
  if (req.user.role === 'renter' && ('nic' in profile || 'address' in profile))
    throw new ApiError(422, 'These fields are only available for an owner profile.');
  if (
    req.user.role === 'owner' &&
    Object.keys(profile).some((k) => !['nic', 'address'].includes(k))
  )
    throw new ApiError(422, 'Unsupported owner profile field.');
  await transaction(async (session) => {
    const fields = Object.fromEntries(
      Object.entries({ name, email, phone }).filter(([, v]) => v !== undefined),
    );
    await User.updateOne({ _id: req.user._id }, { $set: fields }, { session, runValidators: true });
    const Model = req.user.role === 'owner' ? OwnerProfile : RenterProfile;
    await Model.updateOne(
      { user: req.user._id },
      { $set: profile },
      { session, runValidators: true },
    );
  });
  req.user = await User.findById(req.user._id);
  return getProfile(req, res);
}
