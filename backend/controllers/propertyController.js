import Property from '../models/Property.js';
import Booking from '../models/Booking.js';
import Favorite from '../models/Favorite.js';
import { transaction } from '../config/db.js';
import { pagination, pageMeta } from '../utils/pagination.js';
import { success } from '../utils/respond.js';
import { PUBLIC_FILTER, PUBLIC_USER_FIELDS } from '../utils/constants.js';
import ApiError from '../utils/ApiError.js';
import {
  serializeProperty,
  ownedProperty,
  prepareProperty,
  buildPropertyQuery,
  recordView,
  notifyUnavailable,
  exactFields,
} from '../services/propertyService.js';
const sorts = {
  price_asc: { monthlyRent: 1, _id: 1 },
  price_desc: { monthlyRent: -1, _id: 1 },
  rating: { averageRating: -1, _id: 1 },
  latest: { createdAt: -1, _id: 1 },
  popular: { views: -1, _id: 1 },
};
export async function list(req, res) {
  const paging = pagination(req.query),
    filter = buildPropertyQuery(req.query);
  if (req.query.sort && !sorts[req.query.sort]) throw new ApiError(422, 'Invalid sort option.');
  const [items, total] = await Promise.all([
    Property.find(filter)
      .select(exactFields)
      .populate('owner', PUBLIC_USER_FIELDS)
      .sort(sorts[req.query.sort || 'latest'])
      .skip(paging.skip)
      .limit(paging.limit),
    Property.countDocuments(filter),
  ]);
  return success(
    res,
    items.map((p) => serializeProperty(p)),
    'Properties loaded.',
    200,
    { pagination: pageMeta(total, paging) },
  );
}
export async function map(req, res) {
  return list(req, res);
}
export async function detail(req, res) {
  const p = await Property.findOne({ _id: req.params.id, deletedAt: null })
    .select(exactFields)
    .populate('owner', PUBLIC_USER_FIELDS);
  if (!p) throw new ApiError(404, 'Property not found.');
  const own = String(p.owner._id) === String(req.user?._id);
  if ((p.isDraft || !p.isActive) && !own) throw new ApiError(404, 'Property not found.');
  if (!own) await recordView(req, p);
  return success(res, serializeProperty(p, own));
}
export async function similar(req, res) {
  const p = await Property.findOne({ _id: req.params.id, ...PUBLIC_FILTER });
  if (!p) throw new ApiError(404, 'Property not found.');
  const items = await Property.find({
    ...PUBLIC_FILTER,
    _id: { $ne: p._id },
    $or: [{ district: p.district }, { roomType: p.roomType }],
  })
    .select(exactFields)
    .sort({ averageRating: -1 })
    .limit(6);
  return success(
    res,
    items.map((p) => serializeProperty(p)),
  );
}
export async function mine(req, res) {
  const paging = pagination(req.query),
    filter = { owner: req.user._id, deletedAt: null };
  const [items, total] = await Promise.all([
    Property.find(filter)
      .select(exactFields)
      .sort({ createdAt: -1 })
      .skip(paging.skip)
      .limit(paging.limit),
    Property.countDocuments(filter),
  ]);
  return success(
    res,
    items.map((p) => serializeProperty(p, true)),
    'Your properties.',
    200,
    { pagination: pageMeta(total, paging) },
  );
}
export async function create(req, res) {
  const p = new Property({ ...req.validated.body, owner: req.user._id });
  prepareProperty(p);
  await p.save();
  return success(res, serializeProperty(p, true), 'Property created.', 201);
}
export async function update(req, res) {
  let saved;
  await transaction(async (session) => {
    const p = await ownedProperty(req.params.id, req.user, session);
    const before =
      p.isActive &&
      !p.isDraft &&
      p.availableSpaces > 0 &&
      p.availabilityStatus !== 'Temporarily Unavailable';
    if (req.validated.body.availabilityStatus) {
      const status = req.validated.body.availabilityStatus;
      if (status === 'Fully Occupied') p.availableSpaces = 0;
      if (['Available', 'Limited Availability'].includes(status) && p.availableSpaces === 0)
        throw new ApiError(422, 'Edit available spaces before marking this listing available.');
    }
    const occupied = await Booking.aggregate([
      { $match: { property: p._id, status: 'Accepted' } },
      { $group: { _id: null, total: { $sum: '$numberOfOccupants' } } },
    ]).session(session);
    const reserved = occupied[0]?.total || 0;
    const capacity = req.validated.body.maximumOccupants ?? p.maximumOccupants;
    const spaces = req.validated.body.availableSpaces ?? p.availableSpaces;
    if (reserved && (capacity < reserved || spaces > capacity - reserved))
      throw new ApiError(409, 'Capacity must include spaces reserved by accepted bookings.');
    Object.assign(p, req.validated.body);
    prepareProperty(p);
    await p.save({ session });
    const after =
      p.isActive &&
      !p.isDraft &&
      p.availableSpaces > 0 &&
      p.availabilityStatus !== 'Temporarily Unavailable';
    if (before && !after) await notifyUnavailable(p, session);
    saved = serializeProperty(p, true);
  });
  return success(res, saved, 'Property updated.');
}
export async function remove(req, res) {
  await transaction(async (session) => {
    const p = await ownedProperty(req.params.id, req.user, session);
    if (await Booking.exists({ property: p._id, status: 'Accepted' }).session(session))
      throw new ApiError(
        409,
        'Complete accepted bookings before deleting. You can disable this listing.',
      );
    p.deletedAt = new Date();
    p.isActive = false;
    // Keep image references and booking history for audit and safe asynchronous cleanup.
    p.pendingImageCleanup = p.images.map((x) => x.publicId).filter(Boolean);
    await p.save({ session });
    await notifyUnavailable(p, session);
    await Booking.updateMany(
      { property: p._id, status: 'Pending' },
      {
        $set: {
          status: 'Cancelled',
          active: false,
          ownerResponse: 'The owner removed this listing.',
        },
        $push: { history: { status: 'Cancelled', at: new Date() } },
      },
      { session },
    );
    await Favorite.deleteMany({ property: p._id }, { session });
  });
  return success(res, null, 'Property removed.');
}
