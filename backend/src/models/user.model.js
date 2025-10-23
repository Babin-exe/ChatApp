import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    isVerified: { type: Boolean, required: true, default: false },
    verificationToken: { type: String },
    verificationTokenExpires: { type: Date },
    sessions: [
      {
        token: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
        expiresAt: {
          type: Date,
          default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          index: { expires: 0 },
        },
      },
    ],
  },
  { timestamps: true }
);
export default mongoose.model("User", userSchema);
