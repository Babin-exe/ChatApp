import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { arcjetProtection } from "../middleware/arcjet.middleware.js";
import {
  acceptChatRequest,
  blockChatRequest,
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


// router.use(arcjetProtection);

// Fetch all contacts/users the current user can chat with
router.get("/contacts", protectRoute, getContacts);

// Initiate a new chat request
router.post(
  "/request/:receiverId",
  protectRoute,
  validate(receiverParamsSchema, "params"),
  createChatRequest,
);

// Accept, Decline, or Block a specific chat request
router.post(
  "/accept/:chatId",
  protectRoute,
  validate(chatParamsSchema, "params"),
  acceptChatRequest,
); // Was: /chat/accept/:chatId
router.post(
  "/decline/:chatId",
  protectRoute,
  validate(chatParamsSchema, "params"),
  declineChatRequest,
); // Was: /chat/decline/:chatId
router.post(
  "/block/:chatId",
  protectRoute,
  validate(chatParamsSchema, "params"),
  blockChatRequest,
); // Was: /chat/block/:chatId

// Get all messages for a specific chat (identified by the receiver's ID or chat ID)
router.get(
  "/messages/:receiverId",
  protectRoute,
  validate(receiverParamsSchema, "params"),
  validate(messageQuerySchema, "query"),
  getUserMessage,
); // Was: /chat/get/:receiverId


router.get("/discover", protectRoute, getDiscoverUsers);

router.get("/requests/incoming", protectRoute, getIncomingRequests);

export default router;

// /api/chats/messages/:userId
