import express from "express";
import {
  signup,
  login,
  logout,
  verifyEmail,
  getMe,
  updateProfile,
} from "../controllers/auth.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";
import { arcjectProtection } from "../middleware/arcjet.middleware.js";

import {
  acceptChatRequest,
  blockChatRequest,
  createChatRequest,
  declineChatRequest,
  getContacts,
  getUserMessage,
} from "../controllers/message.controller.js";

const router = express.Router();

//This is the rate limiter , it does more stuffs also
// router.use(arcjectProtection);
// I will enable this once i am done with postman testing

router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);
router.get("/me", getMe);
router.get("/verify/:token", verifyEmail);
router.put("/update-profile", protectRoute, updateProfile);
//This section is under construction for noww

router.get("/contacts", protectRoute, getContacts);
router.post("/chat/request", protectRoute, createChatRequest);
router.post("/chat/accept/:chatId", protectRoute, acceptChatRequest);
router.post("/chat/decline/:chatId", protectRoute, declineChatRequest);
router.post("/chat/block/:chatId", protectRoute, blockChatRequest);
router.get("/chat/get/:receiverId", protectRoute, getUserMessage);

// Construction

export default router;
