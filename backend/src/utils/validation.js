import mongoose from "mongoose";
import HttpError from "./HttpError.js";

const validateObjectId = (id, label) => {
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    throw new HttpError(`Invalid or missing ${label}`, 400);
  }
};

export default validateObjectId;
