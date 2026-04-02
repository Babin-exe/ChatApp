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



/*
Our flow here is 

when ever a user connects to the web socket server we will hit a db call 
to get the contacts of the user and store it somewhere

and then every time contacts is asked for we will give it from that cache rather
than hitting the database call 

one edge case can be if a user updates thier contacts we need to re update the cache at 
real time 




okay what else do we need to think about

never let a user who is not connected to you , that means request accepted 
see your status but when the status is made to accepted from anything like pending , blocked
etc we need to immdiately make sure contacts is updated and info is exchanged



*/