const PRODUCT_CATEGORIES = ["men", "women", "kids"];

export function parseProduct(body) {
  const errors = [];
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const category = typeof body.category === "string" ? body.category.trim().toLowerCase() : "";
  const brand = typeof body.brand === "string" ? body.brand.trim() : "";
  const image = typeof body.image === "string" ? body.image.trim() : "";
  const imageAltInput = typeof body.imageAlt === "string" ? body.imageAlt.trim() : "";
  const description =
    typeof body.description === "string" && body.description.trim()
      ? body.description.trim()
      : null;
  const currency =
    typeof body.currency === "string" && body.currency.trim() ? body.currency.trim() : "Rs.";
  const price = Number(body.price);
  const originalPrice = Number(body.originalPrice);
  const rating =
    body.rating === "" || body.rating === null || body.rating === undefined
      ? null
      : Number(body.rating);
  const gallery = Array.isArray(body.gallery)
    ? body.gallery.map((item) => String(item).trim()).filter(Boolean)
    : [];

  if (!name) errors.push("Name is required.");
  if (!PRODUCT_CATEGORIES.includes(category)) errors.push("Category must be men, women, or kids.");
  if (!brand) errors.push("Brand is required.");
  if (!image) errors.push("Image URL is required.");
  if (!Number.isFinite(price) || price < 0) errors.push("Price must be a non-negative number.");
  if (!Number.isFinite(originalPrice) || originalPrice < 0) {
    errors.push("Original price must be a non-negative number.");
  }
  if (originalPrice < price) errors.push("Original price cannot be lower than the price.");
  if (rating !== null && (!Number.isFinite(rating) || rating < 0 || rating > 5)) {
    errors.push("Rating must be between 0 and 5.");
  }

  return {
    errors,
    data: {
      name,
      category,
      brand,
      image,
      imageAlt: imageAltInput || name,
      description,
      currency,
      price,
      originalPrice,
      rating,
      gallery: gallery.length ? gallery : [image],
    },
  };
}
