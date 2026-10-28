import pool from "../../config/db.config.js";
import { parseProduct } from "./product.validation.js";

const PRODUCT_COLUMNS = `id, category, name, brand,
       price::float AS price,
       original_price::float AS "originalPrice",
       rating::float AS rating, currency, image, gallery,
       image_alt AS "imageAlt", description`;

export async function createProduct(req, res) {
  const { errors, data } = parseProduct(req.body);

  if (errors.length) {
    return res.status(400).json({ error: errors.join(" ") });
  }

  try {
    const result = await pool.query(
      `INSERT INTO products (category, name, brand, price, original_price, rating,
                             currency, image, gallery, image_alt, description)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
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
      ],
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Could not create product:", error);
    res.status(500).json({ error: "Could not create product" });
  }
}
