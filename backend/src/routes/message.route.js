import express from "express";
import { sendMessageController } from "../controllers/chat.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { receiverParamsSchema, sendMessageSchema } from "../validation/chat.validation.js";
const router = express.Router();



router.post(
  "/send/:receiverId",
  protectRoute,
  validate(receiverParamsSchema, "params"),
  validate(sendMessageSchema),
  sendMessageController,
);


export default router;


