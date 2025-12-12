import bcrypt from "bcrypt";
import crypto from "crypto";
import User from "../models/user.model.js";
import sendEmail from "../utils/sendEmail.js";
import HttpError from "../utils/HttpError.js";
import jwt from "jsonwebtoken";
import cloudinary from "../lib/cloudinary.js";

export const signupService = async ({ name, email, password }) => {
  if (!name || !email || !password) {
    throw new HttpError("Not enough info to create an account", 400);
  }

  if (password.length < 8) {
    throw new HttpError(
      "Enter password length greater or equal to Eight(8)",
      400
    );
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new HttpError("Email is already in use", 400);
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Generate verification token
  const token = crypto.randomBytes(32).toString("hex");
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  // Create user
  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    profilePic: "",
    verificationToken: hashedToken,
    verificationTokenExpires: Date.now() + 24 * 60 * 60 * 1000, // 24h
  });

  // Send verification email
  try {
    const verifyUrl = `${process.env.BACKEND_URL}/api/auth/verify/${token}`;
    await sendEmail(
      email,
      "Verify Your Email",
      `<p>Click the link below to verify your email:</p>
          <a href="${verifyUrl}">Verify Email</a>`
    );
  } catch (err) {
    console.error("Email sending failed:", err);
  }

  return { id: user._id, name: user.name, email: user.email };
};

export const verifyEmailService = async (token) => {
  // Hash the token from params
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  // Find user with valid token
  const user = await User.findOne({
    verificationToken: hashedToken,
    verificationTokenExpires: { $gt: Date.now() },
  });

  if (!user) {
    console.log("Verification token failed: invalid or expired token");
    return false;
  }

  // Mark user as verified
  user.isVerified = true;
  user.verificationToken = undefined;
  user.verificationTokenExpires = undefined;
  await user.save();
  return true;
};

export const loginService = async ({ email, password }) => {
  const user = await User.findOne({ email });
  if (!user) {
    throw new HttpError("Invalid credentials", 400);
  }

  if (!user.isVerified) {
    throw new HttpError("Please verify your email before logging in", 403);
  }

  const isPasswordCorrect = await bcrypt.compare(password, user.password);
  if (!isPasswordCorrect) {
    throw new HttpError("Invalid credentials", 400);
  }

  // Remove expired sessions
  const now = new Date();
  user.sessions = user.sessions.filter((session) => session.expiresAt > now);

  // Generate JWT
  const token = jwt.sign(
    { id: user._id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  // Add new session
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  user.sessions.push({ token, expiresAt });
  await user.save();

  return {
    user: { id: user._id, name: user.name, email: user.email },
    token,
  };
};

export const logoutService = async (token) => {
  if (!token) {
    throw new HttpError("No active session", 400);
  }

  // Remove session containing this token
  await User.updateOne(
    { "sessions.token": token },
    { $pull: { sessions: { token } } }
  );
};

export const getMeService = async (token) => {
  if (!token) {
    throw new HttpError("No active session", 401);
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    throw new HttpError("Invalid or expired token", 401);
  }

  const user = await User.findById(decoded.id);
  if (!user) {
    throw new HttpError("User not found", 401);
  }

  return { id: user._id, name: user.name, email: user.email };
};

export const updateProfileService = async (userId, profilePic) => {
  if (!userId) {
    throw new HttpError("Unauthorized", 401);
  }

  if (!profilePic) {
    throw new HttpError("Profile Picture is required", 400);
  }

  // Upload to Cloudinary
  let uploadResponse;
  try {
    uploadResponse = await cloudinary.uploader.upload(profilePic);
  } catch (err) {
    throw new HttpError("Failed to upload profile picture", 500);
  }

  // Update user profile
  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { profilePic: uploadResponse.secure_url },
    { new: true }
  ).select("name email profilePic _id");

  if (!updatedUser) {
    throw new HttpError("User not found", 404);
  }

  return {
    id: updatedUser._id,
    name: updatedUser.name,
    email: updatedUser.email,
    profilePic: updatedUser.profilePic,
  };
};
