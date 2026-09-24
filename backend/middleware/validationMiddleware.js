import { z } from 'zod';
import ApiError from '../utils/ApiError.js';
export const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Enter a valid resource ID.');
export const validate =
  (schema, source = 'body') =>
  (req, res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success)
      return next(
        new ApiError(
          422,
          'Validation failed.',
          result.error.issues.map((issue) => ({
            field: issue.path.join('.'),
            message: issue.message,
          })),
        ),
      );
    req.validated = { ...req.validated, [source]: result.data };
    next();
  };
export const validateId = (name = 'id') => validate(z.object({ [name]: objectId }), 'params');
