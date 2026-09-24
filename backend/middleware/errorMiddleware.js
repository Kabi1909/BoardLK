import mongoose from 'mongoose';
import multer from 'multer';
export default function errorMiddleware(error, req, res, next) {
  if (res.headersSent) return next(error);
  let status = error.statusCode || 500,
    message = error.message,
    errors = error.errors || [];
  if (error instanceof mongoose.Error.CastError) {
    status = 400;
    message = 'Invalid resource identifier.';
    errors = [];
  }
  if (error instanceof mongoose.Error.ValidationError) {
    status = 422;
    message = 'Validation failed.';
    errors = Object.values(error.errors).map((e) => ({ field: e.path, message: e.message }));
  }
  if (error.code === 11000) {
    status = 409;
    message = 'A record with these details already exists.';
    errors = [];
  }
  if (error instanceof multer.MulterError) {
    status = 422;
    message =
      error.code === 'LIMIT_FILE_SIZE'
        ? 'Each file must be 5 MB or smaller.'
        : 'Too many files or an unexpected upload field.';
    errors = [];
  }
  if (error.type === 'entity.parse.failed') {
    status = 400;
    message = 'Malformed JSON body.';
    errors = [];
  }
  if (error.type === 'entity.too.large') {
    status = 413;
    message = 'Request body is too large.';
    errors = [];
  }
  if (error.name === 'VersionError') {
    status = 409;
    message = 'This record changed. Reload and retry.';
    errors = [];
  }
  if (status >= 500) {
    if (process.env.NODE_ENV !== 'test') console.error('[API error]', error.name);
    message = status === 503 ? message : 'An unexpected server error occurred.';
    errors = [];
  }
  res.status(status).json({ success: false, message, errors: Array.isArray(errors) ? errors : [] });
}
