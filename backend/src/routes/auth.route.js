import express from "express";
import {
  signup,
  login,
  logout,
  verifyEmail,
  getMe,
  updateProfile,
} from "../controllers/auth.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";
import { arcjectProtection } from "../middleware/arcjet.middleware.js";

const router = express.Router();
// router.use(arcjectProtection);

router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);
router.get("/me", protectRoute, getMe);
router.get("/verify/:token", verifyEmail);
router.put("/update-profile", protectRoute, updateProfile);

export default router;
