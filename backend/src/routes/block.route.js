import express from "express";
import { blockUser, getBlockedUsers, unblockUser } from "../controllers/block.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";
import { arcjetProtection } from "../middleware/arcjet.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { blockUserSchema, unblockUserSchema } from "../validation/block.validation.js";


const router = express.Router();
router.use(arcjetProtection);
router.use(protectRoute);

router.post("/block/:blockedId", validate(blockUserSchema, "params"), blockUser);
router.post("/unblock/:blockedId", validate(unblockUserSchema, "params"), unblockUser);
router.get("/blocked-users", getBlockedUsers);

export default router;

