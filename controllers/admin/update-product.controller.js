import pool from "../../config/db.config.js";
import { parseProduct } from "./product.validation.js";

const PRODUCT_COLUMNS = `id, category, name, brand,
       price::float AS price,
       original_price::float AS "originalPrice",
       rating::float AS rating, currency, image, gallery,
       image_alt AS "imageAlt", description`;

export async function updateProduct(req, res) {
  const id = Number(req.params.id);

  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: "Invalid product id" });
  }

  const { errors, data } = parseProduct(req.body);

  if (errors.length) {
    return res.status(400).json({ error: errors.join(" ") });
  }

  try {
    const result = await pool.query(
      `UPDATE products
       SET category = $1, name = $2, brand = $3, price = $4, original_price = $5,
           rating = $6, currency = $7, image = $8, gallery = $9, image_alt = $10,
           description = $11
       WHERE id = $12
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
        id,
      ],
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Could not update product:", error);
    res.status(500).json({ error: "Could not update product" });
  }
}
