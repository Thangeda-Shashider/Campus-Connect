import mongoose from 'mongoose';

/**
 * Achievement — stores student-submitted certifications & workshop proofs.
 * Scoped to the CSE department workflow: students upload proof each month;
 * admin (HOD) reviews, approves/rejects, and exports the data as CSV.
 */

const ACHIEVEMENT_TYPES = ['certification', 'workshop', 'seminar', 'webinar', 'other'];
const ACHIEVEMENT_STATUSES = ['pending', 'approved', 'rejected'];

const achievementSchema = new mongoose.Schema(
    {
        // The student who submitted
        student: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },

        // What the certification/workshop is called
        title: {
            type: String,
            required: true,
            trim: true,
            maxlength: 200,
        },

        // Category of achievement
        type: {
            type: String,
            enum: ACHIEVEMENT_TYPES,
            required: true,
        },

        // Organisation that issued / conducted it (e.g. "NPTEL", "Coursera", "IEEE")
        issuingOrganization: {
            type: String,
            required: true,
            trim: true,
            maxlength: 150,
        },

        // When the student completed / attended it
        completionDate: {
            type: Date,
            required: true,
        },

        // Convenience fields for fast month-based filtering without date range queries
        completionMonth: { type: Number, min: 1, max: 12 }, // 1–12
        completionYear: { type: Number },

        // Optional free-text description / key learnings
        description: {
            type: String,
            trim: true,
            maxlength: 1000,
        },

        // Proof of completion — stored as base64 data URL (Cloudinary stubbed)
        // Supports both images (JPG/PNG) and PDFs
        proofFileUrl: {
            type: String, // "data:<mime>;base64,<data>"
        },

        // Original filename shown in the admin table (e.g. "certificate.pdf")
        proofFileName: {
            type: String,
            trim: true,
        },

        // Admin review status
        status: {
            type: String,
            enum: ACHIEVEMENT_STATUSES,
            default: 'pending',
            index: true,
        },

        // Admin's rejection note (filled only when status === 'rejected')
        rejectionReason: {
            type: String,
            trim: true,
        },

        // Admin who reviewed (ref to User with role admin)
        reviewedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },

        reviewedAt: { type: Date },
    },
    {
        timestamps: true, // createdAt + updatedAt managed by Mongoose
    }
);

// Pre-save hook: auto-derive completionMonth and completionYear from completionDate
achievementSchema.pre('save', function (next) {
    if (this.isModified('completionDate') && this.completionDate) {
        const d = new Date(this.completionDate);
        this.completionMonth = d.getMonth() + 1; // JS months are 0-indexed
        this.completionYear = d.getFullYear();
    }
    next();
});

// Compound index for common admin query: filter by month + year + status
achievementSchema.index({ completionYear: 1, completionMonth: 1, status: 1 });

export const ACHIEVEMENT_TYPES_LIST = ACHIEVEMENT_TYPES;
export const ACHIEVEMENT_STATUSES_LIST = ACHIEVEMENT_STATUSES;

const Achievement = mongoose.model('Achievement', achievementSchema);
export default Achievement;
