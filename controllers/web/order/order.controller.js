import pool from "../../../config/db.config.js";
import { sendFailure, sendSuccess } from "../../../utils/api-response.js";
import { sendEmail } from "../../../config/nodemailer.config.js";

export async function createOrder(req, res) {
  const { id, paymentMethod, items, subtotal, shipping, total } = req.body;
  const userId = req.user.sub;

  try {
    const orderResult = await pool.query(
      `INSERT INTO orders (order_number, user_id, payment_method, subtotal, shipping, total)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [id, userId, paymentMethod, subtotal, shipping, total],
    );
    const orderId = orderResult.rows[0].id;

    for (const item of items) {
      await pool.query(
        `INSERT INTO order_items (order_id, product_id, product_name, brand, unit_price,
                                  quantity, image_url, image_alt, size)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          orderId,
          item.id,
          item.name,
          item.brand,
          item.price,
          item.quantity,
          item.image,
          item.imageAlt,
          item.size || null,
        ],
      );
    }

    // user email
    try {
      const itemSummary = items
      .map((item) => `${item.name} x${item.quantity} (Rs. ${item.price} each)`)

      await sendEmail({
        to: req.user.email,
        subject: `Order ${id} confirmed`,
        text: [`Hi ${req.user.username},\n\nYour order ${id} has been confirmed.\nTotal: Rs. ${total}\n\n Order Summary`, itemSummary].join("\n"),
      });
    } catch (error) {
      console.error("Could not send order confirmation email:", error);
    }

    // admin email
    try {
      const itemSummary = items
        .map((item) => `- ${item.name} x${item.quantity} (Rs. ${item.price} each)`)
        .join("\n");

      await sendEmail({
        to: process.env.ADMIN_EMAIL,
        subject: `New order ${id} received`,
        text: [
          `A new order has been placed.`,
          ``,
          `Order id: ${id}`,
          `Customer: @${req.user.username} (${req.user.email})`,
          `Payment method: ${paymentMethod}`,
          `Subtotal: Rs. ${subtotal}`,
          `Shipping: Rs. ${shipping}`,
          `Total: Rs. ${total}`,
          ``,
          `Items:`,
          itemSummary,
        ].join("\n"),
      });
    } catch (error) {
      console.error("Could not send new-order notification to admin:", error);
    }

    sendSuccess(res, 201, "Order created successfully", { ...req.body, status: "confirmed" });
  } catch (error) {
    console.error("Could not save order:", error);
    sendFailure(res, 500, "Could not save order");
  }
}

export async function getOrdersByUserId(req, res) {
  try {
    const result = await pool.query(
      `SELECT o.order_number AS id, o.user_id AS "userId", o.status,
              o.placed_at AS "placedAt", o.payment_method AS "paymentMethod",
              o.subtotal, o.shipping, o.total,
              json_agg(json_build_object(
                'id', oi.product_id, 'name', oi.product_name, 'brand', oi.brand,
                'price', oi.unit_price, 'quantity', oi.quantity, 'image', oi.image_url,
                'imageAlt', oi.image_alt, 'size', COALESCE(oi.size, '')
              )) AS items
       FROM orders o
       JOIN order_items oi ON oi.order_id = o.id
       WHERE o.user_id = $1
       GROUP BY o.id
       ORDER BY o.placed_at DESC`,
      [req.user.sub],
    );
    sendSuccess(res, 200, "Orders retrieved successfully", result.rows);
  } catch (error) {
    console.error("Could not load orders:", error);
    sendFailure(res, 500, "Could not load orders");
  }
}
