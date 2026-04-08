import verifyJwt from "../utils/verifyJwt.js";
import User from "../models/user.model.js";
import HttpError from "../utils/HttpError.js";
import asyncHandler from "../utils/asyncHandler.js";

export const protectRoute = asyncHandler(async (req, res, next) => {

  const token = req.cookies.token;
  const now = new Date();

  if (!token) {
    throw new HttpError("Unauthorized - token not found", 401);
  }

  const decode = verifyJwt(token);

  const user = await User.findOneAndUpdate(
    {
      _id: decode.id,
      sessions: { $elemMatch: { token, expiresAt: { $gt: now } } },
    }
    , {
      $pull: { sessions: { expiresAt: { $lt: now } } }
    }, { new: true }
  ).select("-password");

  if (!user) {
    throw new HttpError("Session expired or logged out", 401);
  }

  req.user = user;
  next();
});
