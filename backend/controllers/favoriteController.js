import Favorite from '../models/Favorite.js';
import Property from '../models/Property.js';
import { PUBLIC_FILTER } from '../utils/constants.js';
import { serializeProperty, exactFields } from '../services/propertyService.js';
import { success } from '../utils/respond.js';
import { pagination, pageMeta } from '../utils/pagination.js';
import ApiError from '../utils/ApiError.js';
export async function list(req, res) {
  const paging = pagination(req.query),
    filter = { renter: req.user._id };
  const [items, total] = await Promise.all([
    Favorite.find(filter)
      .populate({ path: 'property', select: exactFields, match: { ...PUBLIC_FILTER } })
      .sort({ createdAt: -1 })
      .skip(paging.skip)
      .limit(paging.limit),
    Favorite.countDocuments(filter),
  ]);
  return success(
    res,
    items.map((x) => ({
      ...x.toObject(),
      property: x.property ? serializeProperty(x.property) : null,
    })),
    'Favorites loaded.',
    200,
    { pagination: pageMeta(total, paging) },
  );
}
export async function add(req, res) {
  if (!(await Property.exists({ _id: req.params.propertyId, ...PUBLIC_FILTER })))
    throw new ApiError(404, 'Property not found.');
  const favorite = await Favorite.findOneAndUpdate(
    { renter: req.user._id, property: req.params.propertyId },
    { $setOnInsert: { renter: req.user._id, property: req.params.propertyId } },
    { upsert: true, new: true },
  );
  return success(res, favorite, 'Saved to favorites.');
}
export async function remove(req, res) {
  await Favorite.deleteOne({ renter: req.user._id, property: req.params.propertyId });
  return success(res, null, 'Favorite removed.');
}
