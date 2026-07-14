import mongoose from 'mongoose';

const registrationSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    event: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event',
        required: true,
    },
    qrToken: { type: String, unique: true },
    attended: { type: Boolean, default: false },
    // Student answers to organizer's custom form fields (key = field label)
    formResponses: { type: Map, of: String, default: {} },
    // Certificate tracking
    certificateIssued: { type: Boolean, default: false },
    certificateIssuedAt: { type: Date },
    // Payment proof (for paid events)
    paymentScreenshotUrl: { type: String },
    paymentStatus: {
        type: String,
        enum: ['not_required', 'pending', 'verified', 'rejected'],
        default: 'not_required',
    },
    paymentVerifiedAt: { type: Date },
    paymentRejectionReason: { type: String },
    registeredAt: { type: Date, default: Date.now },
});

// Prevent duplicate registrations for the same user + event
registrationSchema.index({ user: 1, event: 1 }, { unique: true });

const Registration = mongoose.model('Registration', registrationSchema);
export default Registration;
