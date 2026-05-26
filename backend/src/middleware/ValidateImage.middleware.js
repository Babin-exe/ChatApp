import HttpError from "../utils/HttpError.js";
import { fileTypeFromBuffer } from "file-type";


const allowedMimeTypes = new Set([
    "image/png",
    "image/jpeg",
    "image/gif",
    "image/webp",
]);

export const validateUploadedImageFile = async (req, res, next) => {

    if (!req.file) return next();
    const detected = await fileTypeFromBuffer(req.file.buffer);

    if (!detected || !allowedMimeTypes.has(detected.mime)) return (new HttpError("Invalid image file", 400));

    next();
};
