import HttpError from "../utils/HttpError.js";

import multer from "multer";

const errorHandler = (err, req, res, next) => {

  if (err instanceof multer.MulterError) {
    switch (err.code) {

      case "LIMIT_FILE_SIZE": { return res.status(413).json({ success: false, message: "Image size exceeds the limit" }); }

      case "LIMIT_FILE_COUNT": { return res.status(400).json({ success: false, message: "Only one image can be uploaded" }); }

      case "LIMIT_UNEXPECTED_FILE": { return res.status(400).json({ success: false, message: "Unexpected file field" }); }

      case "LIMIT_PART_COUNT": { return res.status(400).json({ success: false, message: "Too many parts" }); }

      case "LIMIT_FIELD_COUNT": { return res.status(400).json({ success: false, message: "Too many fields" }); }

      case "LIMIT_FIELD_KEY": { return res.status(400).json({ success: false, message: "Field name too long" }); }

      case "LIMIT_FIELD_VALUE": { return res.status(400).json({ success: false, message: "Field value too large" }); }

      default: { return res.status(400).json({ success: false, message: "Multer error" }); }
    }
  }

  if (err.message === "Invalid file type") {
    return res.status(400).json({ success: false, message: err.message });
  }


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
