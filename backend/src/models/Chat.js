import mongoose, { mongo } from "mongoose";

const chatSchema = new mongoose.Schema(
  {
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "User",
      },
    ],
    initiator: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },

    status: {
      type: String,
      enum: ["pending", "accepted", "declined", "blocked"],
      default: "pending",
    },

    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },
  },
  { timestamps: true }
);

chatSchema.index(
  { members: 1, status: 1 },
  {
    unique: true,
    partialFilterExpression: { status: { $in: ["pending", "accepted"] } },
  }
);

const Chat = mongoose.model("Chat", chatSchema);
export default Chat;
