import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import products from "./data/products.json" with { type: "json" };

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
const ordersFile = fileURLToPath(new URL("./data/orders.json", import.meta.url));

app.get("/", (req, res) => {
  res.send("The API is up and running!");
});

// get all products and search products
app.get("/api/products", (req, res) => {
  const search = req.query.search;
  const filteredProducts = search ? products.filter((product) =>
        `${product.name}, 
         ${product.category},
         ${product.brand}`.toLowerCase().includes(search)
        )
      : products;

  res.json(filteredProducts);
});

// get a single product by ID
app.get("/api/products/:id", (req, res) => {
  const { id } = req.params;
  const product = products.find((item) => item.id === Number(id));
  if (!product) {
    res.status(404).send("Product not found");
  } else {
    res.json(product);
  }
});

// post order to the orders.json
app.post("/api/orders", (req, res) => {
  const order = { ...req.body, userId: req.body.userId };
  readFile(ordersFile, "utf8")
    .then((data) => {
      const orders = data.trim() ? JSON.parse(data) : [];
      orders.push(order);
      return writeFile(ordersFile, JSON.stringify(orders, null, 2));
    })
    .then(() => res.status(201).json(order))
    .catch(() => res.status(500).json({ error: "Could not save order" }));
});

// get orders by userId
app.get("/api/orders/:userId", (req, res) => {
  const { userId } = req.params;
  readFile(ordersFile, "utf8")
    .then((data) => {
      const orders = data.trim() ? JSON.parse(data) : [];
      const userOrders = orders.filter((item) => item.userId === userId);
      if (!userOrders) {
        res.status(404).send("No orders found for this user");
      } else {
        res.json(userOrders);
      }
    })
    .catch(() => res.status(500).json({ error: "Could not load order" }));
});

app.listen(PORT, () => {
  console.log(`Server is running on port http://localhost:${PORT}`);
});
