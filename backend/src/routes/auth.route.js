import express from "express";
import {
  logout,
  getMe,
  updateProfile,
  googleAuth,
} from "../controllers/auth.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";
import { arcjetProtection } from "../middleware/arcjet.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import {
  updateProfileSchema,
  googleAuthSchema,
} from "../validation/auth.validation.js";

const router = express.Router();

router.use(arcjetProtection);

router.post("/google", validate(googleAuthSchema), googleAuth);
router.post("/logout", protectRoute, logout);
router.get("/me", protectRoute, getMe);
router.put(
  "/update-profile",
  protectRoute,
  validate(updateProfileSchema),
  updateProfile,
);

export default router;
