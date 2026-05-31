import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, "../.env") });
dotenv.config({ path: path.resolve(__dirname, ".env"), override: true });

import authRoutes from "./routes/auth.js";
import cycleRoutes from "./routes/cycle.js";
import aiRoutes from "./routes/ai.js";

const app = express();
const PORT = process.env.PORT || 5001;

// ─── Middleware ─────────────────────────────────────────────────────
const allowedOrigins = (process.env.FRONTEND_URL || "http://localhost:5173")
  .split(",")
  .map((s) => s.trim());

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, true); // allow all in dev, restrict via env in prod
    }
  },
  credentials: true,
}));
app.use(express.json());

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 50, message: { message: "Too many attempts, try again later" } });
const aiLimiter = rateLimit({ windowMs: 60 * 1000, max: 50, message: { message: "AI rate limit reached, try again in a minute" } });

// ─── Routes ─────────────────────────────────────────────────────────
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/cycle", cycleRoutes);
app.use("/api/ai", aiLimiter, aiRoutes);

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

// ─── Connect to MongoDB & Start Server ──────────────────────────────
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅  MongoDB connected");
    app.listen(PORT, () => {
      console.log(`🚀  Backend running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌  MongoDB connection error:", err.message);
    process.exit(1);
  });

export default app;
