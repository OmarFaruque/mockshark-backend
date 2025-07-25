import { v2 as cloudinary } from "cloudinary";
import { extname } from "path";
import sharp from "sharp";
import { Readable } from "stream";
import dotenv from "dotenv";

dotenv.config();  // Load env variables

// Configure Cloudinary once globally
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload single or multiple images to Cloudinary, after converting to webp.
 * @param {Object|Array} file - single file object or array of files with buffer & originalname.
 * @param {string} folder - Cloudinary folder to upload to.
 * @returns {Promise<string|string[]>} - Returns URL string or array of URLs.
 */
const uploadToCLoudinary = async (file, folder) => {
  try {
    // Normalize to array
    const files = Array.isArray(file) ? file : [file];

    if (files.length > 5) {
      throw new Error("You cannot upload more than 5 pictures");
    }

    const uploadResults = [];

    for (const file of files) {
      if (!file || !file.buffer) {
        throw new Error("File or file buffer is undefined");
      }

      const fileExtension = extname(file.originalname).toLowerCase();
      const validExtensions = [".jpg", ".jpeg", ".png", ".webp"];

      if (!validExtensions.includes(fileExtension)) {
        throw new Error("Please select jpg/jpeg/png/webp image");
      }

      // Process image buffer with sharp to webp format
      const processedImage = await sharp(file.buffer)
        .webp({ quality: 80 })
        .toBuffer();

      // Upload to Cloudinary using upload_stream with folder and resource_type:image
      const result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder,
            resource_type: "image",
          },
          (error, result) => {
            if (error) {
              reject(error);
            } else {
              resolve(result);
            }
          }
        );

        // Pipe processed image buffer into the upload stream
        Readable.from(processedImage).pipe(uploadStream);
      });

      // Log full result for debugging
      console.log("Cloudinary upload result:", result);

      if (!result?.secure_url) {
        throw new Error("Cloudinary upload failed - no URL returned");
      }

      uploadResults.push(result.secure_url);
    }

    // Return single URL if one file, or array of URLs if multiple
    return Array.isArray(file) ? uploadResults : uploadResults[0];
  } catch (error) {
    console.error("Cloudinary upload error:", error.message);
    throw error; // propagate error
  }
};

export default uploadToCLoudinary;
