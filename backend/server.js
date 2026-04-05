import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

for (const envPath of [path.resolve(__dirname, ".env"), path.resolve(__dirname, "../.env")]) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath, override: false });
  }
}

import authRoutes from "./routes/auth.js";
import cycleRoutes from "./routes/cycle.js";
import aiRoutes from "./routes/ai.js";

const app = express();
const PORT = process.env.PORT || 5001;

// ─── Middleware ─────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ─── Routes ─────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/cycle", cycleRoutes);
app.use("/api/ai", aiRoutes);

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
