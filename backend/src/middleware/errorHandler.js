import HttpError from "../utils/HttpError.js";

const errorHandler = (err, req, res, next) => {
  if (err instanceof HttpError) {
    return res
      .status(err.status)
      .json({ success: false, message: err.message });
  }

  if (err.name === "CastError" && err.kind === "ObjectId") {
    return res
      .status(400)
      .json({ success: false, message: "Invalid Id format" });
  }

  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ success: false, message: messages.join(", ") });
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue).join(", ");
    return res
      .status(409)
      .json({ success: false, message: `Duplicate value for: ${field}` });
  }



  if (err.type === "entity.parse.failed") {
    return res
      .status(400)
      .json({ success: false, message: "Invalid JSON in request body" });
  }



  console.error("Unhandled server error : ", err);

  return res
    .status(500)
    .json({ success: false, message: "Internal server error" });
};

export default errorHandler;
