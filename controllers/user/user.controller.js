import pool from "../../config/db.config.js";
import { sendFailure, sendSuccess } from "../../utils/api-response.js";
import {
  validateEmail,
  validatePassword,
  validateUsername,
} from "../../utils/user.validation.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import { randomUUID } from "node:crypto";

const googleClient = new OAuth2Client(process.env.OAUTH_CLIENT_ID);

export async function googleAuth(req, res) {
  const { credential } = req.body;
  if (!credential) {
    sendFailure(res, 400, "A Google credential is required");
    return;
  }

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.OAUTH_CLIENT_ID,
    });
    const profile = ticket.getPayload();
    if (!profile?.sub || !profile.email || profile.email_verified !== true) {
      sendFailure(res, 401, "Google account could not be verified");
      return;
    }

    let result = await pool.query(
      `SELECT id, username, email, role, oauth_id FROM users WHERE oauth_id = $1 OR email = $2 ORDER BY (oauth_id = $1) DESC LIMIT 1`,
      [profile.sub, profile.email]
    );

    if (result.rows.length && result.rows[0].oauth_id && result.rows[0].oauth_id !== profile.sub) {
      sendFailure(res, 409, "This email is linked to a different Google account");
      return;
    }

    if (result.rows.length === 0) {
      const baseUsername = profile.email.split("@")[0].slice(0, 40) || "user";
      let username = baseUsername;
      let suffix = 1;
      while (true) {
        try {
          const password = await bcrypt.hash(`${profile.sub}:${randomUUID()}`, 10);
          result = await pool.query(
            `INSERT INTO users (username, email, password, oauth_id) VALUES ($1, $2, $3, $4) RETURNING id, username, email, role, oauth_id`,
            [username, profile.email, password, profile.sub]
          );
          break;
        } catch (error) {
          // existing user signup conflict
          if (error.code !== "23505") throw error;
          const existing = await pool.query(
            `SELECT id, username, email, role, oauth_id FROM users WHERE oauth_id = $1 OR email = $2 ORDER BY (oauth_id = $1) DESC LIMIT 1`,
            [profile.sub, profile.email]
          );
          if (existing.rows.length) {
            if (existing.rows[0].oauth_id && existing.rows[0].oauth_id !== profile.sub) throw error;
            result = existing;
            break;
          }
          username = `${baseUsername.slice(0, 40 - String(suffix).length - 1)}_${suffix++}`;
        }
      }
    }

    if (!result.rows[0].oauth_id) {
      result = await pool.query(
        `UPDATE users SET oauth_id = $1 WHERE id = $2 RETURNING id, username, email, role, oauth_id`,
        [profile.sub, result.rows[0].id]
      );
    }

    const user = result.rows[0];
    const token = jwt.sign(
      { sub: user.id, username: user.username, email: user.email, role: user.role || "user" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    sendSuccess(res, 200, "Google authentication successful", {
      id: user.id,
      username: user.username,
      role: user.role || "user",
      token,
    });
  } catch (error) {
    if (error.code === "23505") {
      sendFailure(res, 409, "A user with that email already exists");
      return;
    }
    console.error("Could not authenticate with Google:", error);
    sendFailure(res, error.message?.includes("Invalid token") || error.message?.includes("Wrong recipient") ? 401 : 500, "Could not authenticate with Google");
  }
}

export async function registerUser(req, res) {
  const usernameResult = validateUsername(req.body?.username);
  const emailResult = validateEmail(req.body?.email);
  const passwordResult = validatePassword(req.body?.password);
  const validationError = usernameResult.error || emailResult.error || passwordResult.error;
  if (validationError) {
    return sendFailure(res, 400, validationError);
  }

  const { value: username } = usernameResult;
  const { value: email } = emailResult;
  const { value: password } = passwordResult;

  try {
    const existingUser = await pool.query(
      `SELECT username, email FROM users WHERE username = $1 OR email = $2`,
      [username, email]
    );

    if (existingUser.rows.some((user) => user.username === username)) {
      return sendFailure(res, 409, "Username already exists");
    }

    if (existingUser.rows.some((user) => user.email === email)) {
      return sendFailure(res, 409, "Email already exists");
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING id, username`,
      [username, email, hashedPassword]
    );

    const token = jwt.sign(
        { sub: result.rows[0].id, username: result.rows[0].username, email, role: "user" },
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
  const usernameResult = validateUsername(req.body?.username);
  const passwordResult = validatePassword(req.body?.password);
  const validationError = usernameResult.error || passwordResult.error;
  
  if (validationError) {
    sendFailure(res, 400, validationError);
    return;
  }

  const { value: username } = usernameResult;
  const { value: password } = passwordResult;

  try {
    const result = await pool.query(
      `SELECT id, username, email, password, role FROM users WHERE username = $1 or email = $1`,
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
