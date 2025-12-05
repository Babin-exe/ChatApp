import mongoose from "mongoose";

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
      default: "text",
      enum: ["text", "image", "video", "system"],
    },

    status: {
      type: String,
      enum: ["sent", "delivered", "read"],
      default: "sent",
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
