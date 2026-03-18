import mongoose from "mongoose";

const pregnancyLogSchema = new mongoose.Schema(
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
        // Nutrition & hydration
        waterGlasses: {
            type: Number,
            default: 0,
        },
        vitaminsTaken: {
            type: Boolean,
            default: false,
        },
        // Pregnancy symptoms
        symptoms: {
            type: [String],
            default: [],
        },
        // Contraction tracking
        contractions: {
            type: [
                {
                    duration: Number, // in seconds
                    time: String, // HH:mm format
                },
            ],
            default: [],
        },
        // Appointments
        nextAppointmentDate: {
            type: String,
            default: "",
        },
        appointmentNotes: {
            type: String,
            default: "",
        },
        // Checklists (pregnancy tasks)
        checklistItems: {
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
pregnancyLogSchema.index({ userId: 1, date: -1 });

const PregnancyLog = mongoose.model("PregnancyLog", pregnancyLogSchema);
export default PregnancyLog;
