import Chat from "../models/Chat.js";
import Message from "../models/Message.js";
import HttpError from "../utils/HttpError.js";
import validateObjectId from "../utils/validation.js";
import User from "../models/user.model.js";
import {
  sendToUser,
  onChatAccepted,
  onChatRelationRemoved,
} from "../lib/socket.js";
import mongoose from "mongoose";
import {
  DEFAULT_MESSAGE_TYPE,
  DEFAULT_MESSAGE_STATUS,
} from "../constants/message.constants.js";
import isBlocked from "../utils/blockChecker.js";
import Blocked from "../models/Block.js";

const ALLOWED_STATUS = ["declined", "accepted"];

export const updateChatStatus = async ({
  chatId,
  status,
  actorId,
  systemMessage,
}) => {
  validateObjectId(chatId, "chatId");
  validateObjectId(actorId, "actorId");

  if (!ALLOWED_STATUS.includes(status)) {
    throw new HttpError("Invalid chat status", 400);
  }

  const chat = await Chat.findById(chatId);

  if (!chat) throw new HttpError("Chat not found", 404);

  if (chat.status !== "pending") {
    throw new HttpError(
      `Chat is already ${chat.status}, cannot ${status}`,
      400
    );
  }

  const isMember = chat.members.some(
    (id) => id.toString() === actorId.toString()
  );

  const isNotInitiator = actorId.toString() !== chat.initiator.toString();

  if (status === "accepted" || status === "declined") {
    if (!isMember || !isNotInitiator) {
      throw new HttpError(`Not authorized to: ${status} this request`, 403);
    }
  }

  const otherMemberId = chat.members.find(
    (id) => id.toString() !== actorId.toString()
  );

  const blocked = await isBlocked(actorId, otherMemberId);

  if (status === "accepted" && blocked) {
    throw new HttpError("Cannot do stuff with blocked chat request", 403);
  }

  const newMessage = await Message.create({
    senderId: actorId,
    receiverId: otherMemberId,
    chatId: chat._id,
    content: systemMessage,
    type: "system",
    status: DEFAULT_MESSAGE_STATUS,
  });

  const updated = await Chat.findOneAndUpdate(
    { _id: chatId, status: "pending" },
    { status, lastMessage: newMessage._id },
    { new: true }
  )
    .populate("members", "name email profilePic")
    .populate("lastMessage", "content");

  if (!updated) {
    await Message.findByIdAndDelete(newMessage._id);
    throw new HttpError(
      "Chat status was alredy updated by another request",
      409
    );
  }

  if (status === "accepted" && chat.members.length >= 2) {
    const [m0, m1] = chat.members;
    onChatAccepted(m0.toString(), m1.toString());
  }

  if (status === "declined" && chat.members.length >= 2) {
    const [m0, m1] = chat.members;
    onChatRelationRemoved(m0.toString(), m1.toString());
  }

  return updated;
};

export const createNewChatRequest = async ({ senderId, receiverId }) => {
  validateObjectId(senderId, "senderId");
  validateObjectId(receiverId, "receiverId");

  if (senderId.toString() === receiverId.toString()) {
    throw new HttpError("Cannot send request to yourself.", 400);
  }

  const receiver = await User.findById(receiverId);
  if (!receiver) {
    throw new HttpError("Receiver not found", 404);
  }

  const blocked = await isBlocked(senderId, receiverId);
  if (blocked) {
    throw new HttpError("You cannot send a request to this user", 403);
  }

  let chat;
  try {
    chat = await Chat.create({
      members: [senderId, receiverId],
      status: "pending",
      initiator: senderId,
    });
  } catch (err) {
    if (err.code === 11000) {
      throw new HttpError(
        "Chat Request (pending or accepted) already exists with this user.",
        400
      );
    }
    throw err;
  }

  const newMessage = await Message.create({
    senderId,
    receiverId,
    chatId: chat._id,
    content: "Sent a chat request",
    type: "system",
    status: DEFAULT_MESSAGE_STATUS,
  });

  const populatedChat = await Chat.findByIdAndUpdate(
    chat._id,
    { lastMessage: newMessage._id },
    { new: true }
  )
    .populate("members", "name email profilePic")
    .populate("lastMessage", "content");

  return populatedChat;
};

export const getMessagesByChatParticipants = async ({
  senderId,
  receiverId,
  cursor,
  limit = 30,
}) => {
  const parsedLimit = Math.min(Number(limit) || 30, 100);

  const chat = await Chat.findOne({
    members: { $all: [senderId, receiverId] },
    status: "accepted",
  });

  if (!chat) {
    throw new HttpError("Active chat not found or request not accepted", 404);
  }

  const query = { chatId: chat._id };

  const cursorDate = cursor ? new Date(cursor) : null;

  if (cursor && isNaN(cursorDate)) {
    throw new HttpError("Invalid cursor format", 400);
  }

  if (cursorDate && !isNaN(cursorDate)) {
    query.createdAt = { $lt: cursorDate };
  }

  const messages = await Message.find(query)
    .sort({ createdAt: -1 })
    .limit(parsedLimit)
    .populate("senderId", "name profilePic")
    .populate({
      path: "replyToMessageId",
      select: "senderId content type",
      populate: { path: "senderId", select: "name" },
    })
    .exec();

  messages.reverse();

  const nextCursor =
    messages.length === parsedLimit ? messages[0].createdAt : null;

  return { messages, nextCursor, chatId: chat._id };
};

