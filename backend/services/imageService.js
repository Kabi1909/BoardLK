import crypto from 'node:crypto';
import { getCloudinary } from '../config/cloudinary.js';
import ApiError from '../utils/ApiError.js';
export function validateImage(file) {
  const b = file.buffer;
  const jpeg = b.length > 3 && b[0] === 255 && b[1] === 216 && b[2] === 255;
  const png = b.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  const webp = b.subarray(0, 4).toString() === 'RIFF' && b.subarray(8, 12).toString() === 'WEBP';
  const expected = jpeg ? 'image/jpeg' : png ? 'image/png' : webp ? 'image/webp' : null;
  if (!expected || file.mimetype !== expected)
    throw new ApiError(422, 'Upload a valid JPEG, PNG or WebP image.');
}
export const imageStorage = {
  async upload(file, folder) {
    validateImage(file);
    const client = getCloudinary();
    return new Promise((resolve, reject) => {
      const stream = client.uploader.upload_stream(
        {
          folder: 'boardlk/' + folder,
          public_id: crypto.randomUUID(),
          resource_type: 'image',
          allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
          transformation: [{ width: 2000, height: 2000, crop: 'limit' }],
        },
        (error, result) => {
          if (error) return reject(new ApiError(503, 'Image upload failed. Please retry.'));
          resolve({ url: result.secure_url, publicId: result.public_id });
        },
      );
      stream.end(file.buffer);
    });
  },
  async remove(publicId) {
    if (!publicId) return;
    try {
      await getCloudinary().uploader.destroy(publicId, {
        resource_type: 'image',
        invalidate: true,
      });
    } catch {
      throw new ApiError(503, 'Image deletion failed. Please retry.');
    }
  },
};
