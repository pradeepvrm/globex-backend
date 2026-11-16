import { randomUUID } from "node:crypto";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

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
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const bucketName = process.env.SUPABASE_STORAGE_BUCKET;

  if (!supabaseUrl || !serviceRoleKey || !bucketName) {
    throw new Error("Supabase image storage is not configured.");
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
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
