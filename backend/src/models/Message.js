import mongoose from "mongoose";
import {
  MESSAGE_TYPES,
  MESSAGE_STATUS,
  DEFAULT_MESSAGE_STATUS,
  DEFAULT_MESSAGE_TYPE,
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
      default: "",
      trim: true,
    },
    type: {
      type: String,
      required: true,
      default: DEFAULT_MESSAGE_TYPE,
      enum: MESSAGE_TYPES,
    },
    image: {
      url: String,
      height: Number,
      width: Number,
      publicId: String,
      format: String,
      bytes: Number,
    },

    reactions: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        emoji: {
          type: String,
          required: true,
          maxlength: 16,
          trim: true,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

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
    deliveredAt: { type: Date, default: null },
    seenAt: { type: Date, default: null },
  },
  { timestamps: true }
);

messageSchema.index({ chatId: 1, createdAt: -1 });

messageSchema.pre("validate", function (next) {
  if (this.type === "image") {
    if (!this.image?.url) {
      this.invalidate("image.url", "Image URL is required for image messages");
    }

    if (!this.image?.publicId) {
      this.invalidate(
        "image.publicId",
        "Image publicId is required for image messages"
      );
    }
  }
  next();
});

const Message = mongoose.model("Message", messageSchema);

export default Message;
