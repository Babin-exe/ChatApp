import mongoose from "mongoose";
import User from "./user.model.js";

const blockSchema = new mongoose.Schema({
    blocker: {
        type: mongoose.Schema.Types.ObjectId,
        ref: User,
        required: true
    },
    blocked: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: User
    }

}, { timestamps: true });



blockSchema.index({ blocker: 1, blocked: 1 }, { unique: true });


blockSchema.index({ blocked: 1 });

const Blocked = mongoose.model("Blocked", blockSchema);

export default Blocked;



