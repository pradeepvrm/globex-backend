import { Router } from "express";
import productRoutes from "./product.routes.js";
import orderRoutes from "./order.routes.js";
import adminRoutes from "./admin.routes.js";
import { isAdmin } from "../middleware/admin.middleware.js"

const app = Router();

app.use("/products", productRoutes);
app.use("/orders", orderRoutes);
app.use("/admin", isAdmin, adminRoutes);

export default app;
