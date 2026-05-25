import express from "express";
import { sendMessageController } from "../controllers/chat.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { receiverParamsSchema } from "../validation/chat.validation.js";
import { uploadImage } from "../middleware/upload.middleware.js";
import { validateSendMessageBody } from "../middleware/validateSendMessageBody.middleware.js";
const router = express.Router();

router.post(
  "/send/:receiverId",
  protectRoute,

  validate(receiverParamsSchema, "params"),

  uploadImage,

  // req.body and req.file is populated here 

  //If i can put a validation here it would be good 
  //before sending the message with image and text

  validateSendMessageBody,

  sendMessageController

);

export default router;