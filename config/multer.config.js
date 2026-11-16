import multer from "multer";

const supportedMimeTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

export const productImageUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 11,
  },
  fileFilter: (_req, file, callback) => {
    if (!supportedMimeTypes.has(file.mimetype)) {
      callback(new Error("Images must be JPEG, PNG or WebP"));
      return;
    }
    callback(null, true);
  },
}).fields([
  { name: "imageFile", maxCount: 1 },
  { name: "galleryFiles", maxCount: 10 },
]);
