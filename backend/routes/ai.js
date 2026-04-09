import express from "express";
import auth from "../middleware/auth.js";
import CycleLog from "../models/CycleLog.js";
import PregnancyLog from "../models/PregnancyLog.js";
import PostpartumLog from "../models/PostpartumLog.js";
import { groqChatCompletion, getGroqConfig } from "../services/groq.js";

const router = express.Router();

function normalizeMode(mode) {
    if (mode === "pregnant") return "pregnancy";
    if (mode === "postpartum") return "postpartum";
    return "cycle";
}

function buildLogSummary(mode, logs) {
    const recent = logs.slice(0, 7);

    if (mode === "pregnancy") {
        const symptomCounts = recent.reduce((acc, log) => {
            for (const symptom of log.symptoms || []) {
                acc[symptom] = (acc[symptom] || 0) + 1;
            }
            return acc;
        }, {});

        return {
            recentEntries: recent.length,
            latestDate: recent[0]?.date || "",
            totalWaterGlasses: recent.reduce((sum, log) => sum + (log.waterGlasses || 0), 0),
            symptomCounts,
            appointmentDates: recent
                .map((log) => log.nextAppointmentDate)
                .filter(Boolean)
                .slice(0, 3),
        };
    }

    if (mode === "postpartum") {
        return {
            recentEntries: recent.length,
            latestDate: recent[0]?.date || "",
            avgEnergy:
                recent.length > 0
                    ? Math.round(recent.reduce((sum, log) => sum + (log.energy ?? 0), 0) / recent.length)
                    : 0,
            avgPain:
                recent.length > 0
                    ? Math.round(recent.reduce((sum, log) => sum + (log.pain ?? 0), 0) / recent.length)
                    : 0,
            avgSleep:
                recent.length > 0
                    ? Math.round(recent.reduce((sum, log) => sum + (log.sleep ?? 0), 0) / recent.length)
                    : 0,
            symptomCounts: recent.reduce((acc, log) => {
                for (const symptom of log.symptoms || []) {
                    acc[symptom] = (acc[symptom] || 0) + 1;
                }
                return acc;
            }, {}),
            feedCount: recent.reduce((sum, log) => sum + (log.feedCount || 0), 0),
        };
    }

    return {
        recentEntries: recent.length,
        latestDate: recent[0]?.date || "",
        periodDays: recent.filter((log) => log.isPeriod).length,
        moods: recent.map((log) => log.mood).filter(Boolean),
        symptomCounts: recent.reduce((acc, log) => {
            for (const symptom of log.symptoms || []) {
                acc[symptom] = (acc[symptom] || 0) + 1;
            }
            return acc;
        }, {}),
    };
}

function buildContext(user, mode, logs) {
    const normalizedMode = normalizeMode(mode || user.userState || "cycle");
    const profile =
        normalizedMode === "pregnancy"
            ? user.pregnancy || {}
            : normalizedMode === "postpartum"
                ? user.postpartum || {}
                : user.cycleProfile || {};

    return {
        user: {
            name: user.name,
            mode: normalizedMode,
            profile,
        },
        summary: buildLogSummary(normalizedMode, logs),
        recentLogs: logs.slice(0, 7),
    };
}

function buildInsightPrompt(context) {
    return [
        {
            role: "system",
            content:
                "You are OVI, a cautious health assistant for menstrual, pregnancy, and postpartum tracking. Never diagnose, never claim certainty, and always recommend professional care for urgent or concerning symptoms. Return only valid JSON with keys: title, insight, why, nextAction, confidence. confidence must be one of low, medium, or high.",
        },
        {
            role: "user",
            content: `Create a concise daily insight from this context:\n${JSON.stringify(context, null, 2)}`,
        },
    ];
}

function buildChatPrompt(context, message) {
    return [
        {
            role: "system",
            content:
                "You are OVI, a helpful health companion for cycle, pregnancy, and postpartum users. Be concise, empathetic, medically cautious, and non-diagnostic. If the user mentions emergency symptoms, tell them to seek urgent medical care immediately. Keep responses under 120 words unless the user asks for a longer explanation.",
        },
        {
            role: "user",
            content: `Context:\n${JSON.stringify(context, null, 2)}\n\nUser message: ${message}`,
        },
    ];
}

function parseJsonResponse(content) {
    const trimmed = content.trim();
    const firstBrace = trimmed.indexOf("{");
    const lastBrace = trimmed.lastIndexOf("}");
    if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
        throw new Error("AI response was not valid JSON");
    }
    return JSON.parse(trimmed.slice(firstBrace, lastBrace + 1));
}

router.post("/insight", auth, async (req, res) => {
    try {
        const mode = normalizeMode(req.body?.mode || req.user.userState);
        const tokenLimit = Number.parseInt(req.body?.limit, 10);
        const limit = Number.isFinite(tokenLimit) ? Math.min(Math.max(tokenLimit, 1), 14) : 7;

        const query =
            mode === "pregnancy"
                ? PregnancyLog.find({ userId: req.user._id }).sort({ date: -1 }).limit(limit)
                : mode === "postpartum"
                    ? PostpartumLog.find({ userId: req.user._id }).sort({ date: -1 }).limit(limit)
                    : CycleLog.find({ userId: req.user._id }).sort({ date: -1 }).limit(limit);

        const logs = await query;
        const context = buildContext(req.user, mode, logs);
        const completion = await groqChatCompletion(buildInsightPrompt(context), {
            temperature: 0.3,
            max_tokens: 260,
        });

        const parsed = parseJsonResponse(completion.content);
        res.json({
            ...parsed,
            model: completion.model,
        });
    } catch (err) {
        console.error("AI insight error:", err);
        res.status(500).json({
            message: err.message || "Failed to generate insight",
        });
    }
});

router.post("/chat", auth, async (req, res) => {
    try {
        const message = String(req.body?.message || "").trim();
        if (!message) {
            return res.status(400).json({ message: "Message is required" });
        }

        const mode = normalizeMode(req.body?.mode || req.user.userState);
        const limit = Math.min(Math.max(Number.parseInt(req.body?.limit, 10) || 7, 1), 14);
        const logs =
            mode === "pregnancy"
                ? await PregnancyLog.find({ userId: req.user._id }).sort({ date: -1 }).limit(limit)
                : mode === "postpartum"
                    ? await PostpartumLog.find({ userId: req.user._id }).sort({ date: -1 }).limit(limit)
                    : await CycleLog.find({ userId: req.user._id }).sort({ date: -1 }).limit(limit);

        const context = buildContext(req.user, mode, logs);
        const completion = await groqChatCompletion(buildChatPrompt(context, message), {
            temperature: 0.5,
            max_tokens: 260,
        });

        res.json({
            message: completion.content.trim(),
            model: completion.model,
            provider: "groq",
            apiBase: getGroqConfig().apiBase,
            modelName: getGroqConfig().model,
        });
    } catch (err) {
        console.error("AI chat error:", err);
        res.status(500).json({
            message: err.message || "Failed to generate response",
        });
    }
});

export default router;
