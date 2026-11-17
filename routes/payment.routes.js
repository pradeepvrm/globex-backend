import { createPaymentOrder, verifyPayment } from "../controllers/payment.controller.js";
import { Router } from "express";

const router = Router();

router.post("/create-order", createPaymentOrder);
router.post("/verify", verifyPayment);

export default router;