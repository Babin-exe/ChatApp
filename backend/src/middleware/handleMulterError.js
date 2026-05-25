import multer from "multer";

export const multerErrorHandler = (err, req, res, next) => {

    if (err instanceof multer.MulterError) {

        switch (err.code) {

            case "LIMIT_FILE_SIZE": { return res.status(400).json({ success: false, message: "Image size exceeds the limit" }); }

            case "LIMIT_FILE_COUNT": { return res.status(400).json({ success: false, message: "Only one image can be uploaded" }); }

            case "LIMIT_UNEXPECTED_FILE": { return res.status(400).json({ success: false, message: "Unexpected file field" }); }

            case "LIMIT_PART_COUNT": { return res.status(400).json({ success: false, message: "Too many parts" }); }

            case "LIMIT_FIELD_COUNT": { return res.status(400).json({ success: false, message: "Too many fields" }); }

            case "LIMIT_FIELD_KEY": { return res.status(400).json({ success: false, message: "Field name too long" }); }

            case "LIMIT_FIELD_VALUE": { return res.status(400).json({ success: false, message: "Field value too large" }); }

            default: { return res.status(400).json({ success: false, message: "Multer error" }); }
        }
    }

    if (err) return res.status(400).json({ success: false, message: err.message || "Image upload failed" });

    next();
};