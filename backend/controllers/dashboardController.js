import Property from '../models/Property.js';
import Booking from '../models/Booking.js';
import Message from '../models/Message.js';
import Review from '../models/Review.js';
import Favorite from '../models/Favorite.js';
import RenterProfile from '../models/RenterProfile.js';
import { PUBLIC_FILTER, PUBLIC_USER_FIELDS } from '../utils/constants.js';
import { serializeProperty, exactFields } from '../services/propertyService.js';
import { recommend } from '../services/recommendationService.js';
import { success } from '../utils/respond.js';
export async function recommendations(req, res) {
  return success(res, await recommend(req.user._id));
}
export async function recent(req, res) {
  const profile = await RenterProfile.findOne({ user: req.user._id }).populate({
    path: 'recentlyViewed.property',
    match: PUBLIC_FILTER,
    select: exactFields,
  });
  return success(
    res,
    (profile?.recentlyViewed || [])
      .filter((x) => x.property)
      .map((x) => ({ property: serializeProperty(x.property), viewedAt: x.viewedAt })),
  );
}
export async function dashboard(req, res) {
  const user = req.user._id,
    owner = req.user.role === 'owner',
    filter = { [owner ? 'owner' : 'renter']: user };
  const [pendingRequests, acceptedRequests, unreadMessages, recentBookings, recentMessages] =
    await Promise.all([
      Booking.countDocuments({ ...filter, status: 'Pending' }),
      Booking.countDocuments({ ...filter, status: 'Accepted' }),
      Message.countDocuments({ receiver: user, readAt: null }),
      Booking.find(filter)
        .populate('property', 'title coverImage city monthlyRent')
        .populate('renter owner', PUBLIC_USER_FIELDS)
        .sort({ createdAt: -1 })
        .limit(5),
      Message.find({ $or: [{ sender: user }, { receiver: user }] })
        .sort({ createdAt: -1 })
        .limit(5),
    ]);
  const base = {
    pendingRequests,
    acceptedRequests,
    unreadMessages,
    recentBookings,
    recentMessages,
  };
  if (!owner) {
    const profile = await RenterProfile.findOne({ user }).populate({
      path: 'recentlyViewed.property',
      match: PUBLIC_FILTER,
      select: exactFields,
    });
    return success(res, {
      ...base,
      savedProperties: await Favorite.countDocuments({ renter: user }),
      recommendations: await recommend(user),
      recentlyViewed: (profile?.recentlyViewed || [])
        .filter((x) => x.property)
        .map((x) => ({ property: serializeProperty(x.property), viewedAt: x.viewedAt })),
    });
  }
  const properties = await Property.find({ owner: user, deletedAt: null }).lean();
  const reviewCount = properties.reduce((n, p) => n + p.reviewCount, 0);
  const bookings = await Booking.aggregate([
    { $match: { owner: user } },
    {
      $group: {
        _id: { $dateToString: { date: '$createdAt', format: '%Y-%m' } },
        count: { $sum: 1 },
      },
    },
  ]);
  const charts = Array.from({ length: 6 }, (_, i) => {
    const date = new Date();
    date.setUTCDate(1);
    date.setUTCMonth(date.getUTCMonth() - 5 + i);
    const month = date.toISOString().slice(0, 7);
    return {
      month,
      views: properties.reduce((n, p) => n + (p.monthlyViews?.[month] || 0), 0),
      bookings: bookings.find((x) => x._id === month)?.count || 0,
    };
  });
  return success(res, {
    ...base,
    totalProperties: properties.length,
    activeListings: properties.filter((p) => p.isActive && !p.isDraft).length,
    availableSpaces: properties
      .filter((p) => p.isActive && !p.isDraft && p.availabilityStatus !== 'Temporarily Unavailable')
      .reduce((n, p) => n + p.availableSpaces, 0),
    totalViews: properties.reduce((n, p) => n + p.views, 0),
    averageRating: reviewCount
      ? properties.reduce((n, p) => n + p.averageRating * p.reviewCount, 0) / reviewCount
      : 0,
    mostViewedProperties: [...properties]
      .sort((a, b) => b.views - a.views)
      .slice(0, 5)
      .map((p) => serializeProperty(p, true)),
    latestReviews: await Review.find({ owner: user })
      .populate('renter', PUBLIC_USER_FIELDS)
      .sort({ createdAt: -1 })
      .limit(5),
    charts,
  });
}
