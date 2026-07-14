import { randomUUID } from 'crypto';
import QRCode from 'qrcode';

/**
 * Generate a unique QR token using crypto.randomUUID.
 * @returns {string} UUID token
 */
export const generateQRToken = () => randomUUID();

/**
 * Generate a QR code image as a base64 data URL from a token.
 * @param {string} token - The QR token to encode
 * @returns {Promise<string>} Base64 PNG data URL (data:image/png;base64,...)
 */
export const generateQRImage = async (token) => {
    try {
        const dataUrl = await QRCode.toDataURL(token, {
            errorCorrectionLevel: 'H',
            width: 400,
            margin: 2,
        });
        return dataUrl;
    } catch (err) {
        throw new Error(`QR generation failed: ${err.message}`);
    }
};
