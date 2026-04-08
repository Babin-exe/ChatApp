import asyncHandler from "../utils/asyncHandler.js";
import {
  signupService,
  verifyEmailService,
  loginService,
  logoutService,
  updateProfileService,
} from "../services/auth.service.js";

export const signup = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body ? req.body : "";

  const user = await signupService({ name, email, password });

  return res.status(201).json({
    success: true,
    message: "Verification email sent",
    user,
  });
});

export const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.params;

  const success = await verifyEmailService(token);

  if (!success) {
    return res.redirect(`${process.env.FRONTEND_URL}/verification-failed`);
  }

  return res.redirect(`${process.env.FRONTEND_URL}/login?verified=true`);
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const { user, token } = await loginService({ email, password });

  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return res.status(200).json({
    success: true,
    message: "Login successful",
    user,
  });
});

export const logout = asyncHandler(async (req, res) => {
  const token = req.cookies.token;

  await logoutService(token);

  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
  });

  return res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
});

export const getMe = asyncHandler(async (req, res) => {
  const user = req.user;

  return res.status(200).json({
    success: true,
    user: { id: user._id, name: user.name, email: user.email },
  });
});

export const updateProfile = asyncHandler(async (req, res) => {

  const userId = req.user?._id;
  const { profilePic } = req.body;

  const updatedUser = await updateProfileService(userId, profilePic);

  return res.status(200).json({
    success: true,
    message: "Profile updated successfully",
    user: updatedUser,
  });

});
