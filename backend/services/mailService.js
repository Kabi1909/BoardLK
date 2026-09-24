import nodemailer from 'nodemailer';
import ApiError from '../utils/ApiError.js';
export async function sendResetEmail({ email, url }) {
  if (!process.env.SMTP_HOST || !process.env.SMTP_FROM)
    throw new ApiError(
      503,
      'Password reset email is not configured. Contact the service operator.',
    );
  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_PORT === '465',
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      : undefined,
  });
  await transport.sendMail({
    from: process.env.SMTP_FROM,
    to: email,
    subject: 'Reset your BoardLK password',
    text:
      'Use this link to reset your password: ' +
      url +
      '\nIf you did not request this, ignore this email.',
  });
}
