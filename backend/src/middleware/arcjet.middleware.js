import { aj } from "../lib/arcjet.js";
import { isSpoofedBot } from "@arcjet/inspect";
import asyncHandler from "../utils/asyncHandler.js"

export const arcjetProtection = asyncHandler(async (req, res, next) => {
  try {
    if (!process.env.ARCJET_KEY) {
      return next();
    }

    const decision = await aj.protect(req, {
      user: req.user?._id.toString() || req.ip,
    });

    if (decision.isDenied()) {
      if (decision.reason.isRateLimit()) {
        return res
          .status(429)
          .json({ success: false, message: "RATE_LIMITED" });
      }
      if (decision.reason.isBot()) {
        return res.status(403).json({ success: false, message: "BOT_BLOCKED" });
      }
      return res.status(403).json({ success: false, message: "FORBIDDEN" });
    }
    if (decision.results.some(isSpoofedBot)) {
      return res.status(403).json({ success: false, message: "FORBIDDEN" });
    }
    return next();
  } catch (error) {
    console.error("Arcject Protection Error : ", error);
    if (req.user) {
      return next();
    }
    return res
      .status(503)
      .json({ success: false, message: "RATE_LIMIT_SERVICE_UNAVAILABLE" });
  }
});
