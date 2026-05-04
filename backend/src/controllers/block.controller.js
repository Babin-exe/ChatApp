import { blockUserService, unblockUserService, getBlockedUsersService } from "../services/block.service.js";
import asyncHandler from "../utils/asyncHandler.js";


export const blockUser = asyncHandler(async (req, res, next) => {
    const blockerId = req.user._id;
    const blockedId = req.params.blockedId;

    const data = await blockUserService(blockerId, blockedId);
    return res.json({ success: true, blockedUser: data });

});


export const unblockUser = asyncHandler(async (req, res, next) => {
    const blockerId = req.user._id;
    const blockedId = req.params.blockedId;

    const data = await unblockUserService(blockerId, blockedId);
    return res.json({ success: true, unblocked: data });

});


export const getBlockedUsers = asyncHandler(async (req, res, next) => {
    const userId = req.user._id;

    const data = await getBlockedUsersService(userId);
    return res.json({ success: true, blockedUsers: data });


});