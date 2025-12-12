import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
// import { arcjectProtection } from "../middleware/arcjet.middleware.js";
import {
  acceptChatRequest,
  blockChatRequest,
  createChatRequest,
  declineChatRequest,
  getContacts,
  getUserMessage,
} from "../controllers/chat.controller.js";

const router = express.Router();
// router.use(arcjectProtection);

// Fetch all contacts/users the current user can chat with
router.get("/contacts", protectRoute, getContacts);

// Initiate a new chat request
router.post("/request:receiverId", protectRoute, createChatRequest);

// Accept, Decline, or Block a specific chat request
router.post("/accept/:chatId", protectRoute, acceptChatRequest); // Was: /chat/accept/:chatId
router.post("/decline/:chatId", protectRoute, declineChatRequest); // Was: /chat/decline/:chatId
router.post("/block/:chatId", protectRoute, blockChatRequest); // Was: /chat/block/:chatId

// Get all messages for a specific chat (identified by the receiver's ID or chat ID)
router.get("/messages/:receiverId", protectRoute, getUserMessage); // Was: /chat/get/:receiverId

export default router;
