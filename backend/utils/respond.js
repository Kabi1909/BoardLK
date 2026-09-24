export function success(res, data, message = 'Request successful', status = 200, extra = {}) {
  return res.status(status).json({ success: true, message, data, ...extra });
}
export const idEquals = (left, right) => String(left?._id || left) === String(right?._id || right);
