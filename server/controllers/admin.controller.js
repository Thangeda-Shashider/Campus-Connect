import User from '../models/User.js';
import Event from '../models/Event.js';
import Registration from '../models/Registration.js';
import { ROLES } from '../constants/index.js';

// GET /api/admin/users
export const getUsers = async (_req, res) => {
    try {
        const users = await User.find().sort({ createdAt: -1 });
        return res.status(200).json({ success: true, data: users });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
};

// PUT /api/admin/users/:id/role
export const updateUserRole = async (req, res) => {
    try {
        const { role } = req.body;
        if (!Object.values(ROLES).includes(role)) {
            return res.status(400).json({ success: false, error: 'Invalid role' });
        }
        const user = await User.findByIdAndUpdate(
            req.params.id,
            { role },
            { new: true }
        );
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }
        return res.status(200).json({ success: true, data: user });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
};

// DELETE /api/admin/users/:id
export const deleteUser = async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }
        return res
            .status(200)
            .json({ success: true, data: { message: 'User deleted' } });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
};

// PUT /api/admin/users/:id  — update profile fields (name, email, department, year)
export const updateUser = async (req, res) => {
    try {
        const { name, email, department, year } = req.body;
        const user = await User.findByIdAndUpdate(
            req.params.id,
            { name, email, department, year },
            { new: true, runValidators: true }
        );
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }
        return res.status(200).json({ success: true, data: user });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
};

// GET /api/admin/events
export const getAllEvents = async (_req, res) => {
    try {
        const events = await Event.find()
            .populate('organizer', 'name email')
            .sort({ createdAt: -1 });
        return res.status(200).json({ success: true, data: events });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
};

// PUT /api/admin/events/:id/status
export const updateEventStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const event = await Event.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true, runValidators: true }
        );
        if (!event) {
            return res.status(404).json({ success: false, error: 'Event not found' });
        }
        return res.status(200).json({ success: true, data: event });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
};

// GET /api/admin/stats
export const getStats = async (_req, res) => {
    try {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const [
            totalUsers,
            totalEvents,
            registrationsThisMonth,
            attendedCount,
            totalRegistrations,
        ] = await Promise.all([
            User.countDocuments(),
            Event.countDocuments(),
            Registration.countDocuments({ registeredAt: { $gte: startOfMonth } }),
            Registration.countDocuments({ attended: true }),
            Registration.countDocuments(),
        ]);

        const attendanceRate =
            totalRegistrations > 0
                ? ((attendedCount / totalRegistrations) * 100).toFixed(1)
                : 0;

        return res.status(200).json({
            success: true,
            data: {
                totalUsers,
                totalEvents,
                registrationsThisMonth,
                attendanceRate: Number(attendanceRate),
            },
        });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
};
