import multer from "multer";


const storage = multer.memoryStorage();


export const uploadImage = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024,
    },
    fileFilter: (_, file, cb) => {
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i) || !file.mimetype.startsWith("image/")) {
            cb(new Error("Only image files are allowed"), false);
            return;
        }
        cb(null, true);
    },
});


