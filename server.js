import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { clerkMiddleware } from "@clerk/express";
import pool from "./config/db.config.js";
import router from "./routes/index.js";
import { sendFailure, sendSuccess } from "./utils/api-response.js";

dotenv.config();

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map(origin => origin.trim())
  : [];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

const app = express();
app.use(cors(corsOptions));
app.use(express.json());
app.use(clerkMiddleware());
app.use("/api", router);
app.use("/api", (req, res) => sendFailure(res, 404, "API route not found"));

app.get("/", (req, res) => {
  sendSuccess(res, 200, "The API is up and running", null);
});

app.use((error, req, res, next) => {
  const status = Number.isInteger(error.status) && error.status >= 400 && error.status < 600
    ? error.status
    : 500;
  const msg = status < 500 ? error.message : "Internal server error";

  if (status >= 500) {
    console.error("Unhandled API error:", error);
  }

  sendFailure(res, status, msg);
});

const PORT = process.env.PORT || 3000;
const startServer = async () => {
  try {
    await pool.query("SELECT 1");
    console.log("Connected to the database successfully.");
    app.listen(PORT, () => {
      console.log(`Server is running on port http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Could not connect to the database:", error);
    process.exitCode = 1;
  }
};

startServer();