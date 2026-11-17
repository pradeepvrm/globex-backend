import { Router } from "express";
import productRoutes from "./product.routes.js";
import orderRoutes from "./order.routes.js";
import adminRoutes from "./admin.routes.js";
import userRoutes from "./user.routes.js";
import uploadRoutes from "./upload.routes.js";
import paymentRoutes from "./payment.routes.js";
import { isAdmin } from "../middleware/admin.middleware.js"
import { authenticateToken } from "../middleware/auth.middleware.js";

const app = Router();

app.use("/products", productRoutes);
app.use("/orders", authenticateToken, orderRoutes);
app.use("/payments", authenticateToken, paymentRoutes);
app.use("/uploads", isAdmin, uploadRoutes);
app.use("/admin", isAdmin, adminRoutes);
app.use("/users", userRoutes);

export default app;
