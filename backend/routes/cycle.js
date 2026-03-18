import express from "express";
import auth from "../middleware/auth.js";
import User from "../models/User.js";
import CycleLog from "../models/CycleLog.js";
import PregnancyLog from "../models/PregnancyLog.js";
import PostpartumLog from "../models/PostpartumLog.js";

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

/* ═══════════════════════════════════════════════════════════════════
   PREGNANCY MODE ENDPOINTS
═══════════════════════════════════════════════════════════════════ */

// ─── PUT /api/cycle/pregnancy/setup ────────────────────────────────
// Initialize pregnancy mode and switch user state
router.put("/pregnancy/setup", auth, async (req, res) => {
  try {
    const { lastMenstrualPeriod, confirmDate, type, doctorConfirmed, highRisk, dueDate } = req.body;

    if (!confirmDate) {
      return res.status(400).json({ message: "Confirm date is required" });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        $set: {
          userState: "pregnancy",
          "pregnancy.lastMenstrualPeriod": lastMenstrualPeriod || "",
          "pregnancy.confirmDate": confirmDate,
          "pregnancy.type": type || "confirmed",
          "pregnancy.doctorConfirmed": doctorConfirmed || false,
          "pregnancy.highRisk": highRisk || false,
          "pregnancy.dueDate": dueDate || "",
        },
      },
      { new: true },
    ).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ user });
  } catch (err) {
    console.error("Pregnancy setup error:", err);
    res.status(500).json({ message: "Server error during pregnancy setup" });
  }
});

// ─── GET /api/cycle/pregnancy/profile ──────────────────────────────
router.get("/pregnancy/profile", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("pregnancy userState");
    if (user.userState !== "pregnancy") {
      return res.status(400).json({ message: "User is not in pregnancy mode" });
    }
    res.json({ pregnancy: user.pregnancy });
  } catch (err) {
    console.error("Get pregnancy profile error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ─── POST /api/cycle/pregnancy/log ────────────────────────────────
// Save (or upsert) daily pregnancy log
router.post("/pregnancy/log", auth, async (req, res) => {
  try {
    const { date, waterGlasses, vitaminsTaken, symptoms, contractions, nextAppointmentDate, appointmentNotes, checklistItems, notes } = req.body;

    if (!date) {
      return res.status(400).json({ message: "Date is required" });
    }

    const log = await PregnancyLog.findOneAndUpdate(
      { userId: req.user._id, date },
      {
        userId: req.user._id,
        date,
        waterGlasses: waterGlasses || 0,
        vitaminsTaken: vitaminsTaken || false,
        symptoms: symptoms || [],
        contractions: contractions || [],
        nextAppointmentDate: nextAppointmentDate || "",
        appointmentNotes: appointmentNotes || "",
        checklistItems: checklistItems || [],
        notes: notes || "",
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    res.json({ log });
  } catch (err) {
    console.error("Save pregnancy log error:", err);
    res.status(500).json({ message: "Server error saving pregnancy log" });
  }
});

// ─── GET /api/cycle/pregnancy/logs ────────────────────────────────
// Get all pregnancy logs for this user
router.get("/pregnancy/logs", auth, async (req, res) => {
  try {
    const logs = await PregnancyLog.find({ userId: req.user._id }).sort({ date: -1 });
    res.json({ logs });
  } catch (err) {
    console.error("Get pregnancy logs error:", err);
    res.status(500).json({ message: "Server error fetching pregnancy logs" });
  }
});

/* ═══════════════════════════════════════════════════════════════════
   POSTPARTUM MODE ENDPOINTS
═══════════════════════════════════════════════════════════════════ */

// ─── PUT /api/cycle/postpartum/setup ───────────────────────────────
// Initialize postpartum mode and switch user state
router.put("/postpartum/setup", auth, async (req, res) => {
  try {
    const { deliveryDate, deliveryMethod, doctorFollowUp } = req.body;

    if (!deliveryDate) {
      return res.status(400).json({ message: "Delivery date is required" });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        $set: {
          userState: "postpartum",
          "postpartum.deliveryDate": deliveryDate,
          "postpartum.deliveryMethod": deliveryMethod || "vaginal",
          "postpartum.doctorFollowUp": doctorFollowUp || false,
        },
      },
      { new: true },
    ).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ user });
  } catch (err) {
    console.error("Postpartum setup error:", err);
    res.status(500).json({ message: "Server error during postpartum setup" });
  }
});

// ─── GET /api/cycle/postpartum/profile ─────────────────────────────
router.get("/postpartum/profile", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("postpartum userState");
    if (user.userState !== "postpartum") {
      return res.status(400).json({ message: "User is not in postpartum mode" });
    }
    res.json({ postpartum: user.postpartum });
  } catch (err) {
    console.error("Get postpartum profile error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ─── POST /api/cycle/postpartum/log ────────────────────────────────
// Save (or upsert) daily postpartum log
router.post("/postpartum/log", auth, async (req, res) => {
  try {
    const {
      date,
      mood,
      symptoms,
      energy,
      pain,
      sleep,
      waterGlasses,
      ironSupplementTaken,
      vitaminsTaken,
      motherChecklist,
      feeds,
      feedCount,
      babySleepHours,
      nextAppointmentDate,
      appointmentChecklist,
      notes,
    } = req.body;

    if (!date) {
      return res.status(400).json({ message: "Date is required" });
    }

    const log = await PostpartumLog.findOneAndUpdate(
      { userId: req.user._id, date },
      {
        userId: req.user._id,
        date,
        mood: mood || "",
        symptoms: symptoms || [],
        energy: energy !== undefined ? energy : 50,
        pain: pain !== undefined ? pain : 0,
        sleep: sleep !== undefined ? sleep : 50,
        waterGlasses: waterGlasses || 0,
        ironSupplementTaken: ironSupplementTaken || false,
        vitaminsTaken: vitaminsTaken || false,
        motherChecklist: motherChecklist || [],
        feeds: feeds || [],
        feedCount: feedCount || 0,
        babySleepHours: babySleepHours || 0,
        nextAppointmentDate: nextAppointmentDate || "",
        appointmentChecklist: appointmentChecklist || [],
        notes: notes || "",
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    res.json({ log });
  } catch (err) {
    console.error("Save postpartum log error:", err);
    res.status(500).json({ message: "Server error saving postpartum log" });
  }
});

// ─── GET /api/cycle/postpartum/logs ────────────────────────────────
// Get all postpartum logs for this user
router.get("/postpartum/logs", auth, async (req, res) => {
  try {
    const logs = await PostpartumLog.find({ userId: req.user._id }).sort({ date: -1 });
    res.json({ logs });
  } catch (err) {
    console.error("Get postpartum logs error:", err);
    res.status(500).json({ message: "Server error fetching postpartum logs" });
  }
});

// ─── PUT /api/cycle/state ──────────────────────────────────────────
// Switch user state (cycle -> pregnancy -> postpartum -> cycle)
router.put("/state", auth, async (req, res) => {
  try {
    const { newState } = req.body;

    if (!["cycle", "pregnancy", "postpartum"].includes(newState)) {
      return res.status(400).json({ message: "Invalid state" });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: { userState: newState } },
      { new: true },
    ).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ user });
  } catch (err) {
    console.error("State change error:", err);
    res.status(500).json({ message: "Server error changing state" });
  }
});

export default router;
