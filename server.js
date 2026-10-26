import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import pool from "./config/db.config.js";

dotenv.config();

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map(origin => origin.trim())
  : [];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

const app = express();
app.use(cors(corsOptions));
app.use(express.json());
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("The API is up and running!");
});

// Get all products and search products.
app.get("/api/products", async (req, res) => {
  const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
  try {
    const result = await pool.query(
      `SELECT *
       FROM products
       WHERE $1 = '' OR name ILIKE $2 OR category ILIKE $2 OR brand ILIKE $2
       ORDER BY id`,
      [search, `%${search}%`],
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Could not load products:", error);
    res.status(500).json({ error: "Could not load products" });
  }
});

// get a single product by ID.
app.get("/api/products/:id", async (req, res) => {
  try {
    const product = await pool.query(
      `SELECT * FROM products WHERE id = $1`,
      [req.params.id],
    );
    if (product.rows.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }
    res.json(product.rows[0]);
  } catch (error) {
    console.error("Could not load product:", error);
    res.status(500).json({ error: "Could not load product" });
  }
});

// post orders to db.
app.post("/api/orders", async (req, res) => {
  const { id, userId, paymentMethod, items, subtotal, shipping, total } = req.body;
  
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

    res.status(201).json({ ...req.body, status: "confirmed" });
  } catch (error) {
    console.error("Could not save order:", error);
    res.status(500).json({ error: "Could not save order" });
  }
});

// get orders by userId
app.get("/api/orders/:userId", async (req, res) => {
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
      [req.params.userId],
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Could not load orders:", error);
    res.status(500).json({ error: "Could not load orders" });
  }
});

// connect to the database and start the server
const startServer = async () => {
  try {
    await pool.connect();
    console.log('Connected to the database successfully.');
    app.listen(PORT, () => {
      console.log(`Server is running on port http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Could not connect to the database:', error);
  }
};

startServer();