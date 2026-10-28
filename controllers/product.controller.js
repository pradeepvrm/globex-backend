import pool from "../config/db.config.js";
import { sendFailure, sendSuccess } from "../utils/api-response.js";

const PRODUCT_COLUMNS = `id, category, name, brand,
       price::float AS price,
       original_price::float AS "originalPrice",
       rating::float AS rating, 'Rs.' AS currency, image, gallery,
       image_alt AS "imageAlt", description`;

export async function getProducts(req, res) {
  const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
  try {
    const result = await pool.query(
      `SELECT ${PRODUCT_COLUMNS}
       FROM products
       WHERE $1 = '' OR name ILIKE $2 OR category ILIKE $2 OR brand ILIKE $2
       ORDER BY id`,
      [search, `%${search}%`],
    );
    sendSuccess(res, 200, "Products retrieved successfully", result.rows);
  } catch (error) {
    console.error("Could not load products:", error);
    sendFailure(res, 500, "Could not load products");
  }
}

export async function getProductById(req, res) {
  try {
    const result = await pool.query(
      `SELECT ${PRODUCT_COLUMNS} FROM products WHERE id = $1`,
      [req.params.id],
    );
    if (result.rows.length === 0) {
      return sendFailure(res, 404, "Product not found");
    }
    sendSuccess(res, 200, "Product retrieved successfully", result.rows[0]);
  } catch (error) {
    console.error("Could not load product:", error);
    sendFailure(res, 500, "Could not load product");
  }
}
