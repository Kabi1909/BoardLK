import Property from '../models/Property.js';
import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import { ownedProperty, serializeProperty } from '../services/propertyService.js';
import { validateImage } from '../services/imageService.js';
import { success } from '../utils/respond.js';
export async function checkOwner(req, res, next) {
  req.property = await ownedProperty(req.params.id, req.user);
  next();
}
export async function upload(req, res) {
  const files = req.files || [];
  if (!files.length) throw new ApiError(422, 'Choose at least one image.');
  files.forEach(validateImage);
  if (req.property.images.length + files.length > 8)
    throw new ApiError(422, 'A property can have at most eight images.');
  const uploaded = [];
  try {
    for (const file of files)
      uploaded.push(
        await req.app.locals.imageStorage.upload(file, 'properties/' + req.property._id),
      );
    req.property.images.push(...uploaded);
    if (!req.property.coverImage) req.property.coverImage = uploaded[0].url;
    await req.property.save();
  } catch (error) {
    for (const image of uploaded) {
      try {
        await req.app.locals.imageStorage.remove(image.publicId);
      } catch {
        await Property.updateOne(
          { _id: req.property._id },
          { $addToSet: { pendingImageCleanup: image.publicId } },
        );
      }
    }
    throw error;
  }
  return success(res, serializeProperty(req.property, true), 'Images uploaded.', 201);
}
export async function cover(req, res) {
  const image = req.property.images.id(req.validated.body.imageId);
  if (!image) throw new ApiError(404, 'Image not found.');
  req.property.coverImage = image.url;
  await req.property.save();
  return success(res, serializeProperty(req.property, true), 'Cover image changed.');
}
export async function remove(req, res) {
  const p = req.property,
    image = p.images.id(req.params.imageId);
  if (!image) throw new ApiError(404, 'Image not found.');
  if (!p.isDraft && p.images.length === 1)
    throw new ApiError(409, 'A published property must keep at least one image.');
  const { url, publicId } = image;
  image.deleteOne();
  if (p.coverImage === url) p.coverImage = p.images[0]?.url;
  if (publicId) p.pendingImageCleanup.addToSet(publicId);
  await p.save();
  if (publicId) {
    try {
      await req.app.locals.imageStorage.remove(publicId);
      await Property.updateOne({ _id: p._id }, { $pull: { pendingImageCleanup: publicId } });
    } catch {
      return success(res, serializeProperty(p, true), 'Image removed; storage cleanup is queued.');
    }
  }
  return success(res, serializeProperty(p, true), 'Image removed.');
}
export async function profilePhoto(req, res) {
  if (!req.file) throw new ApiError(422, 'Choose a profile image.');
  validateImage(req.file);
  const image = await req.app.locals.imageStorage.upload(req.file, 'profiles/' + req.user._id);
  const old = req.user.profileImage?.publicId;
  try {
    await User.updateOne({ _id: req.user._id }, { $set: { profileImage: image } });
  } catch (error) {
    await req.app.locals.imageStorage.remove(image.publicId);
    throw error;
  }
  if (old) {
    try {
      await req.app.locals.imageStorage.remove(old);
    } catch {
      await User.updateOne({ _id: req.user._id }, { $addToSet: { pendingImageCleanup: old } });
    }
  }
  return success(res, image, 'Profile photo updated.');
}
