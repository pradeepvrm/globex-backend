import pool from "../../config/db.config.js";

export async function deleteProduct(req, res) {
  const id = Number(req.params.id);

  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: "Invalid product id" });
  }

  try {
    const result = await pool.query(
      `DELETE FROM products WHERE id = $1`,
      [id],
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Could not delete product:", error);
    res.status(500).json({ error: "Could not delete product" });
  }
}
