import pool from "../../config/db.config.js";
import { sendFailure, sendSuccess } from "../../utils/api-response.js";

export async function getOrderItems(req, res) {
  try {
    const result = await pool.query(
      `SELECT COALESCE(
                json_agg(json_build_object(
                  'id', oi.product_id, 'name', oi.product_name, 'brand', oi.brand,
                  'price', oi.unit_price, 'quantity', oi.quantity, 'image', oi.image_url,
                  'imageAlt', oi.image_alt, 'size', COALESCE(oi.size, '')
                ) ORDER BY oi.product_name)
                FILTER (WHERE oi.order_id IS NOT NULL),
                '[]'::json
              ) AS items
       FROM orders o
       LEFT JOIN order_items oi ON oi.order_id = o.id
       WHERE o.order_number = $1
       GROUP BY o.id`,
      [req.params.orderNumber],
    );

    if (result.rowCount === 0) {
      return sendFailure(res, 404, "Order not found");
    }

    sendSuccess(res, 200, "Order items retrieved successfully", result.rows[0].items);
  } catch (error) {
    console.error("Could not load order items:", error);
    sendFailure(res, 500, "Could not load order items");
  }
}
