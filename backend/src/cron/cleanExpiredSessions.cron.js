import cron from "node-cron";
import User from "../models/user.model.js";

const cleanExpiredSessions = () => {
  cron.schedule("0 * * * *", async () => {
    try {
      const now = new Date();
      const result = await User.updateMany(
        { "sessions.expiresAt": { $lt: now } },
        { $pull: { sessions: { expiresAt: { $lt: now } } } }
      );
      console.info(
        `[CRON] Cleaned expired sessions from ${result.modifiedCount} users`
      );
    } catch (error) {
      console.error("[CRON] Failed to clean expired sessions:", error.message);
    }
  });
};

export default cleanExpiredSessions;
