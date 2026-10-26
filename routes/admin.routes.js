import { Router } from "express";
import { getOrders, updateOrderStatus } from "../controllers/admin.controller.js";

const router = Router();

router.get("/orders", getOrders);
router.patch("/orders/:orderNumber/status", updateOrderStatus);

export default router;
