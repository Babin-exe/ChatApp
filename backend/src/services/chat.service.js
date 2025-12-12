import Chat from "../models/Chat.js";
import Message from "../models/Message.js";
import HttpError from "../utils/HttpError.js";
import validateObjectId from "../utils/validation.js";
import User from "../models/user.model.js";

const ALLOWED_STATUS = ["declined", "blocked", "accepted"];
export const updateChatStatus = async ({
  chatId,
  status,
  actorId,
  systemMessage,
}) => {
  validateObjectId(chatId);
  validateObjectId(actorId);

  if (!ALLOWED_STATUS.includes(status)) {
    throw new HttpError("Invalid chat status", 400);
  }

  //This will search for the chat By id
  const chat = await Chat.findById(chatId);

  //If the chat is not found
  if (!chat) throw new HttpError("Chat not found", 404);

  //This will run if status is anything other than "pending"
  if (chat.status !== "pending") {
    throw new HttpError(
      `Chat is already ${chat.status}, cannot ${status}`,
      400
    );
  }

  //This will check the person who is accepting/declining/blocking is correct person

  const isMember = chat.members.some(
    (id) => id.toString() === actorId.toString()
  );

  const isInitiator = actorId.toString() !== chat.initiator.toString();

  //If the person is not verified
  if (!isMember || !isInitiator) {
    throw new HttpError(`Not authorized to: ${status} this request`, 403);
  }

  //Update the status in the database
  const updatedChat = await Chat.findByIdAndUpdate(
    chatId,
    { status },
    { new: true }
  ).populate("members", "name email profilePic");

  //Create a new message for this updation
  await Message.create({
    senderId: actorId,
    receiverId: chat.initiator,
    chatId: updatedChat._id,
    content: systemMessage,
    type: "system",
    status: "sent",
  });

  return updatedChat;
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
        400
      );
    }
    throw err;
  }

  await Message.create({
    senderId,
    receiverId,
    chatId: chat._id,
    content: "Sent a chat request",
    type: "system",
    status: "sent",
  });

  const populatedChat = await Chat.findById(chat._id).populate(
    "members",
    "name email profilePic"
  );

  return populatedChat;
};

/*
@param {ObjectId} senderId - The ID of the current user.
 * @param {ObjectId} receiverId - The ID of the other user.
 * @param {string} [cursor] - The datetime string for pagination reference.
 * @param {number} [limit=30] - The maximum number of messages to return.
 * @returns {Promise<object>} */
export const getMessagesByChatParticipants = async ({
  senderId,
  receiverId,
  cursor,
  limit = 30,
}) => {
  //Making sure limit is bounded
  const parsedLimit = Math.min(Number(limit) || 30, 100);

  //This is to get the chat
  const chat = await Chat.findOne({
    members: { $all: [senderId, receiverId] },
    status: "accepted",
  });

  //If chat doesn't exists
  if (!chat) {
    throw new HttpError("Active chat not found or request not accepted", 404);
  }

  //This is for searching the database
  const query = { chatId: chat._id };

  //If cursor exists then we will use this as a reference point for fetching older messages

  const cursorDate = cursor ? new Date(cursor) : null;
  if (cursorDate && !isNaN(cursorDate)) {
    query.createdAt = { $lt: cursorDate };
  }

  if (cursor && isNaN(cursorDate)) {
    throw new HttpError("Invalid cursor format", 400);
  }

  //Get a limited message for the page
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

  //Set the cursor to the first message sent in the gained batch or null if all the messages are gained
  const nextCursor =
    messages.length === parsedLimit
      ? messages[messages.length - 1].createdAt
      : null;

  return { messages, nextCursor, chatId: chat._id };
};
