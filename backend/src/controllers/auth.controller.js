import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import crypto from "crypto";
import User from "../models/user.model.js";
import sendEmail from "../utils/sendEmail.js";
import cloudinary from "../lib/cloudinary.js";

export const signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Not enough info to create an account",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Enter password length greater or equal to Eight(8) ",
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json({ success: false, message: "Email is already in use" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const token = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      profilePic: "",
      verificationToken: hashedToken,
      verificationTokenExpires: Date.now() + 24 * 60 * 60 * 1000,
    });

    const verifyUrl = `${process.env.BACKEND_URL}/api/auth/verify/${token}`;

    await sendEmail(
      email,
      "Verify Your Email",
      `<p>Click the link below to verify your email:</p>
   <a href="${verifyUrl}">Verify Email</a>`
    );

    return res
      .status(201)
      .json({ success: true, message: "Verification Email sent" });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ success: false, message: `Something went wrong : ${error}` });
  }
};

export const verifyEmail = async (req, res) => {
  try {
    // const { token } = req.params;
    const hashedToken = crypto
      .createHash("sha256")
      .update(req.params.token)
      .digest("hex");
    const user = await User.findOne({
      verificationToken: hashedToken,
      verificationTokenExpires: { $gt: Date.now() },
    });

    if (!user) {
      console.log("Verificaion token failed : invalid or expired token");
      return res.redirect(`${process.env.FRONTEND_URL}/verification-failed`);
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;

    await user.save();

    //I will use this only when in local host
    // return res.redirect(`${process.env.FRONTEND_URL}/login?verified=true`);

    return res.redirect(`${process.env.FRONTEND_URL}/login?verified=true`);
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Server error during verification",
    });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid credentials" });
    }

    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        message: "Please verify your email before logging in",
      });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);

    if (!isPasswordCorrect) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid Credentials" });
    }

    const now = new Date();
    user.sessions = user.sessions.filter(
      (sessions) => sessions.expiresAt > now
    );

    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    user.sessions.push({ token, expiresAt });
    await user.save();

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      success: true,
      message: "Login successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.log(`Oops Someting went wrong : ${error}`);
    return res.json({
      success: false,
      message: `User login failed:${error.message}`,
    });
  }
};

export const logout = async (req, res) => {
  try {
    const token = req.cookies.token;

    if (!token) {
      return res
        .status(400)
        .json({ success: false, message: "No active session" });
    }

    await User.updateOne(
      { "sessions.token": token },
      { $pull: { sessions: { token } } }
    );

    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
    });

    return res
      .status(200)
      .json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    console.log(`Logout Error :${error}`);
    return res.status(500).json({ success: false, message: "Logout Failed" });
  }
};

export const getMe = async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) throw new Error("No active session");

    const decode = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decode.id);
    if (!user) throw new Error("User not found");

    return res.status(200).json({
      success: true,
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (error) {
    return res.status(401).json({ success: false, message: error.message });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { profilePic } = req.body;
    if (!profilePic) {
      return res
        .status(400)
        .json({ success: false, message: "Profile Picture is required" });
    }

    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const uploadResponse = await cloudinary.uploader.upload(profilePic);
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { profilePic: uploadResponse.secure_url },
      { new: true }
    );

    if (!updatedUser) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    return res
      .status(200)
      .json({ success: true, message: "Profile Updated", data: updatedUser });
  } catch (error) {
    console.log("Error updating the profile picture : ", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server Error" });
  }
};
