import express from "express";
import { sendMessageController } from "../controllers/chat.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { receiverParamsSchema } from "../validation/chat.validation.js";
import { uploadImage } from "../middleware/upload.middleware.js";
import { validateSendMessageBody } from "../middleware/validateSendMessageBody.middleware.js";
import { validateUploadedImageFile } from "../middleware/ValidateImage.middleware.js";
const router = express.Router();

router.post(
  "/send/:receiverId",
  protectRoute,

  validate(receiverParamsSchema, "params"),

  uploadImage,


  //One image validation here would be nice 

  validateUploadedImageFile,

  validateSendMessageBody,

  sendMessageController

);

export default router;