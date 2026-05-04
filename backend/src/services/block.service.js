import { onChatAccepted, onChatRelationRemoved } from "../lib/socket.js";
import Blocked from "../models/Block.js";
import Chat from "../models/Chat.js";
import User from "../models/user.model.js";
import HttpError from "../utils/HttpError.js";
import validateObjectId from "../utils/validation.js";


export const blockUserService = async (blockerId, blockedId) => {

    validateObjectId(blockerId, "blocker");
    validateObjectId(blockedId, "blocked");


    if (blockedId.toString() === blockerId.toString()) {
        throw new HttpError("You cannot block yourself", 400);
    }

    const blockedInfo = await Blocked.findOne({ blocker: blockerId, blocked: blockedId });


    if (blockedInfo) {
        return blockedInfo;
    }


    const blockedUser = await User.findById(blockedId).select("_id name email profilePic");

    if (!blockedUser) {
        throw new HttpError("User not found", 404);
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



    await Chat.deleteMany({ members: { $all: [blockerId, blockedId] }, status: "pending" });




    return blocked;
};



/*
1) Validate both user IDs and prepare string versions for later use (mainly for events/response)

2) Prevent invalid operation: a user cannot unblock themselves

3) Attempt to delete the block relationship where:
   blocker = blockerId AND blocked = blockedId

4) Check if a document was actually deleted:
   - If not, it means no such block existed → throw error

5) Check if ANY block still exists between the two users in either direction:
   (A blocked B OR B blocked A)

6) If a block still exists:
   - Do nothing further (chat remains restricted)
   - Return response with restoredPresence = false

7) If NO block exists anymore:
   - Check if an accepted chat exists between the users

8) If such a chat exists:
   - Trigger onChatAccepted(blocker, blocked)
   - This likely restores visibility / presence / messaging capability

9) Return response:
   - unblockedId → who was unblocked
   - deletedCount → confirms deletion
   - restoredPresence → whether chat state was restored

   */
export const unblockUserService = async (blockerId, blockedId) => {
    validateObjectId(blockerId, "blocker");
    validateObjectId(blockedId, "blocked");

    const blocker = blockerId.toString();
    const blocked = blockedId.toString();

    if (blocked === blocker) {
        throw new HttpError("You cannot unblock yourself", 400);
    }

    const unblockResult = await Blocked.deleteOne({
        blocker: blockerId,
        blocked: blockedId,
    });

    if (unblockResult.deletedCount === 0) {
        throw new HttpError("Block relationship not found", 404);
    }

    const stillBlocked = await Blocked.exists({
        $or: [
            { blocker: blockerId, blocked: blockedId },
            { blocker: blockedId, blocked: blockerId },
        ],
    });

    let restoredPresence = false;

    if (!stillBlocked) {
        const acceptedChatExists = await Chat.exists({
            members: { $all: [blockerId, blockedId] },
            status: "accepted",
        });

        if (acceptedChatExists) {
            onChatAccepted(blocker, blocked);
            restoredPresence = true;
        }
    }

    return {
        unblockedId: blocked,
        deletedCount: unblockResult.deletedCount,
        restoredPresence,
    };
};


export const getBlockedUsersService = async (userId) => {


    validateObjectId(userId, "UserId");

    try {
        const blockedUsers = await Blocked.find({ blocker: userId })
            .populate("blocked", "name email profilePic")
            .sort({ createdAt: -1 });



        return blockedUsers;

    } catch (error) {
        console.error("Error getting blocked users: ", error.message);
        throw new HttpError("Failed to get blocked users", 500);
    }
};
