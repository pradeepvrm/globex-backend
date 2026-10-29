import pool from "../../config/db.config.js";
import { sendFailure, sendSuccess } from "../../utils/api-response.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export async function registerUser(req, res) {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    sendFailure(res, 400, "Username, email, and password are required");
    return;
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING id, username`,
      [username, email, hashedPassword]
    );

    const token = jwt.sign(
        { sub: result.rows[0].id, username: result.rows[0].username, email: email, role: "user" },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
    );

    const data = {
      id: result.rows[0].id,
      username: result.rows[0].username,
      token: token,
    };

    sendSuccess(res, 201, "User registered successfully", data);
  } catch (error) {
    if (error.code === "23505") {
      sendFailure(res, 409, "A user with that username or email already exists");
      return;
    }
    console.error("Could not register user:", error);
    sendFailure(res, 500, "Could not register user");
  }
  
}

export async function loginUser(req, res) {
  const { username, password } = req.body;
  if (!username || !password) {
    sendFailure(res, 400, "Username and password are required");
    return;
  }

  try {
    const result = await pool.query(
      `SELECT id, username, email, password, role FROM users WHERE username = $1`,
      [username]
    );
    if (result.rows.length === 0) {
      sendFailure(res, 401, "Invalid credentials");
      return;
    }

    const user = result.rows[0];
    const passwordMatches = await bcrypt.compare(password, user.password);
    if (!passwordMatches) {
      sendFailure(res, 401, "Invalid credentials");
      return;
    }

    const token = jwt.sign(
        { sub: user.id, username: user.username, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
    )

    sendSuccess(res, 200, "Login successful", {
      id: user.id,
      username: user.username,
      role: user.role,
      token: token,
    });
  } catch (error) {
    console.error("Could not login user:", error);
    sendFailure(res, 500, "Could not login user");
  }
}
