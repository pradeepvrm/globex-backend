import jwt from "jsonwebtoken";
import { sendFailure } from "../utils/api-response.js";

export function authenticateToken(req, res, next) {
  const authorization = req.headers.authorization;
  const [scheme, token] = authorization?.split(" ") ?? [];

  if (scheme !== "Bearer" || !token) {
    return sendFailure(res, 401, "Unauthorized");
  }
  
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    sendFailure(res, 401, "Unauthorized");
  }
}
