import express from "express";
import {
  messageReactionController,
  sendEditedMessageController,
  sendMessageController,
} from "../controllers/chat.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { receiverParamsSchema } from "../validation/chat.validation.js";
import {
  messageParamsSchema,
  reactionBodySchema,
  sendMessageBodySchema,
} from "../validation/message.validation.js";
import { uploadImage } from "../middleware/upload.middleware.js";
import { validateSendMessageBody } from "../middleware/validateSendMessageBody.middleware.js";
import { validateUploadedImageFile } from "../middleware/ValidateImage.middleware.js";
const router = express.Router();

router.post(
  "/send/:receiverId",
  protectRoute,
  validate(receiverParamsSchema, "params"),
  uploadImage,
  validateUploadedImageFile,
  validateSendMessageBody,
  sendMessageController
);

router.post(
  "/:messageId/reactions",
  protectRoute,
  validate(messageParamsSchema, "params"),
  validate(reactionBodySchema),
  messageReactionController
);
router.patch(
  "/edit/:messageId",
  protectRoute,
  validate(messageParamsSchema, "params"),
  validate(sendMessageBodySchema, "body"),
  sendEditedMessageController
);


export default router;
