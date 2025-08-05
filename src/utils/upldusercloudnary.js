import { v2 as cloudinary } from "cloudinary";
import { extname } from "path";
import sharp from "sharp";
import { Readable } from "stream";

const upldusercloudnary = async (files, folder) => {
  try {
    let filesLength = 1;
    let images = "";

    if (Array.isArray(files)) {
      images = [];
      filesLength = files.length;
    } else {
      images = "";
    }

    // max 3 images
    if (filesLength > 4) {
      console.log("You cannot upload more than 4 pictures");
      return false;
    }

    // We only support uploading one file at a time for your use case (adjust if you want multiple)
    // Here just process the first file
    let file = Array.isArray(files) ? files[0] : files;

    if (!file) {
      return false;
    }

    let filename = file.originalname;
    let file_extension = extname(filename).toLowerCase();

    if (
      file_extension === ".jpg" ||
      file_extension === ".png" ||
      file_extension === ".jpeg" ||
      file_extension === ".webp"
    ) {
      const bufferToStream = (buffer) => {
        const readable = new Readable({
          read() {
            this.push(buffer);
            this.push(null);
          },
        });
        return readable;
      };

      // Convert image buffer to webp
      const data = await sharp(file.buffer).webp({ quality: 80 }).toBuffer();

      // Return a Promise that resolves with the Cloudinary URL
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder },
          (error, result) => {
            if (error) {
              console.error("Cloudinary upload error:", error);
              return reject(error);
            }
            resolve(result.secure_url); // <-- Return the uploaded image URL
          }
        );
        bufferToStream(data).pipe(stream);
      });
    } else {
      console.log("Please select jpg/jpeg/png/webp image");
      return false;
    }
  } catch (error) {
    console.log(error);
    return false;
  }
};

export default upldusercloudnary;