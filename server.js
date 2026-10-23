import express from "express";
import products from "./data/products.json" with { type: "json" };

const app = express();

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

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});