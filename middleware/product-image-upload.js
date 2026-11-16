import multer from "multer";
import { productImageUpload } from "../config/multer.config.js";
import { sendFailure } from "../utils/api-response.js";

export function uploadProductImages(req, res, next) {
  productImageUpload(req, res, (error) => {
    if (!error) {
      next();
      return;
    }

    if (error instanceof multer.MulterError) {
      const status = error.code === "LIMIT_FILE_SIZE" ? 413 : 400;
      sendFailure(res, status, error.code === "LIMIT_FILE_SIZE"
        ? "Each image must be 10 MB or smaller."
        : "Could not upload the selected images.");
      return;
    }

    if (error.message === "Images must be JPEG, PNG or WebP") {
      sendFailure(res, 400, error.message);
      return;
    }

    next(error);
  });
}
