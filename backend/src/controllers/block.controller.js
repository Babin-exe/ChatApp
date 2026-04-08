import { blockUserService } from "../services/block.service";


export const blockUser = async (req, res, next) => {
    const { blockerId, blockedId } = req.body;
    try {
    } catch (error) { }
};


export const unblockUser = async (req, res, next) => {
    const { blockedId, blockerId } = req.body;
    try {

    } catch (error) { 
        
    }
}