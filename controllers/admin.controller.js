import pool from "../config/db.config.js";

const ORDER_STATUSES = ["pending", "confirmed", "shipped", "delivered", "cancelled"];

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
    res.json(result.rows);
  } catch (error) {
    console.error("Could not load admin orders:", error);
    res.status(500).json({ error: "Could not load orders" });
  }
}

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
