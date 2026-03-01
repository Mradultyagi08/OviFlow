import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import auth from "../middleware/auth.js";

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

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "An account with this email already exists" });
    }

    // Create user
    const user = await User.create({
      name,
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

export default router;
