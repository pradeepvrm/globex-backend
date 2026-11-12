import { Router } from "express";
import { uploadedProductImages } from "../controllers/admin/upload-product-images.controller.js";
import { uploadProductImages as receiveProductImages } from "../middleware/product-image-upload.js";

const router = Router();

router.post("/", receiveProductImages, uploadedProductImages);

export default router;
