import Notification from '../models/Notification.js';
import { success } from '../utils/respond.js';
import { pagination, pageMeta } from '../utils/pagination.js';
import ApiError from '../utils/ApiError.js';
export async function list(req, res) {
  const filter = { user: req.user._id },
    paging = pagination(req.query);
  if (req.query.unreadOnly !== undefined) {
    if (!['true', 'false'].includes(req.query.unreadOnly))
      throw new ApiError(422, 'unreadOnly must be true or false.');
    if (req.query.unreadOnly === 'true') filter.isRead = false;
  }
  if (req.query.type !== undefined) {
    if (!Notification.schema.path('type').enumValues.includes(req.query.type))
      throw new ApiError(422, 'Invalid notification type.');
    filter.type = req.query.type;
  }
  const [items, total, unreadCount] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).skip(paging.skip).limit(paging.limit),
    Notification.countDocuments(filter),
    Notification.countDocuments({ user: req.user._id, isRead: false }),
  ]);
  return success(res, items, 'Notifications loaded.', 200, {
    pagination: pageMeta(total, paging),
    unreadCount,
  });
}
export async function read(req, res) {
  const n = await Notification.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { $set: { isRead: true } },
    { new: true },
  );
  if (!n) throw new ApiError(404, 'Notification not found.');
  return success(res, n);
}
export async function readAll(req, res) {
  await Notification.updateMany({ user: req.user._id, isRead: false }, { $set: { isRead: true } });
  return success(res, null, 'All notifications marked as read.');
}
