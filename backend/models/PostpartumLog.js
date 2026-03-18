import mongoose from "mongoose";

const postpartumLogSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        date: {
            type: String,
            required: true,
            index: true,
        },
        // Mother's recovery
        mood: {
            type: String,
            enum: ["excellent", "good", "okay", "struggling", ""],
            default: "",
        },
        symptoms: {
            type: [String],
            default: [],
        },
        energy: {
            type: Number,
            default: 50, // 0-100 scale
        },
        pain: {
            type: Number,
            default: 0, // 0-10 scale
        },
        sleep: {
            type: Number,
            default: 50, // 0-100 scale for quality/duration
        },
        // Nutrition
        waterGlasses: {
            type: Number,
            default: 0,
        },
        ironSupplementTaken: {
            type: Boolean,
            default: false,
        },
        vitaminsTaken: {
            type: Boolean,
            default: false,
        },
        // Mother's care checklist
        motherChecklist: {
            type: [String],
            default: [], // e.g., "Iron supplement taken", "Pelvic floor exercises"
        },
        // Baby feeding
        feeds: {
            type: [
                {
                    side: String, // left, right, both
                    duration: Number, // seconds
                    time: String, // HH:mm format
                },
            ],
            default: [],
        },
        feedCount: {
            type: Number,
            default: 0,
        },
        // Baby sleep
        babySleepHours: {
            type: Number,
            default: 0,
        },
        // Appointments
        nextAppointmentDate: {
            type: String,
            default: "",
        },
        appointmentChecklist: {
            type: [String],
            default: [],
        },
        // General notes
        notes: {
            type: String,
            default: "",
        },
    },
    { timestamps: true },
);

// Compound index for user and date lookups
postpartumLogSchema.index({ userId: 1, date: -1 });

const PostpartumLog = mongoose.model("PostpartumLog", postpartumLogSchema);
export default PostpartumLog;
