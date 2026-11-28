export function validateProductId(value) {
  const productId =
    typeof value === "string" && /^\d+$/.test(value) ? Number(value) : null;
  const valid = Number.isSafeInteger(productId) && productId > 0;

  return {
    value: valid ? productId : null,
    error: valid ? null : "A valid product id is required",
  };
}

export function validateReviewPagination(pageValue, limitValue) {
  const parsePositiveInteger = (value) => {
    if (typeof value !== "string" || !/^\d+$/.test(value)) return null;
    const parsed = Number(value);
    return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
  };

  const page = parsePositiveInteger(pageValue) || 1;
  const requestedLimit = parsePositiveInteger(limitValue) || 10;
  const limit = Math.min(requestedLimit, 50);
  const offset = (page - 1) * limit;

  return {
    page,
    limit,
    offset,
    error: Number.isSafeInteger(offset) ? null : "Invalid page number",
  };
}

export function validateReview(body = {}) {
  const rating = body?.rating;
  const title = typeof body?.title === "string" ? body.title.trim() : "";
  const text = typeof body?.body === "string" ? body.body.trim() : "";
  let error = null;

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    error = "Rating must be a whole number from 1 to 5";
  } else if (title.length > 120) {
    error = "Review title must be 120 characters or fewer";
  } else if (!text || text.length > 3000) {
    error = "Review text is required and must be 3000 characters or fewer";
  }

  return { value: { rating, title, body: text }, error };
}
