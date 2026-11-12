import { sendFailure, sendSuccess } from "../../utils/api-response.js";
import { uploadedImagePath } from "../../middleware/product-image-upload.js";

export function uploadedProductImages(req, res) {
  const imageFile = req.files?.imageFile?.[0];
  const galleryFiles = req.files?.galleryFiles || [];

  if (!imageFile && galleryFiles.length === 0) {
    return sendFailure(res, 400, "Select at least one image to upload.");
  }

  return sendSuccess(res, 201, "Images uploaded successfully", {
    image: imageFile ? uploadedImagePath(imageFile) : null,
    gallery: galleryFiles.map(uploadedImagePath),
  });
}
