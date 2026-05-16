import asyncHandler from "../utils/asyncHandler.js";
import {
  logoutService,
  updateProfileService,
  googleAuthService,
} from "../services/auth.service.js";

const sessionCookieOptions = {
  httpOnly: true,
  maxAge: 7 * 24 * 60 * 60 * 1000,
  sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
  secure: process.env.NODE_ENV === "production",
};

export const logout = asyncHandler(async (req, res) => {
  const token = req.cookies.token;

  await logoutService(token);

  res.clearCookie("token", {
    httpOnly: sessionCookieOptions.httpOnly,
    secure: sessionCookieOptions.secure,
    sameSite: sessionCookieOptions.sameSite,
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
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      profilePic: user.profilePic,
    },
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

export const googleAuth = asyncHandler(async (req, res) => {
  const { credential } = req.body;

  const { user, token } = await googleAuthService(credential);

  res.cookie("token", token, sessionCookieOptions);

  return res.status(200).json({
    success: true,
    message: "Login successful",
    user,
  });
});
