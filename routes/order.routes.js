import { Router } from "express";
import { createOrder, getOrdersByUserId } from "../controllers/order/order.controller.js";

const router = Router();

router.post("/", createOrder);
router.get("/:userId", getOrdersByUserId);

export default router;
