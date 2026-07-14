import Registration from '../models/Registration.js';
import Event from '../models/Event.js';
import User from '../models/User.js';
import { generateQRToken, generateQRImage } from '../utils/generateQR.js';
import { sendRegistrationEmail } from '../utils/mailer.js';

// POST /api/registrations/:eventId
export const registerForEvent = async (req, res) => {
    try {
        const event = await Event.findById(req.params.eventId);
        if (!event) {
            return res.status(404).json({ success: false, error: 'Event not found' });
        }

        // Deadline check
        if (new Date() > new Date(event.registrationDeadline)) {
            return res
                .status(400)
                .json({ success: false, error: 'Registration deadline has passed' });
        }

        // Seat check
        if (event.maxSeats) {
            const count = await Registration.countDocuments({ event: event._id });
            if (count >= event.maxSeats) {
                return res
                    .status(400)
                    .json({ success: false, error: 'Event is fully booked' });
            }
        }

        // Duplicate check
        const existing = await Registration.findOne({
            user: req.user.userId,
            event: event._id,
        });
        if (existing) {
            return res
                .status(409)
                .json({ success: false, error: 'Already registered for this event' });
        }

        // Validate required form fields
        const formResponses = req.body.formResponses || {};
        if (event.registrationFormFields?.length > 0) {
            for (const field of event.registrationFormFields) {
                if (field.required && !formResponses[field.label]) {
                    return res.status(400).json({
                        success: false,
                        error: `"${field.label}" is required`,
                    });
                }
            }
        }

        const qrToken = generateQRToken();
        const registration = await Registration.create({
            user: req.user.userId,
            event: event._id,
            qrToken,
            formResponses,
            // If paid event, start with pending status
            paymentStatus: event.paymentRequired ? 'pending' : 'not_required',
        });

        // Generate QR and email asynchronously (don't block the response)
        const user = await User.findById(req.user.userId);
        generateQRImage(qrToken).then((qrBase64) => {
            sendRegistrationEmail(user, event, qrBase64).catch(console.error);
        });

        return res.status(201).json({ success: true, data: { registration, qrToken } });
    } catch (err) {
        if (err.code === 11000) {
            return res
                .status(409)
                .json({ success: false, error: 'Already registered for this event' });
        }
        return res.status(500).json({ success: false, error: err.message });
    }
};

