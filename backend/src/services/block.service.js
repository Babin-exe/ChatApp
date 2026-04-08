import { onChatRelationRemoved } from "../lib/socket.js";
import Blocked from "../models/Block.js";
import Chat from "../models/Chat.js";
import HttpError from "../utils/HttpError.js";
import validateObjectId from "../utils/validation.js";


export const blockUserService = async (blockerId, blockedId) => {

    validateObjectId(blockerId, "blocker");
    validateObjectId(blockedId, "blocked");


    if (blockedId.toString() === blockerId.toString()) {
        throw new HttpError("You cannot block yourself", 401);
    }

    const blockedInfo = await Blocked.findOne({ blockedId, blockedId });


    if (blockedInfo) {
        return blockedInfo;
    }

    const blocked = await Blocked.create({
        blocker: blockerId,
        blocked: blockedId
    });


    const chat = await Chat.findOne({
        members: { $all: [blockerId, blockedId] }
    }
    );

    if (chat && chat.members.length >= 2 && chat.status === "accepted") {
        const [m0, m1] = chat.members;
        onChatRelationRemoved(m0.toString(), m1.toString());
    }

    return { success: true, data: { blocked } };
};
export const unblockUserService = async (blockerId, blockedId) => {

    validateObjectId(blockerId, "blocker");
    validateObjectId(blockedId, "blocker");

    if (blockedId.toString() === blockerId.toString()) {
        throw new HttpError("You cannot unblock yourself", 401);
    }



    const blockedInfo = await Blocked.findOne({ blocker: blockerId, blocked: blockedId });

    if (!blockedInfo) {
        throw new HttpError("You have not blocked this user", 401);
    }

    const unblocked = await Blocked.deleteOne({ blocker: blockerId, blocked: blockedId });
    if (!unblocked) {
        throw new HttpError("Failed to unblock user", 500);
    }
    return { success: true, data: { unblocked } };
};

export const getBlockedUsersService = async (userId) => {

    validateObjectId(userId, "UserId");

    const blockedUsers = await Blocked.find({ blocker: userId })
        .populate("blocked name email profilePic")
        .sort({ createdAt: -1 });


    return { success: true, message: blockedUsers };
}