import { sendFailure, sendSuccess } from "../../utils/api-response.js";
import { uploadProductImage } from "../../config/supabase.config.js";

export async function uploadedProductImages(req, res) {
  const imageFile = req.files?.imageFile?.[0];
  const galleryFiles = req.files?.galleryFiles || [];

  if (!imageFile && galleryFiles.length === 0) {
    return sendFailure(res, 400, "Select at least one image to upload.");
  }

  try {
    const [image, gallery] = await Promise.all([
      imageFile ? uploadProductImage(imageFile) : Promise.resolve(null),
      Promise.all(galleryFiles.map(uploadProductImage)),
    ]);

    return sendSuccess(res, 201, "Images uploaded successfully", {
      image,
      gallery,
    });
  } catch (error) {
    console.error("Could not upload product images:", error);
    return sendFailure(res, 500, "Could not upload the selected images.");
  }
}
