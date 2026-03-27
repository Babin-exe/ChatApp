import mongoose from "mongoose";

const chatSchema = new mongoose.Schema(
  {
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "User",
      },
    ],
    memberKey: {
      type: String,
    },
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





chatSchema.pre("save", function (next) {
  if (this.isModified("members") || this.isNew) {
    this.members.sort((a, b) => a.toString().localeCompare(b.toString()));
    this.memberKey = this.members.map((m) => m.toString()).join("_");
  }
  next();
});



chatSchema.index(
  { memberKey: 1 },
  {
    unique: true,
    partialFilterExpression: { status: { $in: ["pending", "accepted"] } },
    sparse: true,
  }
);




chatSchema.index({ members: 1, lastMessage: -1 });
const Chat = mongoose.model("Chat", chatSchema);
export default Chat;
