import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import createRoutes from './routes/index.js';
import errorMiddleware from './middleware/errorMiddleware.js';
import notFound from './middleware/notFoundMiddleware.js';
import { sendResetEmail } from './services/mailService.js';
import { imageStorage } from './services/imageService.js';
import ApiError from './utils/ApiError.js';
export function createApp(env, adapters = {}) {
  const app = express();
  app.locals.env = env;
  app.locals.sendResetEmail = adapters.sendResetEmail || sendResetEmail;
  app.locals.mailerReady = Boolean(
    adapters.sendResetEmail || (process.env.SMTP_HOST && process.env.SMTP_FROM),
  );
  app.locals.imageStorage = adapters.imageStorage || imageStorage;
  app.disable('x-powered-by');
  app.set('trust proxy', env.trustProxy);
  app.use(helmet());
  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || env.origins.includes(origin)) return callback(null, true);
        callback(new ApiError(403, 'Origin is not allowed.'));
      },
      credentials: false,
    }),
  );
  app.use(
    rateLimit({
      windowMs: 15 * 60000,
      limit: 1000,
      standardHeaders: 'draft-8',
      legacyHeaders: false,
      message: { success: false, message: 'Too many requests. Try again later.', errors: [] },
    }),
  );
  app.use(express.json({ limit: '100kb' }));
  // Log the route path without reset tokens, query strings, authorization or request bodies.
  if (env.nodeEnv !== 'test')
    app.use(
      morgan((tokens, req, res) =>
        [
          req.method,
          req.path.startsWith('/api/auth/reset-password/')
            ? '/api/auth/reset-password/[redacted]'
            : req.path,
          tokens.status(req, res),
          tokens['response-time'](req, res) + ' ms',
        ].join(' '),
      ),
    );
  app.use('/api', createRoutes());
  app.use(notFound);
  app.use(errorMiddleware);
  return app;
}
