import pool from "../../config/db.config.js";
import { sendFailure, sendSuccess } from "../../utils/api-response.js";

export async function getDashboardStats(req, res) {
  try {
    const result = await pool.query(
      `SELECT
         COALESCE((SELECT SUM(total) FROM orders), 0)::float AS revenue,
         (SELECT COUNT(*) FROM orders)::int AS "totalOrders",
         (SELECT COUNT(*) FROM users)::int AS "totalUsers",
         (SELECT COUNT(*) FROM products)::int AS "totalProducts",
         (SELECT COUNT(*) FROM products WHERE quantity = 0)::int AS "outOfStockProducts",
         (SELECT COUNT(*) FROM orders WHERE status = 'pending')::int AS "pendingOrders",
         (SELECT COUNT(*) FROM orders WHERE status = 'cancelled')::int AS "cancelledOrders"`,
    );
    sendSuccess(res, 200, "Dashboard statistics retrieved successfully", result.rows[0]);
  } catch (error) {
    console.error("Could not load admin dashboard statistics:", error);
    sendFailure(res, 500, "Could not load dashboard statistics");
  }
}
