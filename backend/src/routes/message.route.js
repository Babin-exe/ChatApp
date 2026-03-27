import express from "express";
import { sendMessageController } from "../controllers/chat.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { receiverParamsSchema, sendMessageSchema } from "../validation/chat.validation.js";
const router = express.Router();

// router.get("/conversations", getConversations);
// router.get("/:chatId", getMessagesByChatId);

router.post(
  "/send/:receiverId",
  protectRoute,
  validate(receiverParamsSchema, "params"),
  validate(sendMessageSchema),
  sendMessageController,
);

// router.patch("/status/:messageId", updateMessageStatus);
//  router.patch("/edit/:messageId", editMessageContent);

export default router;


