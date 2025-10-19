import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import crypto from "crypto";
import User from "../models/user.model.js";
import sendEmail from "../utils/sendEmail.js";

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

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      verificationToken: token,
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
    const { token } = req.params;
    const user = await User.findOne({
      verificationToken: token,
      verificationTokenExpires: { $gt: Date.now() },
    });

    if (!user) {
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
  res.send("Login");
};
export const logout = async (req, res) => {
  res.send("Logout");
};
