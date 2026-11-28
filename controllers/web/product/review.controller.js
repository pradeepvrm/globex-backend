import pool from "../../../config/db.config.js";
import { sendFailure, sendSuccess } from "../../../utils/api-response.js";
import {
  validateProductId,
  validateReview,
  validateReviewPagination,
} from "../../../utils/review.validation.js";

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

async function productExists(productId) {
  const result = await pool.query("SELECT 1 FROM products WHERE id = $1", [productId]);
  return result.rowCount > 0;
}

export async function getProductReviews(req, res) {
  const productIdResult = validateProductId(req.params.id);
  if (productIdResult.error) return sendFailure(res, 400, productIdResult.error);
  const productId = productIdResult.value;

  const pagination = validateReviewPagination(req.query.page, req.query.limit);
  if (pagination.error) return sendFailure(res, 400, pagination.error);
  const { page: requestedPage, limit, offset } = pagination;

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
  const productIdResult = validateProductId(req.params.id);
  if (productIdResult.error) return sendFailure(res, 400, productIdResult.error);
  const productId = productIdResult.value;

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
  const productIdResult = validateProductId(req.params.id);
  if (productIdResult.error) return sendFailure(res, 400, productIdResult.error);
  const productId = productIdResult.value;
  const reviewResult = validateReview(req.body);
  if (reviewResult.error) return sendFailure(res, 400, reviewResult.error);
  const { rating, title, body } = reviewResult.value;

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
  const productIdResult = validateProductId(req.params.id);
  if (productIdResult.error) return sendFailure(res, 400, productIdResult.error);
  const productId = productIdResult.value;

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
