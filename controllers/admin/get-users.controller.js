import pool from "../../config/db.config.js";
import { sendFailure, sendSuccess } from "../../utils/api-response.js";


// Get all users
export async function getUsers(req, res) {
  try {
    const result = await pool.query(
      `SELECT id, username, email, created_at, role FROM users ORDER BY id`,
    );
    sendSuccess(res, 200, "Users retrieved successfully", result.rows);
  } catch (error) {
    console.error("Could not load users:", error);
    sendFailure(res, 500, "Could not load users");
  }
};

// Get orders by user ID
export async function getOrdersbyUser(req, res) {
  const userId = req.params.userId;
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
       WHERE o.user_id = $1
       GROUP BY o.id
       ORDER BY o.placed_at DESC`,
      [userId]
    );
    sendSuccess(res, 200, "Orders retrieved successfully", result.rows);
  } catch (error) {
    console.error("Could not load orders:", error);
    sendFailure(res, 500, "Could not load orders");
  }
};

// Delete a user with their user ID
export async function deleteUser(req, res) {
  const userId = req.params.userId;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const user = await client.query("SELECT id FROM users WHERE id = $1 FOR UPDATE", [userId]);
    if (user.rowCount === 0) {
      await client.query("ROLLBACK");
      return sendFailure(res, 404, "User not found");
    }
    await client.query(
      `DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE user_id = $1)`,
      [userId],
    );
    await client.query("DELETE FROM orders WHERE user_id = $1", [userId]);
    await client.query("DELETE FROM users WHERE id = $1", [userId]);
    await client.query("COMMIT");
    sendSuccess(res, 200, "User deleted successfully", { id: Number(userId) });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Could not delete user:", error);
    sendFailure(res, 500, "Could not delete user");
  } finally {
    client.release();
  }
}

// Update a user's role.
export async function updateUserRole(req, res) {
  const { userId } = req.params;
  const { role } = req.body;

  try {
    const result = await pool.query(
      `UPDATE users SET role = $1 WHERE id = $2 RETURNING id, username, email, created_at, role`,
      [role, userId],
    );
    if (result.rowCount === 0) return sendFailure(res, 404, "User not found");
    sendSuccess(res, 200, "User role updated successfully", result.rows[0]);
  } catch (error) {
    console.error("Could not update user role:", error);
    sendFailure(res, 500, "Could not update user role");
  }
}