// GET /api/registrations/my
export const getMyRegistrations = async (req, res) => {
    try {
        const registrations = await Registration.find({ user: req.user.userId })
            .populate({
                path: 'event',
                populate: { path: 'organizer', select: 'name email' },
            })
            .sort({ registeredAt: -1 });

        return res.status(200).json({ success: true, data: registrations });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
};

// GET /api/registrations/event/:eventId
export const getEventRegistrations = async (req, res) => {
    try {
        const event = await Event.findById(req.params.eventId);
        if (!event) {
            return res.status(404).json({ success: false, error: 'Event not found' });
        }
        // Organizer can only see their own events unless admin
        if (
            event.organizer.toString() !== req.user.userId &&
            req.user.role !== 'admin'
        ) {
            return res
                .status(403)
                .json({ success: false, error: 'Access denied' });
        }

        const registrations = await Registration.find({ event: req.params.eventId })
            .populate('user', 'name email department year')
            .sort({ registeredAt: -1 });

        return res.status(200).json({ success: true, data: registrations });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
};

// POST /api/registrations/checkin
export const checkIn = async (req, res) => {
    try {
        const { qrToken } = req.body;
        if (!qrToken) {
            return res
                .status(400)
                .json({ success: false, error: 'QR token is required' });
        }

        const registration = await Registration.findOne({ qrToken })
            .populate('user', 'name email department')
            .populate('event', 'title date');

        if (!registration) {
            return res
                .status(404)
                .json({ success: false, error: 'Invalid QR token' });
        }
        if (registration.attended) {
            return res.status(400).json({
                success: false,
                error: 'QR already scanned — attendance already recorded',
            });
        }

        registration.attended = true;
        await registration.save();

        return res.status(200).json({ success: true, data: registration });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
};

// PATCH /api/registrations/:registrationId/attendance
// Organizer manually toggles attendance for a student
export const toggleAttendance = async (req, res) => {
    try {
        const registration = await Registration.findById(req.params.registrationId)
            .populate({ path: 'event', select: 'organizer title' })
            .populate('user', 'name email');

        if (!registration) {
            return res.status(404).json({ success: false, error: 'Registration not found' });
        }

        if (
            registration.event.organizer.toString() !== req.user.userId &&
            req.user.role !== 'admin'
        ) {
            return res.status(403).json({ success: false, error: 'Access denied' });
        }

        // Toggle or set explicitly via body
        registration.attended = req.body.attended !== undefined
            ? Boolean(req.body.attended)
            : !registration.attended;

        await registration.save();

        return res.status(200).json({ success: true, data: registration });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
};

// PATCH /api/registrations/:registrationId/certificate
export const issueCertificate = async (req, res) => {
    try {
        const registration = await Registration.findById(req.params.registrationId)
            .populate({ path: 'event', select: 'organizer hasCertificate title' })
            .populate('user', 'name email');

        if (!registration) {
            return res.status(404).json({ success: false, error: 'Registration not found' });
        }

        // Only the event's organizer (or admin) can issue certificates
        if (
            registration.event.organizer.toString() !== req.user.userId &&
            req.user.role !== 'admin'
        ) {
            return res.status(403).json({ success: false, error: 'Access denied' });
        }

        if (!registration.event.hasCertificate) {
            return res.status(400).json({ success: false, error: 'This event does not have certificates enabled' });
        }

        const { issue } = req.body; // boolean — true = issue, false = revoke
        registration.certificateIssued = issue !== false;
        registration.certificateIssuedAt = registration.certificateIssued ? new Date() : null;
        await registration.save();

        return res.status(200).json({ success: true, data: registration });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
};

// POST /api/registrations/:registrationId/payment-screenshot
// Student uploads payment proof screenshot
export const uploadPaymentScreenshot = async (req, res) => {
    try {
        const registration = await Registration.findById(req.params.registrationId)
            .populate({ path: 'event', select: 'organizer paymentRequired title' });

        if (!registration) {
            return res.status(404).json({ success: false, error: 'Registration not found' });
        }

        // Only the registration owner can upload their screenshot
        if (registration.user.toString() !== req.user.userId) {
            return res.status(403).json({ success: false, error: 'Access denied' });
        }

        if (!registration.event.paymentRequired) {
            return res.status(400).json({ success: false, error: 'This event does not require payment' });
        }

        if (!req.file) {
            return res.status(400).json({ success: false, error: 'No screenshot uploaded' });
        }

        // Convert to base64 data URL for storage (since Cloudinary is stubbed)
        const mimeType = req.file.mimetype;
        const base64Data = req.file.buffer.toString('base64');
        const paymentScreenshotUrl = `data:${mimeType};base64,${base64Data}`;

        registration.paymentScreenshotUrl = paymentScreenshotUrl;
        registration.paymentStatus = 'pending';
        registration.paymentRejectionReason = null;
        await registration.save();

        return res.status(200).json({
            success: true,
            data: {
                paymentStatus: registration.paymentStatus,
                message: 'Payment screenshot uploaded. Awaiting organizer verification.',
            },
        });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
};

// PATCH /api/registrations/:registrationId/payment-verify
// Organizer verifies or rejects a payment screenshot
export const verifyPayment = async (req, res) => {
    try {
        const registration = await Registration.findById(req.params.registrationId)
            .populate({ path: 'event', select: 'organizer paymentRequired title' })
            .populate('user', 'name email');

        if (!registration) {
            return res.status(404).json({ success: false, error: 'Registration not found' });
        }

        // Only the event's organizer (or admin) can verify payments
        if (
            registration.event.organizer.toString() !== req.user.userId &&
            req.user.role !== 'admin'
        ) {
            return res.status(403).json({ success: false, error: 'Access denied' });
        }

        const { status, rejectionReason } = req.body;
        if (!['verified', 'rejected'].includes(status)) {
            return res.status(400).json({ success: false, error: 'Status must be "verified" or "rejected"' });
        }

        registration.paymentStatus = status;
        if (status === 'verified') {
            registration.paymentVerifiedAt = new Date();
            registration.paymentRejectionReason = null;
        } else {
            registration.paymentRejectionReason = rejectionReason || 'Payment could not be verified';
            registration.paymentVerifiedAt = null;
        }
        await registration.save();

        return res.status(200).json({ success: true, data: registration });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
};

// GET /api/registrations/event/:eventId/export
export const exportCSV = async (req, res) => {
    try {
        const registrations = await Registration.find({
            event: req.params.eventId,
        }).populate('user', 'name email department year');

        const header = 'Name,Email,Department,Year,QR Token,Attended,Certificate Issued,Payment Status,Registered At\n';
        const rows = registrations
            .map(
                (r) =>
                    `"${r.user?.name}","${r.user?.email}","${r.user?.department || ''}","${r.user?.year || ''}","${r.qrToken}","${r.attended}","${r.certificateIssued}","${r.paymentStatus}","${r.registeredAt.toISOString()}"`
            )
            .join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader(
            'Content-Disposition',
            `attachment; filename="registrations-${req.params.eventId}.csv"`
        );
        return res.send(header + rows);
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
};
