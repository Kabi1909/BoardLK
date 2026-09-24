import multer from 'multer';
import ApiError from '../utils/ApiError.js';
export default multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 8, fields: 2 },
  fileFilter(req, file, cb) {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype))
      return cb(new ApiError(422, 'Only JPEG, PNG and WebP images are supported.'));
    cb(null, true);
  },
});
