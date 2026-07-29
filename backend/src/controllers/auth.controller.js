import asyncHandler from "../utils/asyncHandler.js";
import {
  logoutService,
  updateProfileService,
  googleAuthService,
  changeNameService,
  changeBioService,
  changeUserNameService,
  checkUsernameAvailabilityService,
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
      username: user.username,
      email: user.email,
      profilePic: user.profilePic,
      about: user.about,
      authProvider: user.authProvider,
      createdAt: user.createdAt,
    },
  });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  const profilePicBuffer = req.file?.buffer;

  const updatedUser = await updateProfileService(userId, profilePicBuffer);

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

export const changeName = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  const { name } = req.body;

  const user = await changeNameService(userId, name);

  return res
    .status(200)
    .json({ success: true, message: "Name updated successfully", user });
});

export const changeBio = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  const { bio } = req.body;



  const user = await changeBioService(userId, bio);

  return res
    .status(200)
    .json({ success: true, message: "Bio updated successfully", user });
});


export const changeUserName = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  const { username } = req.body;

  const user = await changeUserNameService(userId, username);

  return res
    .status(200)
    .json({ success: true, message: "Username updated successfully", user });
});

export const checkUsernameAvailability = asyncHandler(async (req, res) => {
  const { username } = req.query;
  const isAvailable = await checkUsernameAvailabilityService(username);

  return res.status(200).json({ success: true, isAvailable });
});