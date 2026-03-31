import Chat from "../models/Chat.js";
import asyncHandler from "../utils/asyncHandler.js";
import {
  updateChatStatus,
  getMessagesByChatParticipants,
  createNewChatRequest,
  sendMessage,
  getIncomingChatRequest,
  discoverUsersToChat,
} from "../services/chat.service.js";

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

export const blockChatRequest = asyncHandler(async (req, res) => {
  const updatedChat = await updateChatStatus({
    chatId: req.params.chatId,
    status: "blocked",
    actorId: req.user._id,
    systemMessage: "Chat request blocked",
  });

  return res.status(200).json({
    success: true,
    message: "Chat request blocked successfully",
    chat: updatedChat,
  });
});

export const getContacts = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const contacts = await Chat.aggregate([
    { $match: { members: userId, status: "accepted" } },
    { $unwind: "$members" },
    { $match: { members: { $ne: userId } } },
    {
      $lookup: {
        from: "users",
        localField: "members",
        foreignField: "_id",
        as: "member",
      },
    },
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
  ]);

  return res.status(200).json({
    success: true,
    contacts,
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
  // Get all the required data here

  const senderId = req.user._id;
  const { content, type } = req.body;
  const { receiverId } = req.params;

  const message = await sendMessage({
    senderId,
    receiverId,
    content,
    type: type || "text",
  });

  return res.status(200).json({
    success: true,
    message: "Message sent successfully",
    messageData: message,
  });
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
