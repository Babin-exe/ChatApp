import express from "express";
import { sendMessageController } from "../controllers/chat.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { receiverParamsSchema, sendMessageSchema } from "../validation/chat.validation.js";
import { uploadImage } from "../middleware/upload.middleware.js";
const router = express.Router();



router.post(
  "/send/:receiverId",
  protectRoute,
  validate(receiverParamsSchema, "params"),
  validate(sendMessageSchema),
  uploadImage.single("image"),
  sendMessageController,
);


export default router;


