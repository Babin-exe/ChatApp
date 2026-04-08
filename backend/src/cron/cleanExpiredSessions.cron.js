import cron from "node-cron";
import User from "../models/user.model.js";

const cleanExpiredSessions = () => {
    /*
    "0 * * * *"
    │ │ │ │ │
    │ │ │ │ └── Day of week (0-7, 0 and 7 = Sunday)
    │ │ │ └──── Month (1-12)
    │ │ └────── Day of month (1-31)
    │ └──────── Hour (0-23)
    └────────── Minute (0-59)

 */

    cron.schedule("0 * * * *", async () => {
        try {
            const now = new Date();
            const result = await User.updateMany(
                { "sessions.expiresAt": { $lt: now } }, { $pull: { sessions: { expiresAt: { $lt: now } } } }
            );
            console.log(`[CRON] Cleaned expired sessions from ${result.modifiedCount} users`);
        } catch (error) {
            console.error("[CRON] Failed to clean expired sessions:", error.message);
        }

    })

};


export default cleanExpiredSessions;

