import cloudinary from "../lib/cloudinary.js";
import streamifier from "streamifier";

export const uploadImageToCloudinary = async (buffer) => {

   const result = await new Promise((resolve, reject) => {

      const stream = cloudinary.uploader.upload_stream(
         {
            folder: "chat-app",
         },
         (error, result) => {
            if (error) reject(error);
            else resolve(result);
         }
      );

      streamifier
         .createReadStream(buffer)
         .pipe(stream);

   });

   return {
      url: result.secure_url,
      width: result.width,
      height: result.height,
      publicId: result.public_id,
      format: result.format,
      bytes: result.bytes,
   };
};