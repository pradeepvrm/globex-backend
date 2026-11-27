import { Router } from "express";
import { getProductById, getProducts } from "../controllers/web/product/product.controller.js";
import { getProductReviews, getMyProductReview, upsertProductReview, deleteMyProductReview } from "../controllers/web/product/review.controller.js";
import { authenticateToken } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/", getProducts);
router.get("/:id/reviews", getProductReviews);
router.get("/:id/reviews/mine", authenticateToken, getMyProductReview);
router.post("/:id/reviews", authenticateToken, upsertProductReview);
router.delete("/:id/reviews/mine", authenticateToken, deleteMyProductReview);
router.get("/:id", getProductById);

export default router;
