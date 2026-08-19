import Achievement from '../models/Achievement.js';

// POST /api/achievements
// Student uploads a new certification/workshop proof
export const submitAchievement = async (req, res) => {
    try {
        const { title, type, issuingOrganization, completionDate, description } = req.body;

        if (!req.file) {
            return res.status(400).json({ success: false, error: 'Proof file is required' });
        }

        // Convert to base64 data URL for storage (Cloudinary stub)
        const mimeType = req.file.mimetype;
        const base64Data = req.file.buffer.toString('base64');
        const proofFileUrl = `data:${mimeType};base64,${base64Data}`;
        const proofFileName = req.file.originalname;

        const achievement = await Achievement.create({
            student: req.user.userId,
            title,
            type,
            issuingOrganization,
            completionDate,
            description,
            proofFileUrl,
            proofFileName,
        });

        return res.status(201).json({ success: true, data: achievement });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
};

// GET /api/achievements/my
// Student views their own submissions
export const getMyAchievements = async (req, res) => {
    try {
        const achievements = await Achievement.find({ student: req.user.userId }).sort({ createdAt: -1 });
        return res.status(200).json({ success: true, data: achievements });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
};

// GET /api/achievements
// Admin views all submissions with optional filters (month, year, status, department)
export const getAllAchievements = async (req, res) => {
    try {
        const { month, year, status, department } = req.query;
        const query = {};

        if (month) query.completionMonth = parseInt(month, 10);
        if (year) query.completionYear = parseInt(year, 10);
        if (status) query.status = status;

        let achievements = await Achievement.find(query)
            .populate('student', 'name email department year')
            .sort({ createdAt: -1 });

        // Filter by department if provided (since department is in the populated User model)
        if (department) {
            achievements = achievements.filter(
                (a) => a.student && a.student.department && a.student.department.toLowerCase() === department.toLowerCase()
            );
        }

        return res.status(200).json({ success: true, data: achievements });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
};

// GET /api/achievements/export
// Admin downloads achievements as CSV
export const exportAchievementsCSV = async (req, res) => {
    try {
        const { month, year, status, department } = req.query;
        const query = {};

        if (month) query.completionMonth = parseInt(month, 10);
        if (year) query.completionYear = parseInt(year, 10);
        if (status) query.status = status;

        let achievements = await Achievement.find(query)
            .populate('student', 'name email department year')
            .sort({ createdAt: -1 });

        if (department) {
            achievements = achievements.filter(
                (a) => a.student && a.student.department && a.student.department.toLowerCase() === department.toLowerCase()
            );
        }

        const header = 'Student Name,Email,Department,Year,Title,Type,Issuing Organization,Completion Date,Status,Submitted At\n';
        const rows = achievements
            .map((a) => {
                const sName = a.student?.name || '';
                const sEmail = a.student?.email || '';
                const sDept = a.student?.department || '';
                const sYear = a.student?.year || '';
                const cDate = a.completionDate ? a.completionDate.toISOString().split('T')[0] : '';
                const subDate = a.createdAt ? a.createdAt.toISOString() : '';
                return `"${sName}","${sEmail}","${sDept}","${sYear}","${a.title}","${a.type}","${a.issuingOrganization}","${cDate}","${a.status}","${subDate}"`;
            })
            .join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader(
            'Content-Disposition',
            `attachment; filename="achievements-${month || 'all'}-${year || 'all'}.csv"`
        );
        return res.send(header + rows);
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
};

// PATCH /api/achievements/:id/status
// Admin marks an achievement as approved or rejected
export const updateAchievementStatus = async (req, res) => {
    try {
        const { status, rejectionReason } = req.body;
        
        if (!['approved', 'rejected', 'pending'].includes(status)) {
            return res.status(400).json({ success: false, error: 'Invalid status' });
        }

        const updateData = {
            status,
            reviewedBy: req.user.userId,
            reviewedAt: new Date(),
        };

        if (status === 'rejected') {
            updateData.rejectionReason = rejectionReason || 'No reason provided';
        } else {
            updateData.rejectionReason = null;
        }

        const achievement = await Achievement.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        ).populate('student', 'name email');

        if (!achievement) {
            return res.status(404).json({ success: false, error: 'Achievement not found' });
        }

        return res.status(200).json({ success: true, data: achievement });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
};
