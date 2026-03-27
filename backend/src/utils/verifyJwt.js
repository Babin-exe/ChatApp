import jwt from "jsonwebtoken";
import HttpError from "./HttpError.js";

const verifyJwt = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    throw new HttpError("Invalid or expired token", 401);
  }
};

export default verifyJwt;