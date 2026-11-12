import pool from "../../config/db.config.js";
import { parseProduct } from "../../utils/product.validation.js";
import { sendFailure, sendSuccess } from "../../utils/api-response.js";

const PRODUCT_COLUMNS = `id, category, name, brand,
       price::float AS price,
       original_price::float AS "originalPrice",
       rating::float AS rating, 'Rs.' AS currency, image, gallery,
       image_alt AS "imageAlt", description, quantity`;

export async function createProduct(req, res) {
  const data = parseProduct({
    ...req.body,
    gallery: [req.body.image, ...(Array.isArray(req.body.gallery) ? req.body.gallery : [])],
  });

  if (!data.image) {
    return sendFailure(res, 400, "A main product image is required.");
  }

  try {
    const result = await pool.query(
      `INSERT INTO products (category, name, brand, price, original_price, rating, currency, image, gallery, image_alt, description, quantity)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING ${PRODUCT_COLUMNS}`,
      [
        data.category,
        data.name,
        data.brand,
        data.price,
        data.originalPrice,
        data.rating,
        data.currency,
        data.image,
        data.gallery,
        data.imageAlt,
        data.description,
        data.quantity,
      ],
    );

    sendSuccess(res, 201, "Product created successfully", result.rows[0]);
  } catch (error) {
    console.error("Could not create product:", error);
    sendFailure(res, 500, "Could not create product");
  }
}
