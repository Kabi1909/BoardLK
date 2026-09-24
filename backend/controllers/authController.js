import crypto from 'node:crypto';
import User from '../models/User.js';
import RenterProfile from '../models/RenterProfile.js';
import OwnerProfile from '../models/OwnerProfile.js';
import { transaction } from '../config/db.js';
import ApiError from '../utils/ApiError.js';
import generateToken from '../utils/generateToken.js';
import { success } from '../utils/respond.js';
export function safeUser(user) {
  const { _id, name, email, phone, role, profileImage, createdAt } = user;
  return { _id, name, email, phone, role, profileImage, createdAt };
}
export async function register(req, res) {
  const { confirmPassword, ...fields } = req.validated.body;
  let user;
  await transaction(async (session) => {
    [user] = await User.create([fields], { session });
    const Profile = user.role === 'renter' ? RenterProfile : OwnerProfile;
    await Profile.create([{ user: user._id }], { session });
  });
  return success(
    res,
    { user: safeUser(user), token: generateToken(user, req.app.locals.env) },
    'Account created.',
    201,
  );
}
export async function login(req, res) {
  const { email, password } = req.validated.body;
  const user = await User.findOne({ email }).select('+password +tokenVersion');
  if (!user || !(await user.matchesPassword(password)) || user.status !== 'active')
    throw new ApiError(401, 'Email or password is incorrect.');
  return success(
    res,
    { user: safeUser(user), token: generateToken(user, req.app.locals.env) },
    'Logged in.',
  );
}
export async function me(req, res) {
  return success(res, { user: safeUser(req.user) });
}
export async function logout(req, res) {
  await User.updateOne({ _id: req.user._id }, { $inc: { tokenVersion: 1 } });
  return success(res, null, 'Logged out of all sessions.');
}
export async function changePassword(req, res) {
  const user = await User.findById(req.user._id).select('+password +tokenVersion');
  if (!(await user.matchesPassword(req.validated.body.currentPassword)))
    throw new ApiError(422, 'Current password is incorrect.', [
      { field: 'currentPassword', message: 'Current password is incorrect.' },
    ]);
  user.password = req.validated.body.newPassword;
  user.tokenVersion += 1;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();
  return success(
    res,
    { user: safeUser(user), token: generateToken(user, req.app.locals.env) },
    'Password changed.',
  );
}
export async function forgotPassword(req, res) {
  // Configuration is checked for every address, avoiding account discovery through error responses.
  if (!req.app.locals.mailerReady)
    throw new ApiError(
      503,
      'Password reset email is not configured. Contact the service operator.',
    );
  const user = await User.findOne({ email: req.validated.body.email, status: 'active' });
  if (user) {
    const token = crypto.randomBytes(32).toString('hex');
    const hash = crypto.createHash('sha256').update(token).digest('hex');
    await User.updateOne(
      { _id: user._id },
      {
        $set: {
          resetPasswordToken: hash,
          resetPasswordExpires: new Date(
            Date.now() + Number(process.env.RESET_TOKEN_EXPIRES_MINUTES || 30) * 60000,
          ),
        },
      },
    );
    try {
      await req.app.locals.sendResetEmail({
        email: user.email,
        url: req.app.locals.env.origins[0] + '/reset-password?token=' + token,
      });
    } catch {
      await User.updateOne(
        { _id: user._id, resetPasswordToken: hash },
        { $unset: { resetPasswordToken: 1, resetPasswordExpires: 1 } },
      );
    }
  }
  return success(res, null, 'If that account exists, a password reset email will be sent.');
}
export async function resetPassword(req, res) {
  if (!/^[a-f\d]{64}$/i.test(req.params.token))
    throw new ApiError(400, 'Reset link is invalid or expired.');
  const hash = crypto.createHash('sha256').update(req.params.token).digest('hex');
  await transaction(async (session) => {
    const user = await User.findOne({
      resetPasswordToken: hash,
      resetPasswordExpires: { $gt: new Date() },
      status: 'active',
    })
      .select('+tokenVersion')
      .session(session);
    if (!user) throw new ApiError(400, 'Reset link is invalid or expired.');
    user.password = req.validated.body.password;
    user.tokenVersion += 1;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save({ session });
  });
  return success(res, null, 'Password reset. Please log in.');
}
