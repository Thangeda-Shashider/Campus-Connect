import mongoose from 'mongoose';
import { CATEGORIES, EVENT_STATUSES } from '../constants/index.js';

// Schema for a single custom form field defined by the organizer
const formFieldSchema = new mongoose.Schema({
    label: { type: String, required: true, trim: true },
    type: { type: String, enum: ['text', 'email', 'number', 'phone', 'select'], default: 'text' },
    options: [{ type: String, trim: true }], // for type === 'select'
    required: { type: Boolean, default: false },
}, { _id: false });

const eventSchema = new mongoose.Schema({
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    category: {
        type: String,
        required: true,
        enum: CATEGORIES,
    },
    tags: [{ type: String, trim: true }],
    venue: { type: String, required: true, trim: true },
    date: { type: Date, required: true },
    registrationDeadline: { type: Date, required: true },
    maxSeats: { type: Number, min: 1 },
    bannerUrl: { type: String },
    organizer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    status: {
        type: String,
        enum: Object.values(EVENT_STATUSES),
        default: EVENT_STATUSES.UPCOMING,
    },
    // Registration form: organizer-defined custom fields
    registrationFormFields: { type: [formFieldSchema], default: [] },
    // Certificate: organizer can optionally issue certificates to attendees
    hasCertificate: { type: Boolean, default: false },
    // Payment: organizer can mark event as paid
    paymentRequired: { type: Boolean, default: false },
    paymentAmount: { type: Number, min: 0 },
    paymentQrUrl: { type: String }, // QR code image for payment (Cloudinary URL or base64)
    createdAt: { type: Date, default: Date.now },
});

// Text index for search
eventSchema.index({ title: 'text', description: 'text', tags: 'text' });

const Event = mongoose.model('Event', eventSchema);
export default Event;
