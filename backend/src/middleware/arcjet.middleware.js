import { aj } from "../lib/arcjet.js";
import { isSpoofedBot } from "@arcjet/inspect";

export const arcjectProtection = async (req, res, next) => {
  try {
    const decison = await aj.protect(req, {
      user: req.user?._id.toString() || req.ip,
    });

    if (decison.isDenied()) {
      if (decison.reason.isRateLimit()) {
        return res
          .status(429)
          .json({ success: false, message: "RATE_LIMITED" });
      }
      if (decison.reason.isBot()) {
        return res.status(403).json({ success: false, message: "BOT_BLOCKED" });
      }
      return res.status(403).json({ success: false, message: "FORBIDDEN" });
    }
    if (decison.results.some(isSpoofedBot)) {
      return res.status(403).json({ success: false, message: "FORBIDDEN" });
    }
    return next();
  } catch (error) {
    console.log("Arcject Protection Error : ", error);
    if (req.user) {
      return next();
    }
    return res
      .status(503)
      .json({ success: false, message: "RATE_LIMIT_SERVICE_UNAVAILABLE" });
  }
};
