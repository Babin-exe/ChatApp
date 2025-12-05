import Message from "../models/Message.js";
import User from "../models/user.model.js";
import Chat from "../models/Chat.js";

const updateChatStatus = async (chatId, status, actorId, systemMessage) => {
  //This will search for the chat By id
  const chat = await Chat.findById(chatId);

  //If the chat is not found
  if (!chat) throw { status: 404, message: "Chat not found" };

  //This will run if status is anything other than "pending"
  if (chat.status !== "pending") {
    throw {
      status: 400,
      message: `Chat is already ${chat.status} , cannot ${status}`,
    };
  }

  //This will check the person who is accepting/declining/blocking is correct person

  const isReceiver =
    chat.members.some((id) => id.toString() === actorId.toString()) &&
    actorId.toString() !== chat.initiator.toString();

  //If the person is not verified
  if (!isReceiver) {
    throw {
      status: 403,
      message: `You are not authorized to : ${status} this request`,
    };
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

export const createChatRequest = async (req, res) => {
  try {
    const senderId = req.user._id;
    const { receiverId } = req.body;

    if (!receiverId) {
      return res.status(400).json({ message: "Receiver ID is required." });
    }

    if (senderId.toString() === receiverId.toString()) {
      return res
        .status(400)
        .json({ message: "Cannot send request to yourself." });
    }

    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res
        .status(404)
        .json({ success: false, message: "Receiver not found" });
    }

    const existingChat = await Chat.findOne({
      members: { $all: [senderId, receiverId] },
      status: { $in: ["pending", "accepted"] },
    });

    if (existingChat) {
      return res.status(400).json({ message: "Chat Already Exists" });
    }

    const chat = await Chat.create({
      members: [senderId, receiverId],
      status: "pending",
      initiator: senderId,
    });

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

    return res.status(201).json({
      success: true,
      chat: populatedChat,
      message: "Chat request sent successfully",
    });
  } catch (error) {
    console.log("Error creating chat request : ", error);
    return res.status(error.status || 500).json({
      success: false,
      error: error.message || "Internal server error",
    });
  }
};

export const acceptChatRequest = async (req, res) => {
  try {
    const acceptorId = req.user._id;
    const { chatId } = req.params.chatId;

    const updatedChat = await updateChatStatus(
      chatId,
      "accepted",
      acceptorId,
      "Chat request accepted"
    );

    return res.status(200).json({
      success: true,
      message: "Chat request accepted successfully",
      chat: updatedChat,
    });
  } catch (error) {
    console.log("Error accepting the message request", error);
    return res.status(error.status || 500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

export const declineChatRequest = async (req, res) => {
  try {
    const updatedChat = await updateChatStatus(
      req.params.chatId,
      "declined",
      req.user._id,
      "Chat request declined"
    );

    return res.status(200).json({
      success: true,
      message: " Chat request declined successfully ",
      chat: updatedChat,
    });
  } catch (error) {
    console.error("Error declining the request ", error);
    return res.status(error.status || 500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

export const blockChatRequest = async (req, res) => {
  try {
    const updatedChat = await updateChatStatus(
      req.params.chatId,
      "blocked",
      req.user._id,
      "Chat request blocked"
    );

    return res.status(200).json({
      success: true,
      message: " Chat request blocked successfully ",
      chat: updatedChat,
    });
  } catch (error) {
    console.error("Error blocking the request", error);
    return res.status(error.status || 500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

export const getContacts = async (req, res) => {
  try {
    const userId = req.user._id;

    if (!userId) {
      return res.status(404).json({
        success: false,
        message: "UserId is required to get the contacts",
      });
    }

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
  } catch (error) {
    console.error("Cannot get the contacts: ", error);
    return res.status(error.status || 500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

export const getUserMessage = async (req, res) => {
  const senderId = req.user._id;
  const { receiverId } = req.params.receiverId;

  
};
