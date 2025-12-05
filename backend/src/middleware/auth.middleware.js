import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

export const protectRoute = async (req, res, next) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Couldn't verify the user , token not found",
      });
    }
    const decode = jwt.verify(token, process.env.JWT_SECRET);
    if (!decode) {
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized - user not found" });
    }

    const user = await User.findById(decode.id).select("-password");
    if (!user) {
      return res.status(404).json({ stauts: false, message: "User not found" });
    }
    req.user = user;
    next(); 
  } catch (err) {
    console.log("Error in the auth route : ", err);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};
