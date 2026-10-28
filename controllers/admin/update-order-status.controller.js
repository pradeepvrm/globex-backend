import pool from "../../config/db.config.js";
import { sendFailure, sendSuccess } from "../../utils/api-response.js";

const ORDER_STATUSES = ["pending", "confirmed", "shipped", "delivered", "cancelled"];

export async function updateOrderStatus(req, res) {
  const { status } = req.body;

  if (!ORDER_STATUSES.includes(status)) {
    return sendFailure(res, 400, "Invalid order status");
  }

  try {
    const result = await pool.query(
      `UPDATE orders SET status = $1
       WHERE order_number = $2
       RETURNING order_number AS id, status`,
      [status, req.params.orderNumber],
    );

    if (result.rowCount === 0) {
      return sendFailure(res, 404, "Order not found");
    }

    sendSuccess(res, 200, "Order status updated successfully", result.rows[0]);
  } catch (error) {
    console.error("Could not update order status:", error);
    sendFailure(res, 500, "Could not update order status");
  }
}
