import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema(
  {
    token: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    // Profile
    name: { type: String, required: true },
    profilePic: { type: String },
    about: { type: String, default: "", maxlength: 120 },

    //Authenticaiotn
    googleSub: { type: String, sparse: true, unique: true },
    email: { type: String, required: true, unique: true },

    authProvider: {
      type: String,
      enum: ["google", "local"],
      default: "google",
      required: true,
    },

    isVerified: { type: Boolean, default: false },

    sessions: [sessionSchema],

    //Searching
    nameSearch: { type: String, default: "" },
    emailSearch: { type: String, default: "" },

    //Google sync
    googleName: { type: String, default: "" },
    googleProfilePic: { type: String, default: "" },
  },
  { timestamps: true }
);

userSchema.pre("save", function (next) {
  this.nameSearch = (this.name || "").trim().toLowerCase();
  this.emailSearch = (this.email || "").trim().toLowerCase();
  next();
});

userSchema.index({ isVerified: 1, nameSearch: 1 });
userSchema.index({ isVerified: 1, emailSearch: 1 });

userSchema.index({ "sessions.expiresAt": 1 });

const User = mongoose.model("User", userSchema);
export default User;
