import { authenticateToken } from "./auth.middleware.js";
import { sendFailure } from "../utils/api-response.js";

export async function isAdmin(req, res, next) {
  return authenticateToken(req, res, () => {
    if (req.user.role !== "admin") {
      return sendFailure(res, 403, "Forbidden");
    }
    next();
  });
}
