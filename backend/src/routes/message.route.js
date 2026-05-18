import express from "express";
import { sendMessageController } from "../controllers/chat.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { receiverParamsSchema, sendMessageSchema } from "../validation/chat.validation.js";
import { uploadImage } from "../middleware/upload.middleware.js";
const router = express.Router();

/* 
 
Do not use this order ,, dont check before parsing the body 

router.post(
  "/send/:receiverId",
  protectRoute,
  validate(receiverParamsSchema, "params"),
  validate(sendMessageSchema),
  uploadImage.single("image"),
  sendMessageController,
);

user what is used below 

*/


router.post(
  "/send/:receiverId",

  protectRoute,
  validate(receiverParamsSchema, "params"),

  uploadImage.single("image"),

  //I am removing this for now later will change this validator for multi part and then add 
  // validate(sendMessageSchema),

  sendMessageController,
);


export default router;


