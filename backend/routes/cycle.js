import express from "express";
import auth from "../middleware/auth.js";
import User from "../models/User.js";
import CycleLog from "../models/CycleLog.js";

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

// ─── POST /api/cycle/log ───────────────────────────────────────────
// Save (or upsert) today's cycle log
router.post("/log", auth, async (req, res) => {
  try {
    const { date, isPeriod, flow, mood, symptoms, notes } = req.body;

    if (!date) {
      return res.status(400).json({ message: "Date is required" });
    }

    const log = await CycleLog.findOneAndUpdate(
      { userId: req.user._id, date },
      { userId: req.user._id, date, isPeriod, flow, mood, symptoms, notes },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    res.json({ log });
  } catch (err) {
    console.error("Save cycle log error:", err);
    res.status(500).json({ message: "Server error saving log" });
  }
});

// ─── GET /api/cycle/logs ───────────────────────────────────────────
// Get all cycle logs for this user
router.get("/logs", auth, async (req, res) => {
  try {
    const logs = await CycleLog.find({ userId: req.user._id }).sort({ date: -1 });
    res.json({ logs });
  } catch (err) {
    console.error("Get cycle logs error:", err);
    res.status(500).json({ message: "Server error fetching logs" });
  }
});

export default router;
