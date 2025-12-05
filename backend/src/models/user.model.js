import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema(
  {
    token: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      expires: 0, // Due to this the db will delete this when the time passes
    },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    isVerified: { type: Boolean, default: false },
    verificationToken: { type: String },
    verificationTokenExpires: { type: Date },
    sessions: [sessionSchema],
    profilePic: { type: String },
  },
  { timestamps: true }
);
const User = mongoose.model("User", userSchema);
export default User;
