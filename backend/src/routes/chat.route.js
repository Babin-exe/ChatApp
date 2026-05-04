import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { arcjetProtection } from "../middleware/arcjet.middleware.js";
import {
  acceptChatRequest,
  createChatRequest,
  declineChatRequest,
  getContacts,
  getDiscoverUsers,
  getIncomingRequests,
  getUserMessage,
} from "../controllers/chat.controller.js";
import { validate } from "../middleware/validate.middleware.js";
import {
  chatParamsSchema,
  messageQuerySchema,
  receiverParamsSchema,
} from "../validation/chat.validation.js";

const router = express.Router();


router.use(arcjetProtection);


router.get("/contacts", protectRoute, getContacts);


router.post(
  "/request/:receiverId",
  protectRoute,
  validate(receiverParamsSchema, "params"),
  createChatRequest,
);


router.post(
  "/accept/:chatId",
  protectRoute,
  validate(chatParamsSchema, "params"),
  acceptChatRequest,
);
router.post(
  "/decline/:chatId",
  protectRoute,
  validate(chatParamsSchema, "params"),
  declineChatRequest,
);






router.get(
  "/messages/:receiverId",
  protectRoute,
  validate(receiverParamsSchema, "params"),
  validate(messageQuerySchema, "query"),
  getUserMessage,
);


router.get("/discover", protectRoute, getDiscoverUsers);

router.get("/requests/incoming", protectRoute, getIncomingRequests);

export default router;

       