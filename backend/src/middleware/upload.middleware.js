import multer from "multer";

const storage = multer.memoryStorage();


const allowedMimeTypes = new Set(["image/png", "image/jpg", "image/jpeg", "image/gif", "image/webp"]);

const MAX_FILE_SIZE = 5 * 1024 * 1024;


const fileFilter = (req, file, cb) => {
    if (!allowedMimeTypes.has(file.mimetype)) {
        return cb(new Error("Invalid file type"), false);
    }
    cb(null, true);
}


export const upload = multer({
    storage,
    limits: { fileSize: MAX_FILE_SIZE, files: 1, fields: 5, fieldSize: 4 * 1024, parts: 6 },
    fileFilter
});

export const uploadImage = upload.single("image");



