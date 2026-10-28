import pool from "../../config/db.config.js";

const ORDER_STATUSES = ["pending", "confirmed", "shipped", "delivered", "cancelled"];

export async function updateOrderStatus(req, res) {
  const { status } = req.body;

  if (!ORDER_STATUSES.includes(status)) {
    return res.status(400).json({ error: "Invalid order status" });
  }

  try {
    const result = await pool.query(
      `UPDATE orders SET status = $1
       WHERE order_number = $2
       RETURNING order_number AS id, status`,
      [status, req.params.orderNumber],
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Order not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Could not update order status:", error);
    res.status(500).json({ error: "Could not update order status" });
  }
}
