import crypto from 'node:crypto';
import Property from '../models/Property.js';
import PropertyView from '../models/PropertyView.js';
import RenterProfile from '../models/RenterProfile.js';
import Favorite from '../models/Favorite.js';
import Booking from '../models/Booking.js';
import Notification from '../models/Notification.js';
import ApiError from '../utils/ApiError.js';
import {
  PUBLIC_FILTER,
  FACILITIES,
  DISTRICTS,
  PROPERTY_TYPES,
  ROOM_TYPES,
  GENDERS,
  availability,
} from '../utils/constants.js';
import { transaction } from '../config/db.js';
export const exactFields = '+address +latitude +longitude';
export function serializeProperty(doc, own = false) {
  const p = doc.toObject ? doc.toObject() : { ...doc };
  delete p.pendingImageCleanup;
  delete p.__v;
  if (!own && !p.publicLocationEnabled) {
    p.latitude = p.publicLatitude;
    p.longitude = p.publicLongitude;
    p.address = [p.city, p.district].filter(Boolean).join(', ');
  }
  return p;
}
export async function ownedProperty(id, user, session) {
  const property = await Property.findOne({ _id: id, deletedAt: null })
    .select(exactFields)
    .session(session || null);
  if (!property) throw new ApiError(404, 'Property not found.');
  if (String(property.owner) !== String(user._id))
    throw new ApiError(403, 'You can only manage your own property.');
  return property;
}
export function validatePublish(p) {
  const errors = [];
  for (const key of [
    'title',
    'description',
    'propertyType',
    'district',
    'city',
    'address',
    'roomType',
    'numberOfRooms',
    'maximumOccupants',
    'monthlyRent',
  ]) {
    if (!p[key]) errors.push({ field: key, message: 'Required before publishing.' });
  }
  if ((p.description || '').length < 30)
    errors.push({ field: 'description', message: 'Use at least 30 characters.' });
  if (!Number.isFinite(p.latitude) || !Number.isFinite(p.longitude))
    errors.push({ field: 'latitude', message: 'Choose a valid location.' });
  if (!p.images?.length) errors.push({ field: 'images', message: 'Upload at least one image.' });
  if (errors.length) throw new ApiError(422, 'Complete the property before publishing.', errors);
}
export function prepareProperty(p) {
  if (p.availableSpaces > (p.maximumOccupants || 0))
    throw new ApiError(422, 'Available spaces cannot exceed capacity.', [
      { field: 'availableSpaces', message: 'Must not exceed maximum occupants.' },
    ]);
  if (!p.isDraft) validatePublish(p);
  p.publicLatitude = Number(p.latitude?.toFixed(2));
  p.publicLongitude = Number(p.longitude?.toFixed(2));
  if (!Number.isFinite(p.publicLatitude)) p.publicLatitude = undefined;
  if (!Number.isFinite(p.publicLongitude)) p.publicLongitude = undefined;
  p.availabilityStatus = availability(
    p.availableSpaces,
    p.availabilityStatus === 'Temporarily Unavailable',
  );
}
export async function notifyUnavailable(property, session) {
  const favorites = await Favorite.find({ property: property._id }).session(session).lean();
  const bookings = await Booking.find({ property: property._id, active: true })
    .session(session)
    .lean();
  const ids = [...new Set([...favorites, ...bookings].map((x) => String(x.renter)))];
  if (ids.length)
    await Notification.insertMany(
      ids.map((user) => ({
        user,
        type: 'property_unavailable',
        title: 'Property unavailable',
        message: property.title + ' is no longer accepting requests.',
        link: '/properties/' + property._id,
      })),
      { session },
    );
}
export function buildPropertyQuery(query) {
  const filter = { ...PUBLIC_FILTER };
  const options = {
    district: DISTRICTS,
    propertyType: PROPERTY_TYPES,
    roomType: ROOM_TYPES,
    genderPreference: GENDERS,
  };
  for (const key of ['district', 'city', 'propertyType', 'roomType', 'genderPreference'])
    if (query[key]) {
      if (typeof query[key] !== 'string' || query[key].length > 200)
        throw new ApiError(422, 'Invalid ' + key + '.');
      if (options[key] && !options[key].includes(query[key]))
        throw new ApiError(422, 'Invalid ' + key + '.');
      filter[key] = query[key];
    }
  if (query.search) {
    if (typeof query.search !== 'string' || query.search.length > 200)
      throw new ApiError(422, 'Invalid search.');
    const escaped = query.search.replace(/[.*+?^$\{\}()|[\]\\]/g, '\\$&');
    filter.$or = ['title', 'district', 'city', 'nearbyUniversityOrWorkplace', 'nearbyLandmark'].map(
      (key) => ({ [key]: { $regex: escaped, $options: 'i' } }),
    );
  }
  for (const [key, field, operator] of [
    ['minRent', 'monthlyRent', '$gte'],
    ['maxRent', 'monthlyRent', '$lte'],
    ['minRating', 'averageRating', '$gte'],
  ]) {
    if (query[key] !== undefined && query[key] !== '') {
      if (!['string', 'number'].includes(typeof query[key]) || String(query[key]).trim() === '')
        throw new ApiError(422, 'Invalid ' + key + '.');
      const value = Number(query[key]);
      if (!Number.isFinite(value) || value < 0 || (key === 'minRating' && value > 5))
        throw new ApiError(422, 'Invalid ' + key + '.');
      filter[field] = { ...filter[field], [operator]: value };
    }
  }
  if (filter.monthlyRent?.$gte > filter.monthlyRent?.$lte)
    throw new ApiError(422, 'Minimum rent cannot exceed maximum rent.');
  for (const key of [...FACILITIES, 'availableNow'])
    if (query[key] !== undefined) {
      if (!['true', 'false'].includes(query[key]))
        throw new ApiError(422, 'Use true or false for ' + key + '.');
      if (query[key] === 'true') {
        if (key === 'availableNow') {
          filter.availableSpaces = { $gt: 0 };
          filter.availabilityStatus = { $ne: 'Temporarily Unavailable' };
        } else filter['facilities.' + key] = true;
      } else if (key !== 'availableNow') filter['facilities.' + key] = false;
    }
  return filter;
}
export async function recordView(req, p) {
  const day = new Date().toISOString().slice(0, 10),
    month = day.slice(0, 7);
  const visitor = crypto
    .createHmac('sha256', req.app.locals.env.jwtSecret)
    .update(String(req.user?._id || req.ip))
    .digest('hex');
  await transaction(async (session) => {
    const result = await PropertyView.updateOne(
      { property: p._id, visitor, day },
      { $setOnInsert: { expiresAt: new Date(Date.now() + 2 * 86400000) } },
      { upsert: true, session },
    );
    if (result.upsertedCount)
      await Property.updateOne(
        { _id: p._id },
        { $inc: { views: 1, ['monthlyViews.' + month]: 1 } },
        { session },
      );
    if (req.user?.role === 'renter') {
      const profile = await RenterProfile.findOne({ user: req.user._id }).session(session);
      if (profile) {
        profile.recentlyViewed = [
          { property: p._id, viewedAt: new Date() },
          ...profile.recentlyViewed.filter((x) => String(x.property) !== String(p._id)),
        ].slice(0, 20);
        await profile.save({ session });
      }
    }
  });
}
