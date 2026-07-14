import multer from 'multer';

/**
 * Cloudinary upload is STUBBED until credentials are configured.
 * Files are stored in memory and the original name is returned as bannerUrl.
 * Replace this with cloudinary-multer-storage once credentials are ready.
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
 * Stub uploader — returns a placeholder URL.
 * Replace the body of this function with a real Cloudinary upload call.
 * @param {Buffer} _buffer - File buffer
 * @param {string} _originalname - Original filename
 * @returns {Promise<string>} Uploaded image URL
 */
export const uploadToCloud = async (_buffer, _originalname) => {
    // TODO: wire real Cloudinary upload here
    return 'https://placehold.co/1200x400?text=Event+Banner';
};
