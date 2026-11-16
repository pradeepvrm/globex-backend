import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: fileURLToPath(new URL("../.env", import.meta.url)) });

const extensionsByMimeType = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

let storage;

function getProductImageStorage() {
  if (storage) {
    return storage;
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  const bucketName = process.env.SUPABASE_STORAGE_BUCKET || "globex-bucket";

  if (!supabaseUrl || !secretKey) {
    throw new Error("Supabase image storage is not configured.");
  }

  const supabase = createClient(supabaseUrl, secretKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  storage = supabase.storage.from(bucketName);
  return storage;
}

export async function uploadProductImage(file) {
  const extension = extensionsByMimeType[file.mimetype];
  if (!extension) {
    throw new Error(`Unsupported product image type: ${file.mimetype}`);
  }

  const path = `products/${randomUUID()}${extension}`;
  const bucket = getProductImageStorage();
  const { error } = await bucket.upload(path, file.buffer, {
    contentType: file.mimetype,
    upsert: false,
  });

  if (error) {
    throw new Error(`Supabase Storage upload failed: ${error.message}`);
  }

  return bucket.getPublicUrl(path).data.publicUrl;
}
