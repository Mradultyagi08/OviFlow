import mongoose from "mongoose";

const cycleLogSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        date: {
            type: String, // ISO date string "YYYY-MM-DD"
            required: true,
        },
        isPeriod: {
            type: Boolean,
            default: false,
        },
        flow: {
            type: String,
            enum: ["light", "medium", "heavy", ""],
            default: "",
        },
        mood: {
            type: String,
            enum: ["happy", "okay", "low", "anxious", ""],
            default: "",
        },
        symptoms: {
            type: [String],
            default: [],
        },
        notes: {
            type: String,
            default: "",
        },
    },
    { timestamps: true },
);

// Unique log per user per day
cycleLogSchema.index({ userId: 1, date: 1 }, { unique: true });

export default mongoose.model("CycleLog", cycleLogSchema);
