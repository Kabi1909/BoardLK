import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import Property from '../models/Property.js';
import Booking from '../models/Booking.js';
import ApiError from '../utils/ApiError.js';
import { PUBLIC_FILTER, PUBLIC_USER_FIELDS } from '../utils/constants.js';
import { success } from '../utils/respond.js';
import { pagination, pageMeta } from '../utils/pagination.js';
import { transaction } from '../config/db.js';
import { notify } from '../services/notificationService.js';
const populate = (query) =>
  query
    .populate('renter owner', PUBLIC_USER_FIELDS)
    .populate('property', 'title coverImage images city district');
export async function member(id, user, session) {
  const conversation = await Conversation.findById(id).session(session || null);
  if (!conversation) throw new ApiError(404, 'Conversation not found.');
  if (![String(conversation.renter), String(conversation.owner)].includes(String(user._id)))
    throw new ApiError(403, 'You are not a participant in this conversation.');
  return conversation;
}
export async function createConversation(req, res) {
  const { propertyId, renterId } = req.validated.body;
  const p = await Property.findOne({ _id: propertyId, deletedAt: null });
  if (!p) throw new ApiError(404, 'Property not found.');
  let renter = req.user._id;
  if (req.user.role === 'owner') {
    if (
      String(p.owner) !== String(req.user._id) ||
      !renterId ||
      !(await Booking.exists({ property: p._id, renter: renterId, owner: req.user._id }))
    )
      throw new ApiError(403, 'Start a conversation from one of your booking requests.');
    renter = renterId;
  } else if (!p.isActive || p.isDraft) throw new ApiError(404, 'Property not found.');
  const filter = { property: p._id, owner: p.owner, renter };
  const c = await Conversation.findOneAndUpdate(
    filter,
    { $setOnInsert: filter },
    { upsert: true, new: true },
  );
  return success(res, c, 'Conversation ready.', 201);
}
export async function conversations(req, res) {
  const filter = { $or: [{ renter: req.user._id }, { owner: req.user._id }] },
    paging = pagination(req.query);
  const [items, total] = await Promise.all([
    populate(Conversation.find(filter))
      .sort({ lastMessageAt: -1, createdAt: -1 })
      .skip(paging.skip)
      .limit(paging.limit),
    Conversation.countDocuments(filter),
  ]);
  const counts = items.length
    ? await Message.aggregate([
        {
          $match: {
            conversation: { $in: items.map((item) => item._id) },
            receiver: req.user._id,
            readAt: null,
          },
        },
        { $group: { _id: '$conversation', count: { $sum: 1 } } },
      ])
    : [];
  const unread = new Map(counts.map((item) => [String(item._id), item.count]));
  const data = items.map((item) => ({
    ...item.toObject(),
    unreadCount: unread.get(String(item._id)) || 0,
  }));
  return success(res, data, 'Conversations loaded.', 200, { pagination: pageMeta(total, paging) });
}
export async function conversation(req, res) {
  await member(req.params.id, req.user);
  return success(res, await populate(Conversation.findById(req.params.id)));
}
export async function messages(req, res) {
  await member(req.params.conversationId, req.user);
  const paging = pagination(req.query),
    filter = { conversation: req.params.conversationId };
  const [items, total] = await Promise.all([
    Message.find(filter).sort({ createdAt: -1, _id: -1 }).skip(paging.skip).limit(paging.limit),
    Message.countDocuments(filter),
  ]);
  return success(res, items.reverse(), 'Messages loaded.', 200, {
    pagination: pageMeta(total, paging),
  });
}
export async function send(req, res) {
  let message;
  await transaction(async (session) => {
    const c = await member(req.validated.body.conversationId, req.user, session);
    const receiver = String(c.renter) === String(req.user._id) ? c.owner : c.renter;
    [message] = await Message.create(
      [
        {
          conversation: c._id,
          sender: req.user._id,
          receiver,
          content: req.validated.body.content,
        },
      ],
      { session },
    );
    c.lastMessage = message.content;
    c.lastMessageAt = message.createdAt;
    await c.save({ session });
    await notify(
      receiver,
      'new_message',
      'New message from ' + req.user.name,
      message.content.slice(0, 100),
      '/' + (req.user.role === 'owner' ? 'renter' : 'owner') + '/messages?conversation=' + c._id,
      session,
    );
  });
  return success(res, message, 'Message sent.', 201);
}
export async function readConversation(req, res) {
  await member(req.params.id, req.user);
  await Message.updateMany(
    { conversation: req.params.id, receiver: req.user._id, readAt: null },
    { $set: { readAt: new Date() } },
  );
  return success(res, null, 'Conversation marked as read.');
}
export async function readMessage(req, res) {
  const message = await Message.findById(req.params.id);
  if (!message) throw new ApiError(404, 'Message not found.');
  if (String(message.receiver) !== String(req.user._id))
    throw new ApiError(403, 'Only the recipient can mark this message as read.');
  if (!message.readAt) {
    message.readAt = new Date();
    await message.save();
  }
  return success(res, message);
}
