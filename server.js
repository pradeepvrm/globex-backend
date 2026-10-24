import express from "express";
import cors from "cors";
import dotenv from "dotenv";
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
const PORT = process.env.PORT || 3000;

app.get("/api/test", (req, res) => {
  res.send("Hello World!");
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

app.post("/api/orders", (req, res) => {
  console.log("Order received:", req.body);
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});