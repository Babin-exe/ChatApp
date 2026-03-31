import mongoose from "mongoose";
import {
  MESSAGE_TYPES,
  MESSAGE_STATUS,
  DEFAULT_MESSAGE_STATUS,
  DEFAULT_MESSAGE_TYPE
} from "../constants/message.constants.js";

const messageSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    chatId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chat",
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      required: true,
      default: DEFAULT_MESSAGE_TYPE,
      enum: MESSAGE_TYPES,
    },

    status: {
      type: String,
      enum: MESSAGE_STATUS,
      default: DEFAULT_MESSAGE_STATUS,
      required: true,
    },

    replyToMessageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },

    edited: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const Message = mongoose.model("Message", messageSchema);

export default Message;
