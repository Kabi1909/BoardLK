import Booking from '../models/Booking.js';
import Property from '../models/Property.js';
import ApiError from '../utils/ApiError.js';
import { success } from '../utils/respond.js';
import { pagination, pageMeta } from '../utils/pagination.js';
import { transaction } from '../config/db.js';
import {
  PUBLIC_FILTER,
  PUBLIC_USER_FIELDS,
  availability,
  BOOKING_STATUSES,
} from '../utils/constants.js';
import { notify } from '../services/notificationService.js';
import { notifyUnavailable } from '../services/propertyService.js';
const populate = (query) =>
  query
    .populate('property', 'title images coverImage city district monthlyRent deletedAt')
    .populate('renter owner', PUBLIC_USER_FIELDS);
export async function create(req, res) {
  let booking;
  await transaction(async (session) => {
    const { propertyId, ...data } = req.validated.body;
    const property = await Property.findOne({
      _id: propertyId,
      ...PUBLIC_FILTER,
      availabilityStatus: { $ne: 'Temporarily Unavailable' },
    }).session(session);
    if (!property || property.availableSpaces < data.numberOfOccupants)
      throw new ApiError(409, 'This property does not have enough available spaces.');
    [booking] = await Booking.create(
      [
        {
          ...data,
          property: property._id,
          owner: property.owner,
          renter: req.user._id,
          history: [{ status: 'Pending', at: new Date() }],
        },
      ],
      { session },
    );
    await Property.updateOne(
      { _id: property._id },
      { $inc: { bookingRequestCount: 1 } },
      { session },
    );
    await notify(
      property.owner,
      'booking_request',
      'New booking request',
      req.user.name + ' requested ' + property.title,
      '/owner/bookings',
      session,
    );
  });
  return success(res, booking, 'Booking request sent.', 201);
}
export async function list(req, res) {
  const filter = { [req.user.role === 'owner' ? 'owner' : 'renter']: req.user._id },
    paging = pagination(req.query);
  if (req.query.status && req.query.status !== 'All') {
    if (!BOOKING_STATUSES.includes(req.query.status))
      throw new ApiError(422, 'Invalid booking status.');
    filter.status = req.query.status;
  }
  const [items, total] = await Promise.all([
    populate(Booking.find(filter)).sort({ createdAt: -1 }).skip(paging.skip).limit(paging.limit),
    Booking.countDocuments(filter),
  ]);
  return success(res, items, 'Bookings loaded.', 200, { pagination: pageMeta(total, paging) });
}
async function accessible(id, user, session) {
  const b = await Booking.findById(id).session(session || null);
  if (!b) throw new ApiError(404, 'Booking not found.');
  if (![String(b.renter), String(b.owner)].includes(String(user._id)))
    throw new ApiError(403, 'You cannot access this booking.');
  return b;
}
export async function detail(req, res) {
  await accessible(req.params.id, req.user);
  return success(res, await populate(Booking.findById(req.params.id)));
}
export async function transition(req, res) {
  let result;
  await transaction(async (session) => {
    const b = await accessible(req.params.id, req.user, session);
    const status = req.user.role === 'renter' ? 'Cancelled' : req.validated.body.status;
    if (req.user.role === 'renter' && String(b.renter) !== String(req.user._id))
      throw new ApiError(403, 'You cannot cancel this request.');
    if (req.user.role === 'owner' && String(b.owner) !== String(req.user._id))
      throw new ApiError(403, 'You cannot manage this request.');
    const allowed =
      b.status === 'Pending'
        ? ['Accepted', 'Rejected', 'Cancelled']
        : b.status === 'Accepted'
          ? ['Completed']
          : [];
    if (!allowed.includes(status))
      throw new ApiError(409, 'This booking status transition is not allowed.');
    if (status === 'Accepted') {
      const p = await Property.findOneAndUpdate(
        {
          _id: b.property,
          ...PUBLIC_FILTER,
          availabilityStatus: { $ne: 'Temporarily Unavailable' },
          availableSpaces: { $gte: b.numberOfOccupants },
        },
        { $inc: { availableSpaces: -b.numberOfOccupants } },
        { new: true, session },
      );
      if (!p) throw new ApiError(409, 'There are not enough available spaces.');
      p.availabilityStatus = availability(p.availableSpaces);
      await p.save({ session });
      if (p.availableSpaces === 0) await notifyUnavailable(p, session);
    }
    if (status === 'Completed') {
      const p = await Property.findById(b.property).session(session);
      if (p) {
        p.availableSpaces = Math.min(p.maximumOccupants, p.availableSpaces + b.numberOfOccupants);
        p.availabilityStatus = availability(
          p.availableSpaces,
          p.availabilityStatus === 'Temporarily Unavailable',
        );
        await p.save({ session });
      }
    }
    b.status = status;
    b.active = ['Pending', 'Accepted'].includes(status);
    b.ownerResponse = req.validated?.body?.ownerResponse || b.ownerResponse;
    b.history.push({ status, at: new Date() });
    await b.save({ session });
    result = b;
    const receiver = req.user.role === 'owner' ? b.renter : b.owner;
    await notify(
      receiver,
      'booking_' + status.toLowerCase(),
      'Booking ' + status.toLowerCase(),
      b.ownerResponse || 'Your booking request has been ' + status.toLowerCase() + '.',
      '/' + (req.user.role === 'owner' ? 'renter' : 'owner') + '/bookings',
      session,
    );
  });
  return success(res, result, 'Booking updated.');
}
