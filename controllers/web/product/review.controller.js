import pool from "../../../config/db.config.js";
import { sendFailure, sendSuccess } from "../../../utils/api-response.js";

const REVIEW_SELECT = `
  r.id,
  r.product_id AS "productId",
  r.user_id AS "userId",
  COALESCE(u.fullname, u.username) AS "reviewerName",
  r.rating,
  r.title,
  r.body,
  r.created_at AS "createdAt",
  r.updated_at AS "updatedAt",
  EXISTS (
    SELECT 1
    FROM order_items oi
    JOIN orders o ON o.id = oi.order_id
    WHERE oi.product_id = r.product_id
      AND o.user_id::text = r.user_id::text
      AND o.status = 'delivered'
  ) AS "verifiedPurchase"`;

function parsePositiveInteger(value) {
  if (typeof value !== "string" || !/^\d+$/.test(value)) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}

async function productExists(productId) {
  const result = await pool.query("SELECT 1 FROM products WHERE id = $1", [productId]);
  return result.rowCount > 0;
}

export async function getProductReviews(req, res) {
  const productId = parsePositiveInteger(req.params.id);
  if (!productId) return sendFailure(res, 400, "A valid product id is required");

  const requestedPage = parsePositiveInteger(req.query.page) || 1;
  const requestedLimit = parsePositiveInteger(req.query.limit) || 10;
  const limit = Math.min(requestedLimit, 50);
  const offset = (requestedPage - 1) * limit;
  if (!Number.isSafeInteger(offset)) return sendFailure(res, 400, "Invalid page number");

  try {
    if (!(await productExists(productId))) return sendFailure(res, 404, "Product not found");

    const [reviewResult, summaryResult] = await Promise.all([
      pool.query(
        `SELECT ${REVIEW_SELECT}
         FROM reviews r
         JOIN users u ON u.id::text = r.user_id::text
         WHERE r.product_id = $1
         ORDER BY r.created_at DESC, r.id DESC
         LIMIT $2 OFFSET $3`,
        [productId, limit, offset]
      ),
      pool.query(
        `SELECT COUNT(*)::int AS "reviewCount",
                COALESCE(ROUND(AVG(rating)::numeric, 1), 0)::float AS "averageRating",
                COUNT(*) FILTER (WHERE rating = 5)::int AS "fiveStarCount",
                COUNT(*) FILTER (WHERE rating = 4)::int AS "fourStarCount",
                COUNT(*) FILTER (WHERE rating = 3)::int AS "threeStarCount",
                COUNT(*) FILTER (WHERE rating = 2)::int AS "twoStarCount",
                COUNT(*) FILTER (WHERE rating = 1)::int AS "oneStarCount"
         FROM reviews WHERE product_id = $1`,
        [productId]
      ),
    ]);

    const summary = summaryResult.rows[0];
    return sendSuccess(res, 200, "Product reviews retrieved successfully", {
      reviews: reviewResult.rows,
      summary,
      pagination: {
        page: requestedPage,
        limit,
        total: summary.reviewCount,
        totalPages: Math.ceil(summary.reviewCount / limit),
      },
    });
  } catch (error) {
    console.error("Could not load product reviews:", error);
    return sendFailure(res, 500, "Could not load product reviews");
  }
}

export async function getMyProductReview(req, res) {
  const productId = parsePositiveInteger(req.params.id);
  if (!productId) return sendFailure(res, 400, "A valid product id is required");

  try {
    if (!(await productExists(productId))) return sendFailure(res, 404, "Product not found");
    const result = await pool.query(
      `SELECT ${REVIEW_SELECT}
       FROM reviews r
       JOIN users u ON u.id::text = r.user_id::text
       WHERE r.product_id = $1 AND r.user_id::text = $2::text`,
      [productId, req.user.sub]
    );
    return sendSuccess(res, 200, "Your product review retrieved successfully", result.rows[0] || null);
  } catch (error) {
    console.error("Could not load user's product review:", error);
    return sendFailure(res, 500, "Could not load your review");
  }
}

// post/edit a review
export async function upsertProductReview(req, res) {
  const productId = parsePositiveInteger(req.params.id);
  const rating = req.body?.rating;
  const title = typeof req.body?.title === "string" ? req.body.title.trim() : "";
  const body = typeof req.body?.body === "string" ? req.body.body.trim() : "";

  if (!productId) return sendFailure(res, 400, "A valid product id is required");
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return sendFailure(res, 400, "Rating must be a whole number from 1 to 5");
  }
  if (title.length > 120) return sendFailure(res, 400, "Review title must be 120 characters or fewer");
  if (!body || body.length > 3000) return sendFailure(res, 400, "Review text is required and must be 3000 characters or fewer");

  try {
    const result = await pool.query(
      `INSERT INTO reviews (product_id, user_id, rating, title, body)
       SELECT $1::bigint, $2, $3, NULLIF($4, ''), $5
       WHERE EXISTS (SELECT 1 FROM products WHERE id = $1::bigint)
       ON CONFLICT (product_id, user_id)
       DO UPDATE SET rating = EXCLUDED.rating,
                     title = EXCLUDED.title,
                     body = EXCLUDED.body,
                     updated_at = NOW()
       RETURNING id, product_id AS "productId", user_id AS "userId",
                 rating, title, body, created_at AS "createdAt", updated_at AS "updatedAt"`,
      [productId, req.user.sub, rating, title, body]
    );
    if (!result.rows.length) return sendFailure(res, 404, "Product not found");

    return sendSuccess(res, 200, "Review saved successfully", result.rows[0]);
  } catch (error) {
    console.error("Could not save product review:", error);
    return sendFailure(res, 500, "Could not save review");
  }
}

export async function deleteMyProductReview(req, res) {
  const productId = parsePositiveInteger(req.params.id);
  if (!productId) return sendFailure(res, 400, "A valid product id is required");

  try {
    const result = await pool.query(
      "DELETE FROM reviews WHERE product_id = $1 AND user_id::text = $2::text RETURNING id",
      [productId, req.user.sub]
    );
    if (!result.rows.length) return sendFailure(res, 404, "Your review was not found");
    return sendSuccess(res, 200, "Review deleted successfully", { id: result.rows[0].id });
  } catch (error) {
    console.error("Could not delete product review:", error);
    return sendFailure(res, 500, "Could not delete review");
  }
}
