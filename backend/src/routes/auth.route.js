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
import { arcjetProtection } from "../middleware/arcjet.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import {
  loginSchema,
  signupSchema,
  updateProfileSchema,
} from "../validation/auth.validation.js";

const router = express.Router();

router.use(arcjetProtection);

router.post("/signup", validate(signupSchema), signup);
router.post("/login", validate(loginSchema), login);
router.post("/logout", protectRoute, logout);
router.get("/me", protectRoute, getMe);
router.get("/verify/:token", verifyEmail);
router.put(
  "/update-profile",
  protectRoute,
  validate(updateProfileSchema),
  updateProfile,
);

export default router;
