import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 6,
    },
    userState: {
      type: String,
      enum: ["cycle", "pregnancy", "postpartum"],
      default: "cycle",
    },
    isOnboarded: {
      type: Boolean,
      default: false,
    },
    cycleProfile: {
      lastPeriodDate: { type: String, default: "" },
      cycleLength: { type: Number, default: 28 },
      periodLength: { type: Number, default: 5 },
    },
    pregnancy: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    postpartum: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true },
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare passwords
userSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model("User", userSchema);
export default User;
