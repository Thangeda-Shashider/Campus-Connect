import express from 'express';
import {
    submitAchievement,
    getMyAchievements,
    getAllAchievements,
    exportAchievementsCSV,
    updateAchievementStatus,
} from '../controllers/achievement.controller.js';
import protect from '../middleware/auth.middleware.js';
import requireRole from '../middleware/role.middleware.js';
import { upload } from '../config/cloudinary.js';

const router = express.Router();

// Require authentication for all achievement routes
router.use(protect);

// ─── Student Routes ─────────────────────────────────────────────────────────
// POST /api/achievements (upload proof file in 'proof' field)
router.post('/', requireRole('student'), upload.single('proof'), submitAchievement);

// GET /api/achievements/my
router.get('/my', requireRole('student'), getMyAchievements);

// ─── Admin Routes ───────────────────────────────────────────────────────────
// GET /api/achievements (with optional filters)
router.get('/', requireRole('admin'), getAllAchievements);

// GET /api/achievements/export (download CSV)
router.get('/export', requireRole('admin'), exportAchievementsCSV);

// PATCH /api/achievements/:id/status (approve/reject)
router.patch('/:id/status', requireRole('admin'), updateAchievementStatus);

export default router;
