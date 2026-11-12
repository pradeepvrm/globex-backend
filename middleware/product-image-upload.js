import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import multer from "multer";
import { sendFailure } from "../utils/api-response.js";

const uploadDirectory = fileURLToPath(new URL("../uploads", import.meta.url));

const extensionsByMimeType = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

//multer configuration
const upload = multer({
  storage: multer.diskStorage({
    destination: uploadDirectory,
    filename: (_req, file, callback) => {
      callback(null, `${randomUUID()}${extensionsByMimeType[file.mimetype]}`);
    },
  }),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 mb
    files: 11,
  },
  fileFilter: (_req, file, callback) => {
    if (!Object.hasOwn(extensionsByMimeType, file.mimetype)) {
      callback(new Error("Images must be JPEG, PNG or WebP"));
      return;
    }
    callback(null, true);
  },
}).fields([
  { name: "imageFile", maxCount: 1 },
  { name: "galleryFiles", maxCount: 10 },
]);

export function uploadProductImages(req, res, next) {
  upload(req, res, (error) => {
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

export function uploadedImagePath(file) {
  const baseUrl = process.env.PUBLIC_BASE_URL;
  return new URL(`/uploads/${file.filename}`, `${baseUrl}/`).href;
}
