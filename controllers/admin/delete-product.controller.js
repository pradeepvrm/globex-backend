import pool from "../../config/db.config.js";
import { sendFailure, sendSuccess } from "../../utils/api-response.js";

export async function deleteProduct(req, res) {
  const id = Number(req.params.id);

  if (!Number.isInteger(id)) {
    return sendFailure(res, 400, "Invalid product id");
  }

  try {
    const result = await pool.query(
      `DELETE FROM products WHERE id = $1 RETURNING id`,
      [id],
    );

    if (result.rowCount === 0) {
      return sendFailure(res, 404, "Product not found");
    }

    sendSuccess(res, 200, "Product deleted successfully", result.rows[0]);
  } catch (error) {
    console.error("Could not delete product:", error);
    sendFailure(res, 500, "Could not delete product");
  }
}
