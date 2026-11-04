import { Router } from "express";
import productRoutes from "./product.routes.js";
import orderRoutes from "./order.routes.js";
import adminRoutes from "./admin.routes.js";
import userRoutes from "./user.routes.js";
import { isAdmin } from "../middleware/admin.middleware.js"
import { authenticateToken } from "../middleware/auth.middleware.js";

const app = Router();

app.use("/products", productRoutes);
app.use("/orders", authenticateToken, orderRoutes);
app.use("/admin",  adminRoutes);
app.use("/users", userRoutes);

export default app;
