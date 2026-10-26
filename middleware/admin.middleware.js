import { clerkClient, getAuth } from "@clerk/express";

export async function isAdmin(req, res, next) {
  try {
    const { userId } = getAuth(req);

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const user = await clerkClient.users.getUser(userId);

    if (user.publicMetadata?.role !== "admin") {
      return res.status(403).json({ error: "Forbidden" });
    }

    next();
  } catch (error) {
    console.error("Admin auth failed:", error);
    res.status(401).json({ error: "Unauthorized" });
  }
}
