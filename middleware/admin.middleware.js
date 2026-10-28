import { clerkClient, getAuth } from "@clerk/express";
import { sendFailure } from "../utils/api-response.js";

export async function isAdmin(req, res, next) {
  try {
    const { userId } = getAuth(req);

    if (!userId) {
      return sendFailure(res, 401, "Unauthorized");
    }

    const user = await clerkClient.users.getUser(userId);

    if (user.publicMetadata?.role !== "admin") {
      return sendFailure(res, 403, "Forbidden");
    }

    next();
  } catch (error) {
    console.error("Admin auth failed:", error);
    sendFailure(res, 401, "Unauthorized");
  }
}
