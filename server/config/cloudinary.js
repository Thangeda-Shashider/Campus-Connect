import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
dotenv.config();

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Files are stored in memory using Multer.
 * They are uploaded to Cloudinary on-the-fly inside controllers.
 */

// In-memory storage stub
const storage = multer.memoryStorage();

export const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
    fileFilter: (_req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'), false);
        }
    },
});

/**
 * Uploads a buffer to Cloudinary.
 * If Cloudinary credentials are not set in .env, falls back to a placeholder.
 * 
 * @param {Buffer} buffer - File buffer from multer
 * @param {string} originalname - Original filename
 * @returns {Promise<string>} Uploaded image URL
 */
export const uploadToCloud = async (buffer, originalname) => {
    // Fallback if Cloudinary is not configured in .env
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY) {
        console.warn('⚠️ Cloudinary credentials missing in .env. Falling back to placeholder.');
        return 'https://placehold.co/1200x400?text=Event+Banner';
    }

    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: 'campusconnect',
                public_id: `${Date.now()}-${originalname.split('.')[0]}`,
            },
            (error, result) => {
                if (error) return reject(error);
                resolve(result.secure_url);
            }
        );
        
        // Write the buffer to the upload stream
        uploadStream.end(buffer);
    });
};
