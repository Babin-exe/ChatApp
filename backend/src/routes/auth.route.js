import express from "express";
import {
  logout,
  getMe,
  updateProfile,
  googleAuth,
  changeName,
  changeBio,
  changeUserName,
  checkUsernameAvailability,
} from "../controllers/auth.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";
import { arcjetProtection } from "../middleware/arcjet.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import {
  googleAuthSchema,
  updateBioSchema,
  updateNameSchema,
  updateUserNameSchema,
} from "../validation/auth.validation.js";
import { upload } from "../middleware/upload.middleware.js";

const router = express.Router();

router.use(arcjetProtection);

router.post("/google", validate(googleAuthSchema), googleAuth);
router.post("/logout", protectRoute, logout);
router.get("/me", protectRoute, getMe);

router.patch(
  "/update-profile",
  protectRoute,
  upload.single("profilePic"),
  updateProfile
);

router.patch(
  "/update_name",
  protectRoute,
  validate(updateNameSchema),
  changeName
);

router.patch("/update_bio", protectRoute, validate(updateBioSchema), changeBio);
router.patch("/update_username", protectRoute, validate(updateUserNameSchema), changeUserName);
router.get("/check-username", protectRoute, checkUsernameAvailability);

export default router;
