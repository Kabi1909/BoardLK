import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
export const authenticate = asyncHandler(async (req, res, next) => {
  const header = req.get('authorization');
  if (!header?.startsWith('Bearer ')) throw new ApiError(401, 'Please log in.');
  let claims;
  try {
    claims = jwt.verify(header.slice(7), req.app.locals.env.jwtSecret, {
      algorithms: ['HS256'],
      issuer: 'boardlk-api',
      audience: 'boardlk-client',
    });
  } catch {
    throw new ApiError(401, 'Your session is invalid or expired. Please log in again.');
  }
  const user = await User.findById(claims.sub).select('+tokenVersion');
  if (!user || user.status !== 'active' || user.tokenVersion !== claims.version)
    throw new ApiError(401, 'Your session is no longer valid.');
  req.user = user;
  next();
});
export const optionalAuth = (req, res, next) =>
  req.get('authorization') ? authenticate(req, res, next) : next();
