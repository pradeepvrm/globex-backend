import pool from "../../config/db.config.js";
import { parseProduct } from "../../utils/product.validation.js";
import { sendFailure, sendSuccess } from "../../utils/api-response.js";

const PRODUCT_COLUMNS = `id, category, name, brand,
       price::float AS price,
       original_price::float AS "originalPrice",
       rating::float AS rating, 'Rs.' AS currency, image, gallery,
       image_alt AS "imageAlt", description, quantity`;

export async function updateProduct(req, res) {
  const id = Number(req.params.id);

  if (!Number.isInteger(id)) {
    return sendFailure(res, 400, "Invalid product id");
  }

  const data = parseProduct({
    ...req.body,
    gallery: [req.body.image, ...(Array.isArray(req.body.gallery) ? req.body.gallery : [])],
  });

  if (!data.image) {
    return sendFailure(res, 400, "A main product image is required.");
  }

  try {
    const result = await pool.query(
      `UPDATE products
       SET category = $1, name = $2, brand = $3, price = $4, original_price = $5,
           rating = $6, currency = $7, image = $8, gallery = $9, image_alt = $10,
           description = $11, quantity = $12
       WHERE id = $13
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
        id,
      ],
    );

    if (result.rowCount === 0) {
      return sendFailure(res, 404, "Product not found");
    }

    sendSuccess(res, 200, "Product updated successfully", result.rows[0]);
  } catch (error) {
    console.error("Could not update product:", error);
    sendFailure(res, 500, "Could not update product");
  }
}
