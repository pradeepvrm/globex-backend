import pool from "../../config/db.config.js";
import { sendFailure, sendSuccess } from "../../utils/api-response.js";

export async function getOrders(req, res) {
  try {
    const result = await pool.query(
      `SELECT o.order_number AS id, o.user_id AS "userId", o.status,
              o.placed_at AS "placedAt", o.payment_method AS "paymentMethod",
              o.subtotal, o.shipping, o.total,
              json_agg(json_build_object(
                'id', oi.product_id, 'name', oi.product_name, 'brand', oi.brand,
                'price', oi.unit_price, 'quantity', oi.quantity, 'image', oi.image_url,
                'imageAlt', oi.image_alt, 'size', COALESCE(oi.size, '')
              )) FILTER (WHERE oi.order_id IS NOT NULL) AS items
       FROM orders o
       LEFT JOIN order_items oi ON oi.order_id = o.id
       GROUP BY o.id
       ORDER BY o.placed_at DESC`,
    );
    sendSuccess(res, 200, "Orders retrieved successfully", result.rows);
  } catch (error) {
    console.error("Could not load admin orders:", error);
    sendFailure(res, 500, "Could not load orders");
  }
}
