import jwt from 'jsonwebtoken';

/**
 * Middleware to verify JWT from the httpOnly cookie and attach req.user.
 * Responds with 401 if missing or invalid.
 */
const protect = (req, res, next) => {
    const token = req.cookies?.token;

    if (!token) {
        return res
            .status(401)
            .json({ success: false, error: 'Not authenticated — no token provided' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // { userId, role, iat, exp }
        next();
    } catch (err) {
        return res
            .status(401)
            .json({ success: false, error: 'Token invalid or expired' });
    }
};

export default protect;
