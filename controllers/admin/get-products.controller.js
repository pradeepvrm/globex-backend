import pool from "../../config/db.config.js";

const PRODUCT_COLUMNS = `id, category, name, brand,
       price::float AS price,
       original_price::float AS "originalPrice",
       rating::float AS rating, currency, image, gallery,
       image_alt AS "imageAlt", description`;

export async function getProducts(req, res) {
  try {
    const result = await pool.query(
      `SELECT ${PRODUCT_COLUMNS} FROM products ORDER BY id`,
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Could not load admin products:", error);
    res.status(500).json({ error: "Could not load products" });
  }
}
