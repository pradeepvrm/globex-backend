import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import multer from "multer";

const uploadDirectory = fileURLToPath(new URL("../uploads", import.meta.url));

const extensionsByMimeType = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

export const productImageUpload = multer({
  storage: multer.diskStorage({
    destination: uploadDirectory,
    filename: (_req, file, callback) => {
      callback(null, `${randomUUID()}${extensionsByMimeType[file.mimetype]}`);
    },
  }),
  limits: {
    fileSize: 10 * 1024 * 1024,
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
