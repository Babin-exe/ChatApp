import HttpError from "../utils/HttpError.js";

const errorHandler = async (err, req, res, next) => {
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

  console.error("Unhandled server error : ", err);

  return res
    .status(500)
    .json({ success: false, message: "Internal server error" });
};

export default errorHandler;
