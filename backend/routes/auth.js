import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import auth from "../middleware/auth.js";
import { isValidEmail, isValidPassword, sanitizeString } from "../utils/validate.js";

const router = express.Router();

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });
};

// Sanitize user object for response (strip password)
const sanitizeUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  userState: user.userState,
  isOnboarded: user.isOnboarded,
  cycleProfile: user.cycleProfile,
  pregnancy: user.pregnancy,
  postpartum: user.postpartum,
  preferences: user.preferences,
});

// ─── POST /api/auth/register ────────────────────────────────────────
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ message: "Please fill in all required fields" });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    if (!isValidPassword(password)) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const safeName = sanitizeString(name, 100);

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "An account with this email already exists" });
    }

    // Create user
    const user = await User.create({
      name: safeName,
      email: email.toLowerCase(),
      password,
      userState: "cycle",
      isOnboarded: false,
      cycleProfile: {},
      pregnancy: {},
      postpartum: {},
    });

    const token = generateToken(user._id);

    res.status(201).json({
      token,
      user: sanitizeUser(user),
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ message: "Server error during registration" });
  }
});

// ─── POST /api/auth/login ───────────────────────────────────────────
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = generateToken(user._id);

    res.json({
      token,
      user: sanitizeUser(user),
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error during login" });
  }
});

// ─── GET /api/auth/me ──────────────────────────────────────────────
router.get("/me", auth, async (req, res) => {
  try {
    res.json({ user: sanitizeUser(req.user) });
  } catch (err) {
    console.error("Get me error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ─── PUT /api/auth/name ────────────────────────────────────────────
router.put("/name", auth, async (req, res) => {
  try {
    const name = sanitizeString(req.body.name, 100);
    if (!name) return res.status(400).json({ message: "Name is required" });

    const user = await User.findByIdAndUpdate(req.user._id, { name }, { new: true }).select("-password");
    res.json({ user: sanitizeUser(user) });
  } catch (err) {
    console.error("Change name error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ─── PUT /api/auth/password ────────────────────────────────────────
router.put("/password", auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Both current and new password are required" });
    }
    if (!isValidPassword(newPassword)) {
      return res.status(400).json({ message: "New password must be at least 6 characters" });
    }

    const user = await User.findById(req.user._id);
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) return res.status(401).json({ message: "Current password is incorrect" });

    user.password = newPassword;
    await user.save();
    res.json({ message: "Password updated successfully" });
  } catch (err) {
    console.error("Change password error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ─── PUT /api/auth/preferences ─────────────────────────────────────
router.put("/preferences", auth, async (req, res) => {
  try {
    const allowed = ["theme", "accentColor", "waterGoal", "temperatureUnit", "defaultSymptoms", "aiInsightsEnabled", "lutealPhaseLength", "ovulationReminder", "appLockEnabled", "appLockPin"];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        updates[`preferences.${key}`] = req.body[key];
      }
    }
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: "No valid preferences provided" });
    }

    const user = await User.findByIdAndUpdate(req.user._id, { $set: updates }, { new: true }).select("-password");
    res.json({ user: sanitizeUser(user) });
  } catch (err) {
    console.error("Update preferences error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ─── DELETE /api/auth/account ──────────────────────────────────────
router.delete("/account", auth, async (req, res) => {
  try {
    const { default: CycleLog } = await import("../models/CycleLog.js");
    const { default: PregnancyLog } = await import("../models/PregnancyLog.js");
    const { default: PostpartumLog } = await import("../models/PostpartumLog.js");

    await Promise.all([
      CycleLog.deleteMany({ userId: req.user._id }),
      PregnancyLog.deleteMany({ userId: req.user._id }),
      PostpartumLog.deleteMany({ userId: req.user._id }),
      User.findByIdAndDelete(req.user._id),
    ]);
    res.json({ message: "Account deleted" });
  } catch (err) {
    console.error("Delete account error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
