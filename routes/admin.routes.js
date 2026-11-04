import { Router } from "express";
import { getOrders } from "../controllers/admin/get-orders.controller.js";
import { updateOrderStatus } from "../controllers/admin/update-order-status.controller.js";
import { getProducts } from "../controllers/admin/get-products.controller.js";
import { createProduct } from "../controllers/admin/create-product.controller.js";
import { updateProduct } from "../controllers/admin/update-product.controller.js";
import { deleteProduct } from "../controllers/admin/delete-product.controller.js";
import { getUsers, getOrdersbyUser, deleteUser } from "../controllers/admin/get-users.controller.js";

const router = Router();

// order routes
router.get("/orders", getOrders);
router.patch("/orders/:orderNumber/status", updateOrderStatus);

// product routes
router.get("/products", getProducts);
router.post("/products", createProduct);
router.put("/products/:id", updateProduct);
router.delete("/products/:id", deleteProduct);

//user routes
router.get("/users", getUsers);
router.delete("/users/:userId", deleteUser);
router.get("/users/:userId/orders", getOrdersbyUser);

export default router;
