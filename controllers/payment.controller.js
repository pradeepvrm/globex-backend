import crypto from "node:crypto";
import razorpay from "../config/razorpay.config.js";
import { sendFailure, sendSuccess } from "../utils/api-response.js";

export async function createPaymentOrder(req, res) {
  try {
    const { amount } = req.body;

    if (!amount || !Number.isFinite(Number(amount)) || Number(amount) <= 0) {
      return sendFailure(res, 400, "Invalid payment amount");
    }

    // Amount in rupees converted to paise
    const amountInPaise = Math.round(Number(amount) * 100);

    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    });

    sendSuccess(res, 200, "Payment order created successfully", order);
  } catch (error) {
    console.error("Could not create payment order:", error);
    sendFailure(res, 500, "Could not create payment order");
  }
}

export async function verifyPayment(req, res) {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return sendFailure(res, 400, "Missing payment details");
    }

    const body = `${razorpay_order_id}|${razorpay_payment_id}`;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest();

    const receivedSignature = Buffer.from(razorpay_signature, "hex");

    if (
      receivedSignature.length !== expectedSignature.length ||
      !crypto.timingSafeEqual(expectedSignature, receivedSignature)
    ) {
      return sendFailure(res, 400, "Invalid payment signature");
    }

    // Fetch payment details from Razorpay
    const payment = await razorpay.payments.fetch(razorpay_payment_id);

    if (
      payment.order_id !== razorpay_order_id ||
      payment.status !== "captured"
    ) {
      return sendFailure(res, 400, "Payment has not been captured");
    }

    sendSuccess(res, 200, "Payment verified successfully", {
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
      status: payment.status,
    });
  } catch (error) {
    console.error("Could not verify payment:", error);
    sendFailure(res, 500, "Could not verify payment");
  }
}   