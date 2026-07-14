import jwt from 'jsonwebtoken';
import { validationResult } from 'express-validator';
import User from '../models/User.js';

// Cookie config
const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

/**
 * Sign a JWT for the given user.
 * @param {{ _id: string, role: string }} user
 * @returns {string} JWT token
 */
const signToken = (user) =>
    jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, {
        expiresIn: '7d',
    });

// POST /api/auth/register
export const register = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res
                .status(400)
                .json({ success: false, error: errors.array()[0].msg });
        }

        const { name, email, password, role, department, year, interests } =
            req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res
                .status(409)
                .json({ success: false, error: 'Email already in use' });
        }

        const user = await User.create({
            name,
            email,
            password,
            role,
            department,
            year,
            interests,
        });

        const token = signToken(user);
        res.cookie('token', token, COOKIE_OPTIONS);

        return res.status(201).json({ success: true, data: user });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
};

// POST /api/auth/login
export const login = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res
                .status(400)
                .json({ success: false, error: errors.array()[0].msg });
        }

        const { email, password } = req.body;

        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            return res
                .status(401)
                .json({ success: false, error: 'Invalid email or password' });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res
                .status(401)
                .json({ success: false, error: 'Invalid email or password' });
        }

        const token = signToken(user);
        res.cookie('token', token, COOKIE_OPTIONS);

        // Remove password from user object before responding
        const userObj = user.toJSON();

        return res.status(200).json({ success: true, data: userObj });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
};

// POST /api/auth/logout
export const logout = (_req, res) => {
    res.clearCookie('token', { httpOnly: true, sameSite: 'lax' });
    return res
        .status(200)
        .json({ success: true, data: { message: 'Logged out successfully' } });
};

// GET /api/auth/me
export const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        if (!user) {
            return res
                .status(404)
                .json({ success: false, error: 'User not found' });
        }
        return res.status(200).json({ success: true, data: user });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
};
