export function parseProduct(body) {
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const image = typeof body.image === "string" ? body.image.trim() : "";
  const gallery = Array.isArray(body.gallery)
    ? body.gallery.map((item) => String(item).trim()).filter(Boolean)
    : [];

  return {
    name,
    category: typeof body.category === "string" ? body.category.trim().toLowerCase() : "",
    brand: typeof body.brand === "string" ? body.brand.trim() : "",
    image,
    imageAlt: typeof body.imageAlt === "string" ? body.imageAlt.trim() || name : name,
    description:
      typeof body.description === "string" && body.description.trim()
        ? body.description.trim()
        : null,
    currency: "Rs.",
    price: Number(body.price),
    originalPrice: Number(body.originalPrice),
    rating:
      body.rating === "" || body.rating === null || body.rating === undefined
        ? null
        : Number(body.rating),
    quantity: Number(body.quantity ?? 0),
    gallery: gallery.length ? gallery : [image],
  };
}
