import Chat from "../models/Chat.js";
import asyncHandler from "../utils/asyncHandler.js";
import {
  updateChatStatus,
  getMessagesByChatParticipants,
  createNewChatRequest,
  getIncomingChatRequest,
  discoverUsersToChat,
  validateSendMessage,
  createMessage,
  messageReactionService,
} from "../services/chat.service.js";
import Blocked from "../models/Block.js";
import { Types } from "mongoose";
import {
  uploadImageToCloudinary,
  deleteCloudinaryImage,
} from "../services/cloudinaryUploader.service.js";
import { sendToUser } from "../lib/socket.js";
import Message from "../models/Message.js";

export const createChatRequest = asyncHandler(async (req, res) => {
  const senderId = req.user._id;
  const { receiverId } = req.params;

  const populatedChat = await createNewChatRequest({ senderId, receiverId });

  return res.status(201).json({
    success: true,
    chat: populatedChat,
    message: "Chat request sent successfully",
  });
});

export const acceptChatRequest = asyncHandler(async (req, res) => {
  const acceptorId = req.user._id;
  const { chatId } = req.params;

  const updatedChat = await updateChatStatus({
    chatId: chatId,
    status: "accepted",
    actorId: acceptorId,
    systemMessage: "Chat request accepted",
  });

  return res.status(200).json({
    success: true,
    message: "Chat request accepted successfully",
    chat: updatedChat,
  });
});

export const declineChatRequest = asyncHandler(async (req, res) => {
  const updatedChat = await updateChatStatus({
    chatId: req.params.chatId,
    status: "declined",
    actorId: req.user._id,
    systemMessage: "Chat request declined",
  });

  return res.status(200).json({
    success: true,
    message: "Chat request declined successfully",
    chat: updatedChat,
  });
});

export const getContacts = asyncHandler(async (req, res) => {
  const userId = new Types.ObjectId(req.user._id);

  const [blockedByMe, blockedMe] = await Promise.all([
    Blocked.distinct("blocked", { blocker: userId }),
    Blocked.distinct("blocker", { blocked: userId }),
  ]);

  const excluded = [userId];

  const contacts = await Chat.aggregate([
    { $match: { members: userId, status: "accepted" } },
    { $sort: { updatedAt: -1 } },

    {
      $project: {
        members: {
          $filter: {
            input: "$members",
            as: "m",
            cond: { $not: { $in: ["$$m", excluded] } },
          },
        },
        updatedAt: 1,
      },
    },

    { $match: { "members.0": { $exists: true } } },

    { $unwind: "$members" },

    {
      $lookup: {
        from: "users",
        localField: "members",
        foreignField: "_id",
        pipeline: [
          {
            $project: {
              _id: 1,
              name: 1,
              email: 1,
              profilePic: 1,
            },
          },
        ],
        as: "member",
      },
    },
    { $match: { "member.0": { $exists: true } } },
    { $unwind: "$member" },

    {
      $project: {
        chatId: "$_id",
        _id: "$member._id",
        name: "$member.name",
        email: "$member.email",
        profilePic: "$member.profilePic",
      },
    },

    {
      $group: {
        _id: "$_id",
        chatId: { $first: "$chatId" },
        name: { $first: "$name" },
        email: { $first: "$email" },
        profilePic: { $first: "$profilePic" },
        lastActivity: { $first: "$updatedAt" },
      },
    },
    { $sort: { lastActivity: -1 } },
  ]);

  const blockedByMeSet = new Set(blockedByMe.map((id) => id.toString()));
  const blockedMeSet = new Set(blockedMe.map((id) => id.toString()));

  const enrichedContacts = contacts.map((contact) => {
    const contactId = contact._id.toString();
    const blockedByCurrentUser = blockedByMeSet.has(contactId);
    const blockedCurrentUser = blockedMeSet.has(contactId);

    return {
      ...contact,
      blockedByCurrentUser,
      blockedCurrentUser,
      canMessage: !(blockedByCurrentUser || blockedCurrentUser),
    };
  });

  return res.status(200).json({
    success: true,
    contacts: enrichedContacts,
    message: "Contacts received successfully",
  });
});

export const getUserMessage = asyncHandler(async (req, res) => {
  //Getting the sender and receiver id
  const senderId = req.user._id;
  const { receiverId } = req.params;

  //Getting the cursor and limit
  const { cursor, limit = 30 } = req.query;

  const { messages, chatId, nextCursor } = await getMessagesByChatParticipants({
    senderId,
    receiverId,
    cursor,
    limit,
  });

  return res.status(200).json({
    success: true,
    message: "Messages retrieved successfully",
    data: messages,
    nextCursor,
    chatId,
  });
});

export const sendMessageController = asyncHandler(async (req, res) => {
  const senderId = req.user._id;
  const { content } = req.body;
  const { receiverId } = req.params;

  const type = req.file ? "image" : "text";

  const { trimmedContent, chat } = await validateSendMessage({
    senderId,
    receiverId,
    content,
    type,
    hasImage: Boolean(req.file),
  });

  let image;

  try {
    if (req.file) {
      image = await uploadImageToCloudinary(req.file.buffer);
    }

    //db save , socket emit and res to the user
    const message = await createMessage({
      senderId,
      receiverId,
      chatId: chat._id,
      content: trimmedContent,
      image,
      type,
    });

    return res.status(200).json({
      success: true,
      message: "Message sent successfully",
      messageData: message,
    });
  } catch (err) {
    if (image?.publicId) {
      try {
        await deleteCloudinaryImage(image.publicId);
      } catch (cleanupErr) {
        console.error("Cloudinary cleanup failed:", cleanupErr);
      }
    }
    throw err;
  }
});

export const getIncomingRequests = asyncHandler(async (req, res) => {
  const requests = await getIncomingChatRequest({ userId: req.user._id });

  return res.status(200).json({ success: true, requests });
});

export const getDiscoverUsers = asyncHandler(async (req, res) => {
  const users = await discoverUsersToChat({
    userId: req.user._id,
    q: req.query.q || "",
  });

  return res.status(200).json({ success: true, users });
});

export const getChatAccessStatus = asyncHandler(async (req, res) => {
  const currentUserId = req.user._id;
  const { receiverId } = req.params;

  const [blockedByMe, blockedMe] = await Promise.all([
    Blocked.exists({ blocker: currentUserId, blocked: receiverId }),
    Blocked.exists({ blocker: receiverId, blocked: currentUserId }),
  ]);

  return res.status(200).json({
    success: true,
    status: {
      blockedByMe: Boolean(blockedByMe),
      blockedMe: Boolean(blockedMe),
      canMessage: !(blockedByMe || blockedMe),
    },
  });
});

export const messageReactionController = asyncHandler(async (req, res) => {
  console.log("Lets do the emoji stuff");
  const { messageId } = req.params;
  const userId = req.user._id;
  const { emoji } = req.body.emoji;

  const message = await Message.findById(messageId);

  if (!message) {
    return res.status(404).json({
      success: false,
      message: "Message doesn't exists",
    });
  }

  const isUserAllowed =
    message.senderId.equals(userId) || message.receiverId.equals(userId);

  if (!isUserAllowed) {
    return res.status(403).json({
      success: false,
      message: "You are not allowed to react to this message",
    });
  }

  const result = await messageReactionService(userId, messageId, emoji);

  //Some more stuff here
});
