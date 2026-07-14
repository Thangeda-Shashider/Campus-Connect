import express from 'express';
import { body } from 'express-validator';
import {
    getEvents,
    getEventById,
    createEvent,
    updateEvent,
    deleteEvent,
    getMyEvents,
} from '../controllers/event.controller.js';
import protect from '../middleware/auth.middleware.js';
import requireRole from '../middleware/role.middleware.js';
import { upload } from '../config/cloudinary.js';
import { CATEGORIES } from '../constants/index.js';

const router = express.Router();

const eventValidation = [
    body('title').notEmpty().withMessage('Title is required'),
    body('description').notEmpty().withMessage('Description is required'),
    body('category')
        .isIn(CATEGORIES)
        .withMessage(`Category must be one of: ${CATEGORIES.join(', ')}`),
    body('venue').notEmpty().withMessage('Venue is required'),
    body('date').isISO8601().withMessage('Valid date is required'),
    body('registrationDeadline')
        .isISO8601()
        .withMessage('Valid registration deadline is required'),
];

// IMPORTANT: /my/events must be before /:id to avoid route conflict
router.get('/my/events', protect, requireRole('organizer', 'admin'), getMyEvents);

router.get('/', getEvents);
router.get('/:id', getEventById);
router.post(
    '/',
    protect,
    requireRole('organizer', 'admin'),
    upload.fields([
        { name: 'banner', maxCount: 1 },
        { name: 'paymentQr', maxCount: 1 },
    ]),
    eventValidation,
    createEvent
);
router.put(
    '/:id',
    protect,
    requireRole('organizer', 'admin'),
    upload.fields([
        { name: 'banner', maxCount: 1 },
        { name: 'paymentQr', maxCount: 1 },
    ]),
    updateEvent
);
router.delete('/:id', protect, requireRole('organizer', 'admin'), deleteEvent);

export default router;
