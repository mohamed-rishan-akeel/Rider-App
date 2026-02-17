const { verifyAccessToken } = require('../config/auth');

/**
 * Middleware to verify JWT access token
 * Extracts token from Authorization header and verifies it
 * Attaches user info to request object
 */
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Access token required',
        });
    }

    try {
        const decoded = verifyAccessToken(token);
        req.user = decoded; // Attach user info to request
        next();
    } catch (error) {
        return res.status(403).json({
            success: false,
            message: 'Invalid or expired token',
            error: error.message,
        });
    }
};

/**
 * Middleware to verify admin API key
 * For testing endpoints only
 */
const authenticateAdmin = (req, res, next) => {
    const apiKey = req.headers['x-api-key'];

    if (!apiKey || apiKey !== process.env.ADMIN_API_KEY) {
        return res.status(401).json({
            success: false,
            message: 'Invalid or missing admin API key',
        });
    }

    next();
};

module.exports = {
    authenticateToken,
    authenticateAdmin,
};
