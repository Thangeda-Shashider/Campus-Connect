import express from 'express';
import {
    getUsers,
    updateUserRole,
    updateUser,
    deleteUser,
    getAllEvents,
    updateEventStatus,
    getStats,
} from '../controllers/admin.controller.js';
import protect from '../middleware/auth.middleware.js';
import requireRole from '../middleware/role.middleware.js';

const router = express.Router();

router.use(protect, requireRole('admin'));

router.get('/users', getUsers);
router.put('/users/:id/role', updateUserRole);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);
router.get('/events', getAllEvents);
router.put('/events/:id/status', updateEventStatus);
router.get('/stats', getStats);

export default router;
