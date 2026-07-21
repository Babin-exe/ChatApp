import User from "../models/user.model.js";
import HttpError from "../utils/HttpError.js";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import { uploadImageToCloudinary } from "./cloudinaryUploader.service.js";
import generateUserName from "../utils/generateUsername.js";

const googleClient = new OAuth2Client();

const createUserSession = (user) => {
  return jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
};

export const logoutService = async (token) => {
  if (!token) {
    throw new HttpError("No active session", 400);
  }

  await User.updateOne(
    { "sessions.token": token },
    { $pull: { sessions: { token } } }
  );
};

export const updateProfileService = async (userId, profilePicBuffer) => {
  if (!userId) {
    throw new HttpError("Unauthorized", 401);
  }

  if (!profilePicBuffer) {
    throw new HttpError("Profile Picture is required", 400);
  }

  // Upload to Cloudinary
  let uploadResponse;
  try {
    uploadResponse = await uploadImageToCloudinary(profilePicBuffer);
  } catch (err) {
    throw new HttpError("Failed to upload profile picture", 500);
  }

  // Update user profile
  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { profilePic: uploadResponse.url },
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
    username: updatedUser.username,
    about: updatedUser.about,
  };
};

export const googleAuthService = async (credential) => {
  if (!credential) {
    throw new HttpError("Google credential is required", 400);
  }

  const googleClientId = process.env.GOOGLE_AUTH_CLIENT_ID;
  if (!googleClientId) {
    throw new HttpError("Google authentication is not configured", 500);
  }

  let payload;
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: googleClientId,
    });
    payload = ticket.getPayload();
  } catch {
    throw new HttpError("Invalid Google credential", 401);
  }

  const { sub, email, name, picture, email_verified } = payload;

  if (!sub || !email) {
    throw new HttpError("Google account is missing required profile data", 400);
  }

  if (!email_verified) {
    throw new HttpError("Please verify your Google email address", 403);
  }

  let user = await User.findOne({ googleSub: sub });

  if (!user) {
    user = await User.findOne({ email });
  }

  if (!user) {
    const displayName = name || email.split("@")[0];
    while (true) {
      try {
        const username = await generateUserName(displayName);
        user = await User.create({
          name: displayName,
          email,
          googleSub: sub,
          profilePic: picture || "",
          isVerified: true,
          authProvider: "google",
          googleName: name || "",
          googleProfilePic: picture || "",
          username: username,
        });
        break;
      } catch (error) {
        if (error.code === 11000 && error.keyPattern?.username) {
          continue;
        }
        throw error;
      }
    }
  } else {
    user.googleSub = user.googleSub || sub;
    user.authProvider = "google";
    user.isVerified = true;

    if (name && user.googleName !== name) user.googleName = name;
    if (picture && user.googleProfilePic !== picture)
      user.googleProfilePic = picture;
  }

  const now = new Date();
  user.sessions = user.sessions.filter((s) => s.expiresAt > now);

  const token = createUserSession(user);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  user.sessions.push({ token, expiresAt });
  await user.save();

  return {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      profilePic: user.profilePic,
      username: user.username,
    },
    token,
  };
};

export const changeNameService = async (userId, name) => {
  if (!userId || !name) {
    throw new HttpError("UserId and name required", 400);
  }

  const trimmedName = name?.trim();
  if (!trimmedName) {
    throw new HttpError("Name cannot be empty", 400);
  }

  const user = await User.findById(userId);

  if (!user) {
    throw new HttpError("User not found", 404);
  }

  user.name = trimmedName;
  await user.save();

  return user;
};

export const changeBioService = async (userId, bio) => {
  if (!userId || !bio) {
    throw new HttpError("UserId and bio required", 400);
  }

  const trimmedBio = bio?.trim();
  if (!trimmedBio) {
    throw new HttpError("Bio cannot be empty", 400);
  }

  const user = await User.findById(userId);

  if (!user) {
    throw new HttpError("User not found", 404);
  }

  user.about = trimmedBio;
  await user.save();

  return user;
};
