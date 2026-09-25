import ApiError from './ApiError.js';
export function pagination(query = {}) {
  for (const key of ['page', 'limit']) {
    if (
      query[key] !== undefined &&
      (!['string', 'number'].includes(typeof query[key]) || String(query[key]).trim() === '')
    )
      throw new ApiError(422, 'Invalid pagination.', [
        { field: key, message: 'Use a single positive integer.' },
      ]);
  }
  const page = Number(query.page ?? 1),
    limit = Number(query.limit ?? 12);
  if (
    !Number.isInteger(page) ||
    page < 1 ||
    page > 10000 ||
    !Number.isInteger(limit) ||
    limit < 1 ||
    limit > 100
  )
    throw new ApiError(422, 'Invalid pagination.', [
      { field: 'page/limit', message: 'Page must be 1–10000 and limit 1–100.' },
    ]);
  return { page, limit, skip: (page - 1) * limit };
}
export function pageMeta(totalItems, { page, limit }) {
  return {
    page,
    limit,
    totalItems,
    totalPages: Math.ceil(totalItems / limit),
    hasNextPage: page * limit < totalItems,
    hasPreviousPage: page > 1,
  };
}
