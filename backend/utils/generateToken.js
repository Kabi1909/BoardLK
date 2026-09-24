import jwt from 'jsonwebtoken';
export default function generateToken(user, env) {
  return jwt.sign({ role: user.role, version: user.tokenVersion }, env.jwtSecret, {
    subject: String(user._id),
    expiresIn: env.jwtExpiresIn,
    issuer: 'boardlk-api',
    audience: 'boardlk-client',
    algorithm: 'HS256',
  });
}
