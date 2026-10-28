import pool from "../../config/db.config.js";
import { sendFailure, sendSuccess } from "../../utils/api-response.js";

const PRODUCT_COLUMNS = `id, category, name, brand,
       price::float AS price,
       original_price::float AS "originalPrice",
       rating::float AS rating, 'Rs.' AS currency, image, gallery,
       image_alt AS "imageAlt", description`;

export async function getProducts(req, res) {
  try { 
    const result = await pool.query(
      `SELECT ${PRODUCT_COLUMNS} FROM products ORDER BY id`,
    );
    sendSuccess(res, 200, "Products retrieved successfully", result.rows);
  } catch (error) {
    console.error("Could not load admin products:", error);
    sendFailure(res, 500, "Could not load products");
  }
}
