import { Router } from 'express';
import { z } from 'zod';
import rateLimit from 'express-rate-limit';
import asyncHandler from '../utils/asyncHandler.js';
import { authenticate, optionalAuth } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';
import { validate, validateId } from '../middleware/validationMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';
import * as schemas from '../validators/schemas.js';
import * as auth from '../controllers/authController.js';
import * as profile from '../controllers/profileController.js';
import * as property from '../controllers/propertyController.js';
import * as booking from '../controllers/bookingController.js';
import * as favorite from '../controllers/favoriteController.js';
import * as message from '../controllers/messageController.js';
import * as review from '../controllers/reviewController.js';
import * as notification from '../controllers/notificationController.js';
import * as dashboard from '../controllers/dashboardController.js';
import * as image from '../controllers/imageController.js';
import * as health from '../controllers/healthController.js';
export default function createRoutes() {
  const r = Router(),
    a = asyncHandler,
    v = validate,
    owner = authorize('owner'),
    renter = authorize('renter'),
    id = validateId();
  const authLimit = rateLimit({
    windowMs: 15 * 60000,
    limit: 30,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: {
      success: false,
      message: 'Too many authentication attempts. Try again later.',
      errors: [],
    },
  });
  r.get('/health', health.health);
  r.get('/health/live', health.live);
  r.get('/health/ready', a(health.ready));
  r.post('/auth/register', authLimit, v(schemas.register), a(auth.register));
  r.post('/auth/login', authLimit, v(schemas.login), a(auth.login));
  r.get('/auth/me', authenticate, a(auth.me));
  r.post('/auth/logout', authenticate, a(auth.logout));
  r.put(
    '/auth/change-password',
    authenticate,
    authLimit,
    v(schemas.changePassword),
    a(auth.changePassword),
  );
  r.post(
    '/auth/forgot-password',
    authLimit,
    v(z.strictObject({ email: schemas.email })),
    a(auth.forgotPassword),
  );
  r.post('/auth/reset-password/:token', authLimit, v(schemas.resetPassword), a(auth.resetPassword));
  for (const role of ['renter', 'owner']) {
    r.get('/' + role + '/profile', authenticate, authorize(role), a(profile.getProfile));
    r.put(
      '/' + role + '/profile',
      authenticate,
      authorize(role),
      v(schemas.profile),
      a(profile.updateProfile),
    );
    r.post(
      '/' + role + '/profile/photo',
      authenticate,
      authorize(role),
      upload.single('image'),
      a(image.profilePhoto),
    );
    r.get('/' + role + '/dashboard', authenticate, authorize(role), a(dashboard.dashboard));
  }
  r.get('/renter/recently-viewed', authenticate, renter, a(dashboard.recent));
  r.get('/recommendations', authenticate, renter, a(dashboard.recommendations));
  r.get('/owner/properties', authenticate, owner, a(property.mine));
  r.get('/owner/bookings', authenticate, owner, a(booking.list));
  r.get('/owner/bookings/:id', authenticate, owner, id, a(booking.detail));
  r.get('/owner/reviews', authenticate, owner, a(review.list));
  r.get('/properties', a(property.list));
  r.get('/properties/map', a(property.map));
  r.get('/properties/:id/similar', id, a(property.similar));
  r.get('/properties/:id', optionalAuth, id, a(property.detail));
  r.post('/properties', authenticate, owner, v(schemas.property), a(property.create));
  r.put('/properties/:id', authenticate, owner, id, v(schemas.propertyPatch), a(property.update));
  r.delete('/properties/:id', authenticate, owner, id, a(property.remove));
  r.patch(
    '/properties/:id/status',
    authenticate,
    owner,
    id,
    v(schemas.listingStatus),
    a(property.update),
  );
  r.post(
    '/properties/:id/images',
    authenticate,
    owner,
    id,
    a(image.checkOwner),
    upload.array('images', 8),
    a(image.upload),
  );
  r.patch(
    '/properties/:id/cover',
    authenticate,
    owner,
    id,
    a(image.checkOwner),
    v(z.strictObject({ imageId: schemas.id })),
    a(image.cover),
  );
  r.delete(
    '/properties/:id/images/:imageId',
    authenticate,
    owner,
    id,
    validateId('imageId'),
    a(image.checkOwner),
    a(image.remove),
  );
  r.get('/favorites', authenticate, renter, a(favorite.list));
  r.post('/favorites/:propertyId', authenticate, renter, validateId('propertyId'), a(favorite.add));
  r.delete(
    '/favorites/:propertyId',
    authenticate,
    renter,
    validateId('propertyId'),
    a(favorite.remove),
  );
  r.post('/bookings', authenticate, renter, v(schemas.booking), a(booking.create));
  r.get('/bookings/my', authenticate, renter, a(booking.list));
  r.get('/bookings/:id', authenticate, id, a(booking.detail));
  r.patch('/bookings/:id/cancel', authenticate, renter, id, a(booking.transition));
  r.patch(
    '/bookings/:id/status',
    authenticate,
    owner,
    id,
    v(schemas.bookingStatus),
    a(booking.transition),
  );
  r.post('/conversations', authenticate, v(schemas.conversation), a(message.createConversation));
  r.get('/conversations', authenticate, a(message.conversations));
  r.get('/conversations/:id', authenticate, id, a(message.conversation));
  r.patch('/conversations/:id/read', authenticate, id, a(message.readConversation));
  r.get(
    '/messages/:conversationId',
    authenticate,
    validateId('conversationId'),
    a(message.messages),
  );
  r.post('/messages', authenticate, v(schemas.message), a(message.send));
  r.patch('/messages/:id/read', authenticate, id, a(message.readMessage));
  r.get('/reviews/recent', a(review.recent));
  r.post('/reviews', authenticate, renter, v(schemas.review), a(review.create));
  r.get('/reviews/property/:propertyId', validateId('propertyId'), a(review.list));
  r.put('/reviews/:id', authenticate, renter, id, v(schemas.reviewPatch), a(review.update));
  r.delete('/reviews/:id', authenticate, renter, id, a(review.update));
  r.post('/reviews/:id/reply', authenticate, owner, id, v(schemas.reply), a(review.reply));
  r.get('/notifications', authenticate, a(notification.list));
  r.patch('/notifications/read-all', authenticate, a(notification.readAll));
  r.patch('/notifications/:id/read', authenticate, id, a(notification.read));
  return r;
}
