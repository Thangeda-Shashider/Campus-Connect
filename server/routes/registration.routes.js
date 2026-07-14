import express from 'express';
import {
    registerForEvent,
    getMyRegistrations,
    getEventRegistrations,
    checkIn,
    exportCSV,
    issueCertificate,
    uploadPaymentScreenshot,
    verifyPayment,
    toggleAttendance,
} from '../controllers/registration.controller.js';
import protect from '../middleware/auth.middleware.js';
import requireRole from '../middleware/role.middleware.js';
import { upload } from '../config/cloudinary.js';

const router = express.Router();

// All registration routes require auth
router.use(protect);

router.post('/:eventId', requireRole('student'), registerForEvent);
router.get('/my', getMyRegistrations);
router.get('/event/:eventId', requireRole('organizer', 'admin'), getEventRegistrations);
router.post('/checkin', requireRole('organizer', 'admin'), checkIn);
router.get('/event/:eventId/export', requireRole('organizer', 'admin'), exportCSV);
router.patch('/:registrationId/certificate', requireRole('organizer', 'admin'), issueCertificate);
router.patch('/:registrationId/attendance', requireRole('organizer', 'admin'), toggleAttendance);

// Payment routes
router.post(
    '/:registrationId/payment-screenshot',
    requireRole('student'),
    upload.single('screenshot'),
    uploadPaymentScreenshot
);
router.patch('/:registrationId/payment-verify', requireRole('organizer', 'admin'), verifyPayment);

export default router;