/**
 * Run before Cloudinary upload so a failed chat/block check does not leave orphans.
 * @param {{ hasImage?: boolean }} options - pass hasImage: true when req.file is present (pre-upload).
 */
export const validateSendMessage = async ({
  senderId,
  receiverId,
  content,
  image,
  type = DEFAULT_MESSAGE_TYPE,
  hasImage = false,
}) => {
  validateObjectId(senderId, "senderId");
  validateObjectId(receiverId, "receiverId");

  const trimmedContent = String(content ?? "").trim();

  if (type === "text" && !trimmedContent) {
    throw new HttpError("Message content is required", 400);
  }

  if (type === "image" && !hasImage && !image?.url) {
    throw new HttpError("Image is required", 400);
  }

  const chat = await Chat.findOne({
    members: { $all: [senderId, receiverId] },
    status: "accepted",
  });

  if (!chat) {
    throw new HttpError("Active chat not found or request not accepted", 404);
  }

  const blocked = await isBlocked(senderId, receiverId);

  if (blocked) {
    throw new HttpError("You cannot message this user", 403);
  }

  return { trimmedContent, chat };
};

export const createMessage = async ({
  senderId,
  receiverId,
  chatId,
  content,
  image,
  type,
}) => {
  const message = await Message.create({
    senderId,
    receiverId,
    chatId,
    content,
    type,
    image: type === "image" ? image : undefined,
    status: DEFAULT_MESSAGE_STATUS,
  });

  await Chat.findByIdAndUpdate(chatId, { lastMessage: message._id });

  const realtimePayload = {
    type: "message",
    data: message.toObject(),
  };

  sendToUser(receiverId.toString(), realtimePayload);

  return message;
};

export const sendMessage = async ({
  senderId,
  receiverId,
  content,
  image,
  type = DEFAULT_MESSAGE_TYPE,
}) => {
  const hasImage = type === "image" && Boolean(image?.url);

  const { trimmedContent, chat } = await validateSendMessage({
    senderId,
    receiverId,
    content,
    image,
    type,
    hasImage,
  });

  return createMessage({
    senderId,
    receiverId,
    chatId: chat._id,
    content: trimmedContent,
    image,
    type,
  });
};

export const getIncomingChatRequest = async ({ userId }) => {
  validateObjectId(userId, "userId");

  const blockedByMe = await Blocked.distinct("blocked", { blocker: userId });
  const blockedMe = await Blocked.distinct("blocker", { blocked: userId });

  const chats = await Chat.find({
    members: userId,
    status: "pending",
    initiator: { $nin: [userId, ...blockedByMe, ...blockedMe] },
  })
    .populate("initiator", "email name profilePic")
    .sort({ createdAt: -1 });

  return chats.map((chat) => ({
    chatId: chat._id,
    from: chat.initiator,
    createdAt: chat.createdAt,
  }));
};

const toObjectId = (id) =>
  id instanceof mongoose.Types.ObjectId
    ? id
    : mongoose.Types.ObjectId.createFromHexString(id);

const prefixRange = (prefix) => ({
  $gte: prefix,
  $lt: `${prefix}\uffff`,
});

export const discoverUsersToChat = async ({ userId, q = "" }) => {
  //Make sure the id is valid
  validateObjectId(userId, "userId");

  //Get the id of the user  in proper format
  const uid = toObjectId(userId);

  //Make the search param better
  const search = String(q ?? "")
    .trim()
    .toLowerCase()
    .slice(0, 64);
  const blockedByMe = await Blocked.distinct("blocked", { blocker: uid });
  const blockedMe = await Blocked.distinct("blocker", { blocked: uid });

  const excludedUsers = (
    await Chat.distinct("members", {
      members: uid,
      status: { $in: ["accepted", "pending"] },
    })
  ).filter((id) => !id.equals(uid));

  //These are the ids i want to exclude
  const excludedIds = [...excludedUsers, ...blockedByMe, ...blockedMe, uid];

  //This is my filter
  const filter = {
    _id: { $nin: excludedIds },
    isVerified: { $ne: false },
  };

  if (search) {
    filter.$or = [
      { nameSearch: prefixRange(search) },
      { emailSearch: prefixRange(search) },
    ];
  }

  return User.find(filter)
    .select("_id name email profilePic")
    .sort({ nameSearch: 1, _id: 1 })
    .limit(20)
    .lean()
    .exec();
};

export const messageReactionService = async ({ userId, messageId, emoji }) => {
  const message = await Message.findById(messageId);

  const existingReactions = message.reactions.find((r) =>
    r.user.equals(userId)
  );

  if (existingReactions) {
    if (existingReactions.emoji === emoji) {
      message.reactions = message.reactions.filter(
        (r) => !r.user.equals(userId)
      );
    } else {
      existingReactions.emoji = emoji;
    }
  } else {
    message.reactions.push({ user: userId, emoji });
  }

  const result = await message.save();
  return result;
};
