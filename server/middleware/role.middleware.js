/**
 * Role-based access guard factory.
 * Usage: router.get('/admin-only', protect, requireRole('admin'), controller)
 * @param {...string} roles - Allowed roles
 */
const requireRole = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res
                .status(401)
                .json({ success: false, error: 'Not authenticated' });
        }
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                error: `Access denied — requires role: ${roles.join(' or ')}`,
            });
        }
        next();
    };
};

export default requireRole;
