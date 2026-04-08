import Blocked from "../models/Block.js";


const isBlocked = async (userA, userB) => {

    return Blocked.exists({
        $or: [
            { blocker: userA, blocked: userB },
            { blocker: userB, blocked: userA }
        ]
    });

}

export default isBlocked;