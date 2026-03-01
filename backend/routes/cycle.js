import express from "express";
import auth from "../middleware/auth.js";
import User from "../models/User.js";

const router = express.Router();

// ─── PUT /api/cycle/setup ──────────────────────────────────────────
// First-time cycle setup — saves profile & marks user as onboarded
router.put("/setup", auth, async (req, res) => {
  try {
    const { lastPeriodDate, cycleLength, periodLength } = req.body;

    if (!lastPeriodDate) {
      return res
        .status(400)
        .json({ message: "Last period date is required" });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        $set: {
          "cycleProfile.lastPeriodDate": lastPeriodDate,
          "cycleProfile.cycleLength": cycleLength || 28,
          "cycleProfile.periodLength": periodLength || 5,
          isOnboarded: true,
        },
      },
      { new: true },
    ).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ user });
  } catch (err) {
    console.error("Cycle setup error:", err);
    res.status(500).json({ message: "Server error during cycle setup" });
  }
});

// ─── GET /api/cycle/profile ────────────────────────────────────────
router.get("/profile", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("cycleProfile");
    res.json({ cycleProfile: user.cycleProfile });
  } catch (err) {
    console.error("Get cycle profile error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
