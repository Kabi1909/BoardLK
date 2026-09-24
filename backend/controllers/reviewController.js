import mongoose from 'mongoose';
import Review from '../models/Review.js';
import Booking from '../models/Booking.js';
import Property from '../models/Property.js';
import ApiError from '../utils/ApiError.js';
import { PUBLIC_FILTER, PUBLIC_USER_FIELDS } from '../utils/constants.js';
import { success } from '../utils/respond.js';
import { pagination, pageMeta } from '../utils/pagination.js';
import { transaction } from '../config/db.js';
import { notify } from '../services/notificationService.js';
async function recalculate(propertyId, session) {
  // Writing the shared property document makes concurrent review transactions retry.
  await Property.updateOne({ _id: propertyId }, { $inc: { __v: 1 } }, { session });
  const [stats] = await Review.aggregate([
    { $match: { property: new mongoose.Types.ObjectId(String(propertyId)) } },
    { $group: { _id: null, average: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]).session(session);
  await Property.updateOne(
    { _id: propertyId },
    { $set: { averageRating: stats?.average || 0, reviewCount: stats?.count || 0 } },
    { session },
  );
}
export async function recent(req, res) {
  const reviews = await Review.aggregate([
    {
      $lookup: { from: 'properties', localField: 'property', foreignField: '_id', as: 'property' },
    },
    { $unwind: '$property' },
    {
      $match: { 'property.isActive': true, 'property.isDraft': false, 'property.deletedAt': null },
    },
    { $sort: { createdAt: -1 } },
    { $limit: 3 },
    { $lookup: { from: 'users', localField: 'renter', foreignField: '_id', as: 'renter' } },
    { $unwind: '$renter' },
    {
      $project: {
        rating: 1,
        reviewText: 1,
        createdAt: 1,
        'renter._id': 1,
        'renter.name': 1,
        'renter.profileImage': 1,
        'property.city': 1,
        'property.title': 1,
      },
    },
  ]);
  return success(res, reviews);
}
export async function create(req, res) {
  let review;
  await transaction(async (session) => {
    const { propertyId, bookingId, rating, reviewText } = req.validated.body;
    const b = await Booking.findOne({
      _id: bookingId,
      property: propertyId,
      renter: req.user._id,
      status: 'Completed',
    }).session(session);
    if (!b) throw new ApiError(403, 'A completed booking is required to review this property.');
    if (!(await Property.exists({ _id: propertyId, deletedAt: null }).session(session)))
      throw new ApiError(404, 'Property not found.');
    [review] = await Review.create(
      [
        {
          property: propertyId,
          booking: bookingId,
          renter: req.user._id,
          owner: b.owner,
          rating,
          reviewText,
        },
      ],
      { session },
    );
    await recalculate(propertyId, session);
    await notify(
      b.owner,
      'new_review',
      'New property review',
      req.user.name + ' reviewed your property.',
      '/owner/reviews',
      session,
    );
  });
  return success(res, review, 'Review published.', 201);
}
export async function list(req, res) {
  const filter = req.params.propertyId
    ? { property: req.params.propertyId }
    : { owner: req.user._id };
  if (
    req.params.propertyId &&
    !(await Property.exists({ _id: req.params.propertyId, ...PUBLIC_FILTER }))
  )
    throw new ApiError(404, 'Property not found.');
  const paging = pagination(req.query);
  const [items, total] = await Promise.all([
    Review.find(filter)
      .populate('renter', PUBLIC_USER_FIELDS)
      .populate('property', 'title coverImage images city')
      .sort({ createdAt: -1 })
      .skip(paging.skip)
      .limit(paging.limit),
    Review.countDocuments(filter),
  ]);
  return success(res, items, 'Reviews loaded.', 200, { pagination: pageMeta(total, paging) });
}
export async function update(req, res) {
  let result;
  await transaction(async (session) => {
    const r = await Review.findById(req.params.id).session(session);
    if (!r) throw new ApiError(404, 'Review not found.');
    if (String(r.renter) !== String(req.user._id))
      throw new ApiError(403, 'You can only change your own review.');
    if (req.method === 'DELETE') await r.deleteOne({ session });
    else {
      Object.assign(r, req.validated.body);
      await r.save({ session });
    }
    await recalculate(r.property, session);
    result = req.method === 'DELETE' ? null : r;
  });
  return success(res, result, 'Review updated.');
}
export async function reply(req, res) {
  const r = await Review.findById(req.params.id);
  if (!r) throw new ApiError(404, 'Review not found.');
  if (String(r.owner) !== String(req.user._id))
    throw new ApiError(403, 'You can only reply to reviews of your properties.');
  r.ownerReply = { text: req.validated.body.reply, repliedAt: new Date() };
  await r.save();
  return success(res, r, 'Reply saved.');
}
