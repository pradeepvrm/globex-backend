import pool from "../../config/db.config.js";
import { sendFailure, sendSuccess } from "../../utils/api-response.js";
import { sendEmail } from "../../config/nodemailer.config.js";

const ORDER_STATUSES = ["pending", "confirmed", "shipped", "delivered", "cancelled"];

export async function updateOrderStatus(req, res) {
  const { status } = req.body;

  if (!ORDER_STATUSES.includes(status)) {
    return sendFailure(res, 400, "Invalid order status");
  }

  try {
    const result = await pool.query(
      `UPDATE orders SET status = $1
       WHERE order_number = $2 AND status IS DISTINCT FROM $1
       RETURNING order_number AS id, status, user_id AS "userId"`,
      [status, req.params.orderNumber],
    );

    if (result.rowCount === 0) {
      const existingOrder = await pool.query(
        `SELECT order_number AS id, status
         FROM orders
         WHERE order_number = $1`,
        [req.params.orderNumber],
      );

      if (existingOrder.rowCount === 0) {
        return sendFailure(res, 404, "Order not found");
      }

      return sendSuccess(res, 200, "Order status updated successfully", existingOrder.rows[0]);
    }

    const order = result.rows[0];
    try {
      const userResult = await pool.query(
        `SELECT username, email FROM users WHERE id = $1`,
        [order.userId],
      );
      const user = userResult.rows[0];

      if (!user) {
        throw new Error(`Could not find the user for order ${order.id}.`);
      }

      await sendEmail({
        to: user.email,
        subject: `Order ${order.id} status updated`,
        text: `Hi ${user.username},\n\nThe status of your order ${order.id} has changed to ${order.status}.`,
      });
    } catch (error) {
      console.error("Could not send order status notification:", error);
    }

    sendSuccess(res, 200, "Order status updated successfully", {
      id: order.id,
      status: order.status,
    });
  } catch (error) {
    console.error("Could not update order status:", error);
    sendFailure(res, 500, "Could not update order status");
  }
}
