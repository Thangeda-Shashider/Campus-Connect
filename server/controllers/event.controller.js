import Event from '../models/Event.js';
import Registration from '../models/Registration.js';
import { uploadToCloud } from '../config/cloudinary.js';
import { EVENT_STATUSES } from '../constants/index.js';
import { validationResult } from 'express-validator';

// GET /api/events
export const getEvents = async (req, res) => {
    try {
        const { category, tag, search, dateFrom, dateTo, page = 1, limit = 12 } = req.query;
        const filter = { status: EVENT_STATUSES.UPCOMING };

        if (category) filter.category = category;
        if (tag) filter.tags = { $in: [tag] };
        if (search) filter.$text = { $search: search };
        if (dateFrom || dateTo) {
            filter.date = {};
            if (dateFrom) filter.date.$gte = new Date(dateFrom);
            if (dateTo) filter.date.$lte = new Date(dateTo);
        }

        const skip = (Number(page) - 1) * Number(limit);
        const total = await Event.countDocuments(filter);
        const events = await Event.find(filter)
            .populate('organizer', 'name email')
            .sort({ date: 1 })
            .skip(skip)
            .limit(Number(limit));

        // Attach registration count per event
        const enriched = await Promise.all(
            events.map(async (event) => {
                const count = await Registration.countDocuments({ event: event._id });
                return { ...event.toObject(), registrationCount: count };
            })
        );

        return res.status(200).json({
            success: true,
            data: enriched,
            pagination: { total, page: Number(page), limit: Number(limit) },
        });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
};

// GET /api/events/my/events
export const getMyEvents = async (req, res) => {
    try {
        const events = await Event.find({ organizer: req.user.userId }).sort({
            createdAt: -1,
        });

        const enriched = await Promise.all(
            events.map(async (event) => {
                const count = await Registration.countDocuments({ event: event._id });
                return { ...event.toObject(), registrationCount: count };
            })
        );

        return res.status(200).json({ success: true, data: enriched });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
};

// GET /api/events/:id
export const getEventById = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id).populate(
            'organizer',
            'name email department'
        );
        if (!event) {
            return res
                .status(404)
                .json({ success: false, error: 'Event not found' });
        }
        const registrationCount = await Registration.countDocuments({
            event: event._id,
        });
        return res.status(200).json({
            success: true,
            data: { ...event.toObject(), registrationCount },
        });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
};

// POST /api/events
export const createEvent = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res
                .status(400)
                .json({ success: false, error: errors.array()[0].msg });
        }

        // req.files is an object when using upload.fields()
        const files = req.files || {};
        let bannerUrl;
        if (files.banner?.[0]) {
            bannerUrl = await uploadToCloud(files.banner[0].buffer, files.banner[0].originalname);
        }
        // Store payment QR as base64 data URL (Cloudinary stub returns placeholder, not the actual image)
        let paymentQrUrl;
        if (files.paymentQr?.[0]) {
            const f = files.paymentQr[0];
            paymentQrUrl = `data:${f.mimetype};base64,${f.buffer.toString('base64')}`;
        }

        // Parse registration form fields (sent as JSON string in multipart)
        let registrationFormFields = [];
        if (req.body.registrationFormFields) {
            try {
                registrationFormFields = JSON.parse(req.body.registrationFormFields);
            } catch { registrationFormFields = []; }
        }

        const event = await Event.create({
            ...req.body,
            organizer: req.user.userId,
            bannerUrl,
            paymentQrUrl,
            registrationFormFields,
            hasCertificate: req.body.hasCertificate === 'true' || req.body.hasCertificate === true,
            paymentRequired: req.body.paymentRequired === 'true' || req.body.paymentRequired === true,
            paymentAmount: req.body.paymentAmount ? Number(req.body.paymentAmount) : undefined,
        });

        return res.status(201).json({ success: true, data: event });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
};

// PUT /api/events/:id
export const updateEvent = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) {
            return res
                .status(404)
                .json({ success: false, error: 'Event not found' });
        }
        if (event.organizer.toString() !== req.user.userId) {
            return res
                .status(403)
                .json({ success: false, error: 'Not authorized to edit this event' });
        }

        // req.files is an object when using upload.fields()
        const files = req.files || {};
        let bannerUrl = event.bannerUrl;
        if (files.banner?.[0]) {
            bannerUrl = await uploadToCloud(files.banner[0].buffer, files.banner[0].originalname);
        }
        let paymentQrUrl = event.paymentQrUrl;
        if (files.paymentQr?.[0]) {
            const f = files.paymentQr[0];
            paymentQrUrl = `data:${f.mimetype};base64,${f.buffer.toString('base64')}`;
        }

        // Parse registration form fields (sent as JSON string in multipart)
        let registrationFormFields = event.registrationFormFields;
        if (req.body.registrationFormFields) {
            try {
                registrationFormFields = JSON.parse(req.body.registrationFormFields);
            } catch { registrationFormFields = event.registrationFormFields; }
        }

        const updated = await Event.findByIdAndUpdate(
            req.params.id,
            {
                ...req.body,
                bannerUrl,
                paymentQrUrl,
                registrationFormFields,
                hasCertificate: req.body.hasCertificate === 'true' || req.body.hasCertificate === true,
                paymentRequired: req.body.paymentRequired === 'true' || req.body.paymentRequired === true,
                paymentAmount: req.body.paymentAmount ? Number(req.body.paymentAmount) : event.paymentAmount,
            },
            { new: true, runValidators: true }
        );

        return res.status(200).json({ success: true, data: updated });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
};

// DELETE /api/events/:id
export const deleteEvent = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) {
            return res
                .status(404)
                .json({ success: false, error: 'Event not found' });
        }
        if (event.organizer.toString() !== req.user.userId) {
            return res.status(403).json({
                success: false,
                error: 'Not authorized to delete this event',
            });
        }

        await event.deleteOne();
        await Registration.deleteMany({ event: req.params.id });

        return res
            .status(200)
            .json({ success: true, data: { message: 'Event deleted' } });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
};
