import Chat from "../models/Chat.js";
import Message from "../models/Message.js";
import HttpError from "../utils/HttpError.js";
import validateObjectId from "../utils/validation.js";
import User from "../models/user.model.js";
import { sendToUser, onChatAccepted } from "../lib/socket.js";
import mongoose, { mongo } from "mongoose";
import {
  DEFAULT_MESSAGE_TYPE,
  DEFAULT_MESSAGE_STATUS,
} from "../constants/message.constants.js";



const ALLOWED_STATUS = ["declined", "blocked", "accepted"];
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
      400,
    );
  }


  const isMember = chat.members.some(
    (id) => id.toString() === actorId.toString(),
  );

  const isNotInitiator = actorId.toString() !== chat.initiator.toString();



  if (status === "accepted" || status === "declined") {
    if (!isMember || !isNotInitiator) {
      throw new HttpError(`Not authorized to: ${status} this request`, 403);
    }
  }



  const otherMemberId = chat.members.find(
    (id) => id.toString() !== actorId.toString(),
  );


  const newMessage = await Message.create({
    senderId: actorId,
    receiverId: otherMemberId,
    chatId: chat._id,
    content: systemMessage,
    type: "system",
    status: DEFAULT_MESSAGE_STATUS,
  });


  const updated = await Chat.findByIdAndUpdate(
    chatId,
    { status, lastMessage: newMessage._id },
    { new: true },
  )
    .populate("members", "name email profilePic")
    .populate("lastMessage", "content");

  if (status === "accepted" && chat.members.length >= 2) {
    const [m0, m1] = chat.members;
    onChatAccepted(m0.toString(), m1.toString());
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
        400,
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
    { new: true },
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
    messages.length === parsedLimit
      ? messages[0].createdAt
      : null;

  return { messages, nextCursor, chatId: chat._id };
};

export const sendMessage = async ({
  senderId,
  receiverId,
  content,
  type = DEFAULT_MESSAGE_TYPE,
}) => {

  validateObjectId(senderId, "senderId");
  validateObjectId(receiverId, "receiverId");


  if (!content || !content.trim()) {
    throw new HttpError("Message content is required", 400);
  }


  const chat = await Chat.findOne({
    members: { $all: [senderId, receiverId] },
    status: "accepted",
  });


  if (!chat) {
    throw new HttpError("Active chat not found or request not accepted", 404);
  }


  const message = await Message.create({
    senderId,
    receiverId,
    chatId: chat._id,
    content: content.trim(),
    type,
    status: DEFAULT_MESSAGE_STATUS,
  });

  await Chat.findByIdAndUpdate(chat._id, { lastMessage: message._id });



  const realtimePayload = {
    type: "message",
    data: message.toObject(),
  };

  sendToUser(receiverId.toString(), realtimePayload);



  return message;
};



export const getIncomingChatRequest = async ({ userId }) => {

  validateObjectId(userId, "userId");

  const chats = await Chat.find({
    members: userId,
    status: "pending",
    initiator: { $ne: userId }
  })
    .populate("initiator", "email name profilePic")
    .sort({ createdAt: -1 });



  return chats.map((chat) => ({
    chatId: chat._id,
    from: chat.initiator,
    createdAt: chat.createdAt,
  }));
};



const toObjectId = (id) => id instanceof mongoose.Types.ObjectId ? id : mongoose.Types.ObjectId.createFromHexString(id);

const prefixRange = (prefix) => ({
  $gte: prefix,
  $lt: `${prefix}\uffff`
});

export const discoverUsersToChat = async ({ userId, q = "" }) => {

  //Make sure the id is valid
  validateObjectId(userId, "userId");

  //Get the id of the user  in proper format
  const uid = toObjectId(userId);

  //Make the search param better 
  const search = String(q ?? "").trim().toLowerCase().slice(0, 64);

  const excludedUsers = (await Chat.distinct("members", {
    members: uid,
    status: { $in: ["accepted", "pending"] },
  })).filter(id => !id.equals(uid));

  //These are the ids i want to exclude 
  const excludedIds = [...excludedUsers, uid];

  //This is my filter 
  const filter = {
    _id: { $nin: excludedIds },
    isVerified: { $ne: false }
  };



  if (search) {
    filter.$or = [
      { nameSearch: prefixRange(search) },
      { emailSearch: prefixRange(search) },
    ]
  }


  return User.find(filter).select("_id name email profilePic")
    .sort({ nameSearch: 1, _id: 1 })
    .limit(20)
    .lean().exec();
};

