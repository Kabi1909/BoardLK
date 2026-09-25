import 'dotenv/config';
import jwt from 'jsonwebtoken';
export function readEnv() {
  const env = {
    port: Number(process.env.PORT || 5000),
    nodeEnv: process.env.NODE_ENV || 'development',
    mongoUri: process.env.MONGO_URI,
    jwtSecret: process.env.JWT_SECRET,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
    origins: (process.env.FRONTEND_URL || 'http://localhost:5173')
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean),
    trustProxy: Number(process.env.TRUST_PROXY || 0),
  };
  if (!env.mongoUri) throw new Error('MONGO_URI must be configured.');
  if (!env.jwtSecret || env.jwtSecret.length < 32)
    throw new Error('JWT_SECRET must contain at least 32 characters.');
  if (!Number.isInteger(env.port) || env.port < 1 || env.port > 65535)
    throw new Error('PORT must be a valid TCP port.');
  if (!Number.isInteger(env.trustProxy) || env.trustProxy < 0)
    throw new Error('TRUST_PROXY must be a nonnegative hop count.');
  if (env.origins.includes('*')) throw new Error('Configure explicit FRONTEND_URL origins.');
  if (!['development', 'test', 'production'].includes(env.nodeEnv))
    throw new Error('NODE_ENV must be development, test or production.');
  if (!/^mongodb(?:\+srv)?:\/\//.test(env.mongoUri))
    throw new Error('MONGO_URI must use a MongoDB connection scheme.');
  if (!env.origins.length) throw new Error('At least one FRONTEND_URL origin is required.');
  for (const origin of env.origins) {
    let url;
    try {
      url = new URL(origin);
    } catch {
      throw new Error('FRONTEND_URL contains an invalid origin.');
    }
    if (!['http:', 'https:'].includes(url.protocol) || url.origin !== origin)
      throw new Error(
        'FRONTEND_URL must contain origins without paths, credentials or trailing slashes.',
      );
    if (env.nodeEnv === 'production' && url.protocol !== 'https:')
      throw new Error('Production FRONTEND_URL origins must use HTTPS.');
  }
  try {
    const claims = jwt.decode(jwt.sign({}, env.jwtSecret, { expiresIn: env.jwtExpiresIn }));
    if (claims.exp <= claims.iat) throw new Error('Token duration must be positive.');
  } catch {
    throw new Error('JWT_EXPIRES_IN must be a valid token duration.');
  }
  const rounds = Number(process.env.BCRYPT_SALT_ROUNDS || 12);
  const resetMinutes = Number(process.env.RESET_TOKEN_EXPIRES_MINUTES || 30);
  if (!Number.isInteger(rounds) || rounds < 4 || rounds > 15)
    throw new Error('BCRYPT_SALT_ROUNDS must be an integer between 4 and 15.');
  if (!Number.isInteger(resetMinutes) || resetMinutes < 1 || resetMinutes > 1440)
    throw new Error('RESET_TOKEN_EXPIRES_MINUTES must be between 1 and 1440.');
  return env;
}
