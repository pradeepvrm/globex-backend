import bcrypt from "bcrypt";
import pool from "./config/db.config.js";

try {
  const { ADMIN_USERNAME, ADMIN_PASSWORD, ADMIN_EMAIL } = process.env;
  if (!ADMIN_USERNAME || !ADMIN_PASSWORD || !ADMIN_EMAIL) {
    throw new Error("ADMIN_USERNAME, ADMIN_PASSWORD, and ADMIN_EMAIL must be set");
  }

  const existingAdmin = await pool.query(
    "SELECT id FROM users WHERE role = $1",
    ["admin"]
  );

  if (existingAdmin.rows.length > 0) {
    console.log("An admin user already exists; no changes made.");
  } else {
    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);
    await pool.query(
      "INSERT INTO users (username, email, password, role) VALUES ($1, $2, $3, $4)",
      [ADMIN_USERNAME, ADMIN_EMAIL, hashedPassword, "admin"]
    );
    console.log("Admin user created.");
  }
} catch (error) {
  console.error("Could not seed admin user:", error);
  process.exitCode = 1;
} finally {
  await pool.end();
}
